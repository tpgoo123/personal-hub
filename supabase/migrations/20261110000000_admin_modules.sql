-- Personal Hub admin module extensions.
-- Run once in Supabase SQL Editor after reviewing the changes.
begin;

-- The original initializer limited the project to a single admin.
-- Admin user management requires multiple admins, while the Edge Function
-- enforces that the last administrator cannot demote or ban themselves.
drop index if exists public.user_roles_single_admin_idx;

-- Replies are separate records because the original comments table has no
-- reply columns. Only admins can create/update/delete replies.
create table if not exists public.comment_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '网站管理员',
  content text not null check (char_length(content) between 1 and 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comment_replies_comment_created_idx
  on public.comment_replies (comment_id, created_at asc);

drop trigger if exists set_updated_at on public.comment_replies;
create trigger set_updated_at
before update on public.comment_replies
for each row execute procedure public.set_updated_at();

alter table public.comment_replies enable row level security;

revoke all on table public.comment_replies from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.comment_replies to anon, authenticated;
grant insert, update, delete on public.comment_replies to authenticated;

drop policy if exists comment_replies_public_read_approved on public.comment_replies;
create policy comment_replies_public_read_approved
on public.comment_replies
for select to anon, authenticated
using (
  exists (
    select 1 from public.comments c
    where c.id = comment_replies.comment_id
      and (
        c.status = 'approved'
        or c.user_id = (select auth.uid())
      )
  )
  or (select public.is_admin())
);

drop policy if exists comment_replies_admin_insert on public.comment_replies;
create policy comment_replies_admin_insert
on public.comment_replies
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.is_admin())
);

drop policy if exists comment_replies_admin_update on public.comment_replies;
create policy comment_replies_admin_update
on public.comment_replies
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists comment_replies_admin_delete on public.comment_replies;
create policy comment_replies_admin_delete
on public.comment_replies
for delete to authenticated
using ((select public.is_admin()));

commit;
