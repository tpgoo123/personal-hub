import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Edge Function 环境变量未配置。" }, 500);
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "缺少登录凭证。" }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser(token);
  if (callerError || !callerData.user) return json({ error: "登录状态无效，请重新登录。" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const callerId = callerData.user.id;
  const { data: callerRole, error: roleError } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("user_id", callerId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !callerRole) return json({ error: "当前账号没有管理员权限。" }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体不是有效 JSON。" }, 400);
  }

  const action = String(body.action ?? "");

  try {
    if (action === "list") {
      const authUsers = [];
      for (let page = 1; page <= 100; page += 1) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
        if (error) throw error;
        authUsers.push(...data.users);
        if (data.users.length < 100) break;
      }

      const ids = authUsers.map((u) => u.id);
      const [profilesResult, rolesResult] = ids.length
        ? await Promise.all([
            admin.from("profiles").select("id,display_name,avatar_url,bio").in("id", ids),
            admin.from("user_roles").select("user_id,role").in("user_id", ids),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const profiles = new Map<string, { id: string; display_name: string; avatar_url: string | null; bio: string }>(
        (profilesResult.data ?? []).map((p) => [p.id, p] as const),
      );
      const roles = new Map<string, string[]>();
      for (const item of rolesResult.data ?? []) {
        roles.set(item.user_id, [...(roles.get(item.user_id) ?? []), item.role]);
      }

      const users = authUsers.map((u) => {
        const profile = profiles.get(u.id);
        const userRoles = roles.get(u.id) ?? [];
        return {
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          banned_until: u.banned_until ?? null,
          display_name: profile?.display_name ?? u.user_metadata?.display_name ?? (u.email?.split("@")[0] ?? "用户"),
          avatar_url: profile?.avatar_url ?? null,
          bio: profile?.bio ?? "",
          role: userRoles.includes("admin") ? "admin" : "user",
        };
      });

      return json({ users });
    }

    const targetId = String(body.user_id ?? "");
    if (!targetId) return json({ error: "缺少 user_id。" }, 400);

    const { data: targetUserResult, error: targetUserError } = await admin.auth.admin.getUserById(targetId);
    if (targetUserError || !targetUserResult.user) return json({ error: "目标用户不存在。" }, 404);

    const { data: targetRoles, error: targetRolesError } = await admin
      .from("user_roles").select("role").eq("user_id", targetId);
    if (targetRolesError) throw targetRolesError;
    const targetIsAdmin = (targetRoles ?? []).some((x) => x.role === "admin");

    if (action === "ban" || action === "unban") {
      if (targetId === callerId) return json({ error: "不能封禁或解封当前登录账号。" }, 400);
      if (action === "ban" && targetIsAdmin) {
        const { count, error } = await admin.from("user_roles")
          .select("user_id", { count: "exact", head: true }).eq("role", "admin");
        if (error) throw error;
        if ((count ?? 0) <= 1) return json({ error: "不能封禁唯一的管理员账号，以免管理后台失去管理权限。" }, 409);
      }
      const duration = action === "unban" ? "none" : String(body.duration ?? "168h");
      if (action === "ban" && !["24h", "168h", "720h"].includes(duration)) {
        return json({ error: "封禁时长不合法。" }, 400);
      }
      const { data, error } = await admin.auth.admin.updateUserById(targetId, { ban_duration: duration });
      if (error) throw error;
      return json({ success: true, banned_until: data.user.banned_until ?? null });
    }

    if (action === "set-role") {
      const nextRole = String(body.role ?? "");
      if (nextRole !== "user" && nextRole !== "admin") return json({ error: "角色值不合法。" }, 400);
      if (targetId === callerId && nextRole === "user") return json({ error: "不能移除当前登录账号的管理员权限。" }, 400);

      if (nextRole === "admin") {
        if (!targetIsAdmin) {
          const { error } = await admin.from("user_roles").insert({ user_id: targetId, role: "admin" });
          if (error) throw error;
        }
        const { error: removeUserRoleError } = await admin.from("user_roles")
          .delete().eq("user_id", targetId).eq("role", "user");
        if (removeUserRoleError) throw removeUserRoleError;
      } else {
        if (targetIsAdmin) {
          const { count, error } = await admin.from("user_roles")
            .select("user_id", { count: "exact", head: true }).eq("role", "admin");
          if (error) throw error;
          if ((count ?? 0) <= 1) return json({ error: "不能移除最后一个管理员。请先指定另一位管理员。" }, 409);
          const { error: deleteError } = await admin.from("user_roles").delete().eq("user_id", targetId).eq("role", "admin");
          if (deleteError) throw deleteError;
        }
        const { error } = await admin.from("user_roles").upsert({ user_id: targetId, role: "user" }, { onConflict: "user_id,role" });
        if (error) throw error;
      }
      return json({ success: true, role: nextRole });
    }

    return json({ error: "不支持的操作。" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});
