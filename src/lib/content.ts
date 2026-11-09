import { seedData } from './seed'
import { isSupabaseConfigured, supabase } from './supabase'
import { isLocalPreview, loadLocalContent } from './localStore'
import type { SiteData } from '../types'

export async function loadPublicContent(): Promise<SiteData> {
  if (!isSupabaseConfigured || !supabase) {
    if (!isLocalPreview()) return seedData
    const local = loadLocalContent()
    return {
      ...local,
      projects: local.projects.filter((item) => item.is_published),
      publications: local.publications.filter((item) => item.is_published),
      posts: local.posts.filter((item) => item.is_published),
      timeline: local.timeline.filter((item) => item.is_published),
      lifeEntries: local.lifeEntries.filter((item) => item.is_published),
    }
  }
  try {
    const [projects, publications, posts, timeline, lifeEntries, profile] = await Promise.all([
      supabase.from('projects').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('publications').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('posts').select('*').eq('is_published', true).order('published_at', { ascending: false }),
      supabase.from('timeline').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('life_entries').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('site_settings').select('value').eq('key', 'profile').maybeSingle(),
    ])
    const hasErrors = [projects.error, publications.error, posts.error, timeline.error, lifeEntries.error, profile.error].some(Boolean)
    if (hasErrors) return seedData
    return {
      profile: { ...seedData.profile, ...((profile.data?.value as SiteData['profile']) || {}) },
      projects: projects.data || [],
      publications: publications.data || [],
      posts: posts.data || [],
      timeline: timeline.data || [],
      lifeEntries: lifeEntries.data || [],
    }
  } catch {
    return seedData
  }
}

export async function loadAdminContent(): Promise<SiteData> {
  if (!supabase) return loadLocalContent()
  const [projects, publications, posts, timeline, lifeEntries, profile] = await Promise.all([
    supabase.from('projects').select('*').order('sort_order'),
    supabase.from('publications').select('*').order('sort_order'),
    supabase.from('posts').select('*').order('published_at', { ascending: false }),
    supabase.from('timeline').select('*').order('sort_order'),
    supabase.from('life_entries').select('*').order('sort_order'),
    supabase.from('site_settings').select('value').eq('key', 'profile').maybeSingle(),
  ])
  const errors = [projects.error, publications.error, posts.error, timeline.error, lifeEntries.error, profile.error].filter(Boolean)
  if (errors.length) throw errors[0]
  return {
    profile: { ...seedData.profile, ...((profile.data?.value as SiteData['profile']) || {}) },
    projects: projects.data || [], publications: publications.data || [], posts: posts.data || [], timeline: timeline.data || [], lifeEntries: lifeEntries.data || [],
  }
}
