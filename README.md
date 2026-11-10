# Personal Hub V2.0 — 前端第一阶段

技术栈：React + TypeScript + Vite + Supabase JS + React Router（HashRouter）。

## 已包含

- 极简现代浅色首页
- 关于我、项目、论文、博客、生活记录入口
- Supabase 邮箱注册、密码登录、退出登录、找回密码、重置密码
- 登录用户个人中心基础页面
- 管理员路由守卫（从 `user_roles` 读取 `role = admin`）
- 公开内容读取（按 `status = published`）
- 文章详情、评论提交、文章收藏基础交互
- 管理后台数据概览入口
- GitHub Pages Actions 工作流

## 重要说明

这是前端第一阶段启动包。你现有数据库的列定义尚未在本项目中逐列核对，因此：
- 内容列表使用 `select('*')` 并通过常见字段名显示内容；
- 个人资料编辑会根据读取到的 profile 字段名进行匹配；
- 评论、收藏、留言使用已在数据库策略中确认过的字段；
- 管理后台的完整新增、编辑、删除、评论审核和用户管理将在读取完整 SQL schema 后继续实现。

请勿在未核对字段的情况下直接投入正式公开使用。

## 1. 安装 Node.js

建议 Node.js 20 或更高版本。

## 2. 解压并进入项目目录

在 Windows CMD 中进入本文件夹，例如：

```cmd
cd /d D:\xiazai\personal-hub-frontend
```

## 3. 安装依赖

```cmd
npm install
```

如果 npm 提示 `esbuild` 安装脚本尚未获准，且后续构建时报 esbuild 可执行文件缺失，可按 npm 提示执行：

```cmd
npm install-scripts approve esbuild
npm install
```

## 4. 配置 Supabase

复制 `.env.example` 并命名为 `.env.local`：

```cmd
copy .env.example .env.local
```

在 Supabase Dashboard 的 Project Settings → API 中取得：
- Project URL
- Publishable key（或旧项目的 anon public key）

填入 `.env.local`：

```env
VITE_SUPABASE_URL=https://你的项目引用.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=你的Publishable公钥
```

只使用 Publishable / anon 公钥。**绝对不要**填写 `service_role`、Secret key 或数据库密码。

## 5. 配置 Supabase Auth URL

Supabase Dashboard → Authentication → URL Configuration：

- Site URL：本地开发时可先设为 `http://localhost:5173`
- Redirect URLs 添加：
  - `http://localhost:5173/**`
  - `https://你的GitHub用户名.github.io/**`

正式发布后，将 Site URL 更新为实际 GitHub Pages 地址。

## 6. 启动本地网站

```cmd
npm run dev
```

浏览器打开终端显示的本地地址，通常为：

```text
http://localhost:5173
```

## 7. 生产构建

```cmd
npm run build
```

生成的静态文件位于 `dist` 文件夹。

## 8. GitHub Pages 部署

1. 创建 GitHub 公开仓库。
2. 将本项目文件上传到仓库根目录。
3. 在仓库 Settings → Secrets and variables → Actions 添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Settings → Pages → Build and deployment → Source 选择 GitHub Actions。
5. 推送到 `main` 分支，工作流自动构建并部署。

由于使用 HashRouter，网站路由形如 `https://用户名.github.io/#/projects`，适合 GitHub Pages。

## 安全提醒

- 前端环境变量会被打包进公开网页；Publishable / anon key 本来就是可公开使用的客户端 key。
- 数据安全必须由 PostgreSQL RLS、Storage policies 和正确的 grants 保证。
- 绝对不能把 Supabase service_role / Secret key、数据库密码放入 `.env.local` 后提交，或写入任何 `VITE_` 变量。
- 管理员页面的前端路由检查只是用户体验层；最终权限必须由数据库 RLS 验证。


## 9. 管理后台完整模块

当前管理后台包含以下模块：

- 数据概览：注册用户、项目、论文、文章、评论和留言统计。
- 项目管理：复用现有 ProjectsManager，支持项目 CRUD、发布/撤回、封面上传。
- 论文管理：论文 CRUD、作者数组、期刊/会议、年份、类型、摘要、DOI、PDF 和项目链接。
- 博客管理：文章 CRUD、Slug、分类、标签、Markdown 编辑/预览、封面、评论开关和发布状态。
- 评论与留言：评论审核/拒绝/删除/管理员回复；查看和回复用户留言、状态更新与删除。
- 媒体资源：浏览 `site-media`、`user-avatars`、`private-files`，上传、预览、复制链接和删除。
- 用户管理：读取 Auth 用户、资料和角色；通过 Edge Function 封禁/解封、授予/撤销管理员角色。
- 网站设置：编辑 `site_settings` 的首页展示名称、职业头衔、头像文字、介绍、联系邮箱、GitHub 和其他链接。

## 10. 必须执行的数据库迁移

在 Supabase Dashboard → SQL Editor 中打开并执行：

```text
supabase/migrations/20261110000000_admin_modules.sql
```

该迁移只做两件事：

1. 创建 `comment_replies`，因为原始 `comments` 表没有回复字段。
2. 移除原来限制单管理员的 `user_roles_single_admin_idx`，使后台可以管理多个管理员。Edge Function 会阻止移除最后一个管理员，并阻止当前管理员自行降权或封禁自己。

不要重新执行完整的 `01_init_schema.sql`，也不要删除或重建现有业务表。

## 11. 部署用户管理 Edge Function

用户管理中的邮箱列表、封禁/解封和角色变更必须由服务端 Supabase Auth Admin API 执行。前端不会使用 `service_role` 密钥。

在项目根目录执行：

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-users
```

Supabase Edge Functions 会提供 `SUPABASE_URL`、`SUPABASE_ANON_KEY` 和 `SUPABASE_SERVICE_ROLE_KEY` 环境变量。若项目环境中未提供 service role 环境变量，请在 Supabase Dashboard → Edge Functions → Secrets 中配置 `SUPABASE_SERVICE_ROLE_KEY`。该密钥只能保存在服务端 Secrets，不能放进 `.env.local`，也不能使用 `VITE_` 前缀。

函数入口：

```text
supabase/functions/admin-users/index.ts
```

## 12. 本地构建与运行

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

管理后台入口：

```text
http://localhost:5173/#/admin
```

管理后台模块通过 `#/admin?section=papers` 等查询参数保持当前模块，仍使用 HashRouter；正式部署前再统一处理 URL 和服务器路由重写。

## 13. 上线前安全检查

- `.env.local` 不得提交到 Git。
- 前端只使用 Supabase Publishable / anon 公钥。
- `service_role` / Secret key 只能存在于 Edge Function Secrets。
- 所有业务写操作继续由 PostgreSQL RLS 约束。
- 用户封禁和角色管理必须通过 `admin-users` Edge Function。
- 私有文件 `private-files` 使用限时签名 URL，不应将其作为永久公开链接。
