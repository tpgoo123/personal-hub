-- Personal Hub: run this script in Supabase SQL Editor.
-- Public visitors can read published content. Only users listed in site_admins can write.

create extension if not exists pgcrypto;

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null default 'Project',
  summary text not null default '',
  description text not null default '',
  tech_stack text[] not null default '{}',
  highlights text[] not null default '{}',
  cover_url text not null default '',
  github_url text not null default '',
  demo_url text not null default '',
  featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text not null default '',
  year text not null default '',
  status text not null default 'In Progress',
  authors text not null default '',
  abstract text not null default '',
  paper_url text not null default '',
  doi text not null default '',
  tags text[] not null default '{}',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  category text not null default 'Notes',
  cover_url text not null default '',
  tags text[] not null default '{}',
  is_published boolean not null default false,
  published_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline (
  id uuid primary key default gen_random_uuid(),
  date_label text not null,
  title text not null,
  description text not null default '',
  kind text not null default 'Milestone',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table if not exists public.life_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Life',
  date_label text not null default '',
  description text not null default '',
  cover_url text not null default '',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security.
alter table public.site_admins enable row level security;
alter table public.projects enable row level security;
alter table public.publications enable row level security;
alter table public.posts enable row level security;
alter table public.timeline enable row level security;
alter table public.life_entries enable row level security;
alter table public.site_settings enable row level security;

-- Admin list: a signed-in user can only see their own admin membership.
drop policy if exists "Admins can read own membership" on public.site_admins;
create policy "Admins can read own membership" on public.site_admins
  for select to authenticated using (auth.uid() = user_id);

-- Public read access is limited to published content.
drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects" on public.projects
  for select to anon, authenticated using (is_published = true);
drop policy if exists "Admins manage projects" on public.projects;
create policy "Admins manage projects" on public.projects
  for all to authenticated
  using (exists (select 1 from public.site_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.site_admins a where a.user_id = auth.uid()));

drop policy if exists "Public can read published publications" on public.publications;
create policy "Public can read published publications" on public.publications
  for select to anon, authenticated using (is_published = true);
drop policy if exists "Admins manage publications" on public.publications;
create policy "Admins manage publications" on public.publications
  for all to authenticated
  using (exists (select 1 from public.site_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.site_admins a where a.user_id = auth.uid()));

drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts" on public.posts
  for select to anon, authenticated using (is_published = true);
drop policy if exists "Admins manage posts" on public.posts;
create policy "Admins manage posts" on public.posts
  for all to authenticated
  using (exists (select 1 from public.site_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.site_admins a where a.user_id = auth.uid()));

drop policy if exists "Public can read published timeline" on public.timeline;
create policy "Public can read published timeline" on public.timeline
  for select to anon, authenticated using (is_published = true);
drop policy if exists "Admins manage timeline" on public.timeline;
create policy "Admins manage timeline" on public.timeline
  for all to authenticated
  using (exists (select 1 from public.site_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.site_admins a where a.user_id = auth.uid()));


drop policy if exists "Public can read published life entries" on public.life_entries;
create policy "Public can read published life entries" on public.life_entries
  for select to anon, authenticated using (is_published = true);
drop policy if exists "Admins manage life entries" on public.life_entries;
create policy "Admins manage life entries" on public.life_entries
  for all to authenticated
  using (exists (select 1 from public.site_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.site_admins a where a.user_id = auth.uid()));

drop policy if exists "Public can read public settings" on public.site_settings;
create policy "Public can read public settings" on public.site_settings
  for select to anon, authenticated using (is_public = true);
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
  for all to authenticated
  using (exists (select 1 from public.site_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.site_admins a where a.user_id = auth.uid()));

-- Public image bucket. Only admins can upload, update or delete files.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view site media" on storage.objects;
create policy "Public can view site media" on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-media');
drop policy if exists "Admins upload site media" on storage.objects;
create policy "Admins upload site media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-media' and exists (select 1 from public.site_admins a where a.user_id = auth.uid()));
drop policy if exists "Admins update site media" on storage.objects;
create policy "Admins update site media" on storage.objects
  for update to authenticated
  using (bucket_id = 'site-media' and exists (select 1 from public.site_admins a where a.user_id = auth.uid()))
  with check (bucket_id = 'site-media' and exists (select 1 from public.site_admins a where a.user_id = auth.uid()));
drop policy if exists "Admins delete site media" on storage.objects;
create policy "Admins delete site media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-media' and exists (select 1 from public.site_admins a where a.user_id = auth.uid()));

-- Admin setup after creating a user in Authentication > Users:
-- insert into public.site_admins (user_id) values ('YOUR_AUTH_USER_UUID');
