# Personal Hub — Work, Research & Life

A minimal personal digital space with a visual content-management dashboard.

## What's included

- Public personal website: profile, selected projects, publications, notes, life snapshots, timeline and contact.
- Visual CMS: overview, profile editor, projects, publications, Markdown article editor with preview, timeline, life records, search, draft/publish controls, image upload and JSON backup/restore.
- Local preview mode: on `localhost`, `/admin` is available without Supabase. Content is saved in this browser's localStorage and can be exported/imported as JSON. Uploaded local images are compressed before saving.
- Production mode: when Supabase environment variables are configured, the admin uses Supabase email/password authentication and database RLS policies. Public visitors can read published content only.

## Requirements

- Node.js 20 or newer (Node 22/24 LTS recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. If npm reports that the `esbuild` install script is not approved, run `npm install-scripts approve esbuild` once, then run `npm run dev` again.

Then open `http://localhost:5173/admin` to manage the site visually. In local preview mode, no account is required because the dashboard is only enabled on localhost. Content is stored in the current browser, not in a cloud database. Export a JSON backup from **数据与设置** regularly. Clearing browser site data can erase local content.

## Production: connect Supabase

The local preview mode is for editing and testing on your own computer. To publish the site publicly while keeping `/admin` private, connect Supabase:

1. Create a project at https://supabase.com.
2. In Project Settings → API, copy the Project URL and anon / publishable key.
3. Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

4. In Supabase SQL Editor, run the complete `supabase/schema.sql` file.
5. In Supabase Authentication → Users, create your administrator account. Disable public sign-ups for a single-admin site.
6. Copy the user's UUID and run:

```sql
insert into public.site_admins (user_id)
values ('YOUR_AUTH_USER_UUID');
```

7. Restart the dev server. Open `/admin` and sign in. The dashboard will now save to Supabase instead of browser storage.

Never put a Supabase `service_role` key in this frontend project. Only the anon / publishable key belongs in `VITE_SUPABASE_ANON_KEY`; database RLS policies protect write access.

## Content workflow

- Edit profile details, avatar initials or avatar image in **个人资料**.
- Manage projects, publications, posts, timeline and life entries from their respective sections.
- Posts support Markdown headings, lists, blockquotes and fenced code blocks, with an editor/preview switch.
- New content should normally be saved as a draft first. Enable **发布到网站** only after checking the content.
- Project and article covers, life images and profile avatar appear on the public site when published.
- Use **数据与设置 → 导出 JSON 备份** before major changes. Local mode also supports restoring a JSON backup.

## Deploy

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel environment variables.
4. Deploy the Vite `dist/` output.
5. Add the deployed URL to Supabase Authentication → URL Configuration → Redirect URLs.

## Before publishing

Verify every project description, paper title, venue, date, status and external link. Remove any sample entries you do not want public. Only add contact details you are comfortable sharing.
