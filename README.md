# Personal Hub V2.1

一个用于展示个人介绍、项目作品、科研成果、技术文章和生活记录的个人网站，同时提供基于 Supabase 的用户认证与管理后台。

## 技术栈

- **前端**：React 18、TypeScript、Vite 6、React Router 6
- **UI**：自定义 CSS、Lucide React
- **后端服务**：Supabase Auth、PostgreSQL、Storage、Edge Functions、Row Level Security
- **版本管理**：Git / GitHub
- **部署**：Netlify（连接 GitHub `main` 分支，构建产物为 `dist`）

## 功能模块

### 公开网站
- 首页、个人介绍
- 项目作品、科研论文、技术文章、生活记录
- 文章详情、Markdown 内容展示、评论与收藏
- 响应式桌面端与移动端布局

### 用户中心
- 邮箱和密码注册、登录、密码重置
- 个人资料编辑
- 项目/文章收藏与评论统计
- 给网站管理员发送站内留言

### 管理后台
- 数据概览
- 项目管理、论文管理、博客管理
- 评论审核、管理员回复、用户留言处理
- 用户资料、角色与账号封禁管理
- 媒体资源管理
- 网站个人资料与社交链接设置

## 本地开发

建议统一使用 `D:\xiazai\personal-hub-github` 作为唯一 Git 工作目录，不要在原始项目目录和 GitHub 克隆目录之间交替修改。

Windows PowerShell：

```powershell
cd D:\xiazai\personal-hub-github
npm.cmd ci
Copy-Item .env.example .env.local
```

编辑 `.env.local`，填写 Supabase 项目地址和浏览器端公开密钥：

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

旧项目也可以使用 `VITE_SUPABASE_ANON_KEY`。两者配置一个即可。不要把 `service_role` 或 Supabase Secret Key 放入任何 `VITE_` 变量，也不要提交 `.env.local`。

启动本地开发服务器：

```powershell
npm.cmd run dev
```

默认访问 `http://localhost:5173`。

生产构建与类型检查：

```powershell
npm.cmd run build
npm.cmd run typecheck
```

## Supabase 配置说明

1. 在 Supabase Project Settings → API 中获取 Project URL 和 Publishable / anon 公钥。
2. 确认项目原有业务表、Storage buckets、RLS policies 和 `user_roles` 角色数据已经存在。
3. 确认管理员账号在 `user_roles` 表中具有 `role = 'admin'` 的记录。
4. 用户管理依赖 `supabase/functions/admin-users/` Edge Function。该函数使用 Supabase 服务端环境变量完成 Auth Admin API 操作，浏览器端不接触 service role 密钥。
5. `supabase/migrations/20261110000000_admin_modules.sql` 是评论回复及多管理员支持的扩展迁移。只有在确认云端尚未执行时才运行；不要重复执行未经核对的数据库迁移。
6. 如希望注册后直接登录，在 Supabase Authentication 设置中关闭 Confirm email。启用邮件验证时，新用户仍需先完成邮箱验证。

## Netlify 部署

Netlify 连接 GitHub 仓库的 `main` 分支后，会在每次 push 时自动执行：

- Build command：`npm run build`
- Publish directory：`dist`
- Node.js：`22`

在 Netlify Site configuration → Environment variables 中设置：

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable / anon 公钥 |

修改环境变量后需要重新触发部署。`netlify.toml` 已配置 SPA fallback，支持直接访问 `/admin`、`/posts/:id` 等前端路由。

Supabase Authentication → URL Configuration 中应将线上站点设为 Site URL，并在 Redirect URLs 中允许线上地址和本地开发地址，例如：

```text
https://perdt.netlify.app/
https://perdt.netlify.app/**
http://localhost:5173/**
```

## Git 工作流

```powershell
$Repo = "D:\xiazai\personal-hub-github"

git -C $Repo status --short
npm.cmd --prefix $Repo run build
git -C $Repo diff --check
git -C $Repo add -A
git -C $Repo diff --cached --check
git -C $Repo commit -m "feat: refine Personal Hub website"
git -C $Repo push origin main
```

推送前检查暂存区，确认没有提交 `.env.local`、`node_modules`、`dist`、密钥或无关文件。Netlify 显示 Published 后，再检查线上首页、刷新深层路由、登录、管理员后台 CRUD、文件上传和评论交互。

## 安全边界

- 浏览器只使用 Publishable / anon 公钥。
- `service_role` 只能放在 Supabase Edge Function 等受保护的服务端环境中。
- 前端 `AdminRoute` 只负责页面访问体验；数据库 RLS 和 Edge Function 才是最终权限边界。
- 修改数据库前先确认当前云端表结构和迁移执行状态。
- 删除 Storage 文件前确认没有项目、论文或文章正在引用。
