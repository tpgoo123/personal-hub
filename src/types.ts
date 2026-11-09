export type Project = {
  id: string
  title: string
  slug: string
  category: string
  summary: string
  description: string
  tech_stack: string[]
  highlights: string[]
  cover_url: string
  github_url: string
  demo_url: string
  featured: boolean
  is_published: boolean
  sort_order: number
}

export type Publication = {
  id: string
  title: string
  venue: string
  year: string
  status: string
  authors: string
  abstract: string
  paper_url: string
  doi: string
  tags: string[]
  is_published: boolean
  sort_order: number
}

export type Post = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  cover_url: string
  tags: string[]
  is_published: boolean
  published_at: string
}

export type TimelineItem = {
  id: string
  date_label: string
  title: string
  description: string
  kind: string
  is_published: boolean
  sort_order: number
}

export type LifeEntry = {
  id: string
  title: string
  category: string
  date_label: string
  description: string
  cover_url: string
  is_published: boolean
  sort_order: number
}

export type Profile = {
  name: string
  role: string
  tagline: string
  bio: string
  location: string
  email: string
  github: string
  scholar: string
  avatar_url: string
  avatar_mark: string
  focus: string
  about_heading: string
  about_detail: string
  hero_tags: string[]
  status: string
}

export type SiteData = {
  profile: Profile
  projects: Project[]
  publications: Publication[]
  posts: Post[]
  timeline: TimelineItem[]
  lifeEntries: LifeEntry[]
}
