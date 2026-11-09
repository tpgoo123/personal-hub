import { seedData } from './seed'
import type { SiteData } from '../types'

const STORAGE_KEY = 'personal-hub-content-v1'

export const isLocalPreview = () => ['localhost', '127.0.0.1'].includes(window.location.hostname)

export function loadLocalContent(): SiteData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(seedData)
    const parsed = JSON.parse(raw) as Partial<SiteData>
    return {
      ...structuredClone(seedData),
      ...parsed,
      profile: { ...seedData.profile, ...(parsed.profile || {}) },
      projects: Array.isArray(parsed.projects) ? parsed.projects : structuredClone(seedData.projects),
      publications: Array.isArray(parsed.publications) ? parsed.publications : structuredClone(seedData.publications),
      posts: Array.isArray(parsed.posts) ? parsed.posts : structuredClone(seedData.posts),
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : structuredClone(seedData.timeline),
      lifeEntries: Array.isArray(parsed.lifeEntries) ? parsed.lifeEntries : structuredClone(seedData.lifeEntries),
    }
  } catch {
    return structuredClone(seedData)
  }
}

export function saveLocalContent(data: SiteData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    throw new Error('浏览器本地存储空间不足。请压缩图片，或先导出备份后移除不需要的图片。')
  }
}

export function exportContentBackup(data: SiteData) {
  const blob = new Blob([JSON.stringify({ app: 'Personal Hub', version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `personal-hub-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件。')
  if (file.size > 12 * 1024 * 1024) throw new Error('图片不能超过 12MB。')

  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取图片失败。'))
    reader.onload = () => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('无法解析这张图片。'))
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })

  const maxSide = 1200
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器无法处理图片。')
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  const result = canvas.toDataURL('image/webp', 0.68)
  if (result.length > 1_000_000) throw new Error('压缩后的图片仍然较大，请换一张图片。')
  return result
}

export function validateSiteData(value: unknown): value is SiteData {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SiteData>
  return Boolean(candidate.profile && Array.isArray(candidate.projects) && Array.isArray(candidate.publications)
    && Array.isArray(candidate.posts) && Array.isArray(candidate.timeline) && Array.isArray(candidate.lifeEntries))
}
