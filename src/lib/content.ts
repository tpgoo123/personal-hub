
import { supabase } from './supabase'

export type ContentKind =
  | 'projects'
  | 'papers'
  | 'posts'
  | 'life_entries'
  | 'timeline_entries'

export type ContentRow = Record<string, any> & {
  id?: string
  status?: string
}

export type SiteSettings = {
  id: string
  display_name: string
  professional_title: string
  avatar_text: string
  introduction: string
  contact_email: string | null
  github_url: string | null
  other_links: Record<string, unknown>
  updated_at: string
}

export const contentConfig: Record<
  ContentKind,
  { label: string; singular: string; description: string }
> = {
  projects: {
    label: '项目作品',
    singular: '项目',
    description: '记录实践项目、技术方案与作品成果。',
  },
  papers: {
    label: '科研论文',
    singular: '论文',
    description: '整理研究方向、论文成果与学术进展。',
  },
  posts: {
    label: '技术博客',
    singular: '文章',
    description: '分享开发经验、技术笔记和研究思考。',
  },
  life_entries: {
    label: '生活记录',
    singular: '记录',
    description: '保存日常片段、兴趣与生活体验。',
  },
  timeline_entries: {
    label: '成长时间轴',
    singular: '经历',
    description: '记录学习、工作与个人成长的重要节点。',
  },
}

// 获取个人网站基本信息
export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'main')
    .maybeSingle()

  if (error) throw error

  return data as SiteSettings | null
}

// 获取已发布内容
export async function fetchPublished(
  kind: ContentKind,
  limit = 50
): Promise<ContentRow[]> {
  if (!supabase) return []

  let query = supabase
    .from(kind)
    .select('*')
    .eq('status', 'published')

  if (kind === 'projects' || kind === 'papers') {
    query = query
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false })
  } else if (kind === 'posts') {
    query = query.order('published_at', { ascending: false })
  } else if (kind === 'life_entries') {
    query = query.order('happened_on', { ascending: false })
  } else {
    query = query.order('event_date', { ascending: false })
  }

  const { data, error } = await query.limit(limit)

  if (error) throw error

  return (data ?? []) as ContentRow[]
}

// 获取已发布内容数量
export async function fetchPublishedCount(
  kind: ContentKind
): Promise<number> {
  if (!supabase) return 0

  const { count, error } = await supabase
    .from(kind)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (error) throw error

  return count ?? 0
}

export function pickText(
  row: ContentRow,
  keys: string[],
  fallback = ''
): string {
  for (const key of keys) {
    const value = row?.[key]

    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return fallback
}

export function titleOf(
  row: ContentRow,
  fallback = '未命名内容'
): string {
  return pickText(
    row,
    ['title', 'name', 'project_name', 'paper_title', 'post_title'],
    fallback
  )
}

export function summaryOf(row: ContentRow): string {
  return pickText(
    row,
    [
      'summary',
      'description',
      'excerpt',
      'abstract',
      'introduction',
      'description_md',
      'body_markdown',
      'content',
    ],
    '暂无简介'
  )
}


// 兼容项目封面、普通图片和生活记录图片数组
export function imageOf(row: ContentRow): string {
  const image = pickText(row, [
    'cover_image_url',
    'cover_url',
    'cover_image',
    'image_url',
    'thumbnail_url',
    'avatar_url',
  ])

  if (image) return image

  const images = row?.image_urls

  if (Array.isArray(images) && typeof images[0] === 'string') {
    return images[0]
  }

  return ''
}


export function dateOf(row: ContentRow): string {
  return pickText(row, [
    'published_at',
    'happened_on',
    'event_date',
    'created_at',
    'date',
  ])
}
