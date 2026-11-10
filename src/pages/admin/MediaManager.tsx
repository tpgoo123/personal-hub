import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Copy, ExternalLink, FileImage, FileText, FolderOpen, RefreshCw, Trash2, UploadCloud, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './AdminModules.css'

type BucketName = 'site-media' | 'user-avatars' | 'private-files'
type MediaFile = {
  bucket: BucketName
  name: string
  path: string
  created_at?: string
  size?: number
  mimeType?: string
  url?: string
}
const bucketOptions: { value: BucketName; label: string }[] = [
  { value: 'site-media', label: '网站公开资源' },
  { value: 'user-avatars', label: '用户头像' },
  { value: 'private-files', label: '私有文件' },
]
const errText = (e: unknown) => e instanceof Error ? e.message : String((e as {message?: string})?.message ?? '操作失败')
const sizeText = (bytes?: number) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function MediaManager() {
  const [bucket, setBucket] = useState<BucketName>('site-media')
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState<MediaFile | null>(null)
  const [busyPath, setBusyPath] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase 尚未配置。'); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const client = supabase
      const collected: MediaFile[] = []
      async function walk(path: string, depth: number) {
        if (depth > 4) return
        const { data, error } = await client.storage.from(bucket).list(path, {
          limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' },
        })
        if (error) throw error
        for (const item of data ?? []) {
          const fullPath = path ? `${path}/${item.name}` : item.name
          if (!item.id && !item.metadata) {
            await walk(fullPath, depth + 1)
          } else {
            const isPrivate = bucket === 'private-files'
            let url = ''
            if (isPrivate) {
              const signed = await client.storage.from(bucket).createSignedUrl(fullPath, 3600)
              if (!signed.error) url = signed.data.signedUrl
            } else {
              url = client.storage.from(bucket).getPublicUrl(fullPath).data.publicUrl
            }
            collected.push({
              bucket, name: item.name, path: fullPath,
              created_at: item.created_at ?? item.updated_at ?? undefined,
              size: typeof item.metadata?.size === 'number' ? item.metadata.size : undefined,
              mimeType: item.metadata?.mimetype ?? undefined, url,
            })
          }
        }
      }
      await walk('', 0)
      collected.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      setFiles(collected)
    } catch (e) { setError(errText(e)) }
    finally { setLoading(false) }
  }, [bucket])

  useEffect(() => { void load() }, [load])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return files.filter(file => !q || file.path.toLowerCase().includes(q) || (file.mimeType ?? '').toLowerCase().includes(q))
  }, [files, search])

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !supabase) return
    const allowed = bucket === 'user-avatars'
      ? file.type.startsWith('image/')
      : bucket === 'private-files'
        ? file.type.startsWith('image/') || file.type === 'application/pdf'
        : file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!allowed) { setError(bucket === 'user-avatars' ? '用户头像 Bucket 仅允许图片。' : '该 Bucket 仅允许图片或 PDF。'); return }
    const max = bucket === 'user-avatars' ? 5 : bucket === 'private-files' ? 20 : 25
    if (file.size > max * 1024 * 1024) { setError(`文件不能超过 ${max} MB。`); return }
    setUploading(true); setError(''); setNotice('')
    try {
      const safe = file.name.replace(/[^\w.-]+/g, '-')
      const path = `admin/${Date.now()}-${safe}`
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: false, contentType: file.type, cacheControl: '3600',
      })
      if (error) throw error
      setNotice(`文件已上传到 ${bucket}。`)
      await load()
    } catch (e) { setError(`上传失败：${errText(e)}`) }
    finally { setUploading(false) }
  }

  async function remove(file: MediaFile) {
    if (!supabase || busyPath) return
    if (!window.confirm(`确定删除文件「${file.path}」吗？引用该文件的内容封面可能会失效。`)) return
    setBusyPath(file.path); setError(''); setNotice('')
    try {
      const { error } = await supabase.storage.from(file.bucket).remove([file.path])
      if (error) throw error
      setNotice(`文件「${file.name}」已删除。`)
      if (preview?.path === file.path) setPreview(null)
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyPath(null) }
  }

  async function copyUrl(file: MediaFile) {
    if (!file.url) { setError('无法生成文件访问地址。'); return }
    try { await navigator.clipboard.writeText(file.url); setNotice('文件访问地址已复制。') }
    catch { setError('复制失败，请手动打开文件并复制地址。') }
  }

  const images = visible.filter(x => (x.mimeType ?? '').startsWith('image/')).length
  const pdfs = visible.filter(x => x.mimeType === 'application/pdf' || x.name.toLowerCase().endsWith('.pdf')).length

  return (
    <div className="am-module">
      <div className="am-heading">
        <div><span className="am-eyebrow">PERSONAL HUB / ASSETS</span><h1>媒体资源</h1><p>管理网站图片、用户头像和私有附件。删除资源前请确认没有页面正在引用。</p></div>
        <label className="am-primary" style={{cursor: uploading ? 'wait' : 'pointer'}}><UploadCloud size={15}/>{uploading ? '上传中…' : '上传文件'}<input type="file" hidden accept={bucket === 'user-avatars' ? 'image/*' : 'image/*,application/pdf'} onChange={upload} disabled={uploading}/></label>
      </div>
      <div className="am-stats">
        <div className="am-stat"><span>当前资源</span><strong>{visible.length}</strong></div>
        <div className="am-stat"><span>图片</span><strong>{images}</strong></div>
        <div className="am-stat"><span>PDF 文件</span><strong>{pdfs}</strong></div>
        <div className="am-stat"><span>当前 Bucket</span><strong style={{fontSize:15}}>{bucket}</strong></div>
      </div>
      {error && <div className="am-notice error">{error}</div>}
      {notice && <div className="am-notice success">{notice}</div>}
      <div className="am-toolbar">
        <select className="am-select" value={bucket} onChange={e => setBucket(e.target.value as BucketName)}>{bucketOptions.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select>
        <div className="am-search"><FolderOpen size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文件名或路径"/></div>
        <button className="am-icon" title="刷新" onClick={() => void load()} disabled={loading}><RefreshCw size={15}/></button>
      </div>
      {bucket === 'private-files' && <div className="am-notice info">私有文件使用限时签名 URL 访问，链接默认 1 小时后过期，不会生成永久公开地址。</div>}
      {loading ? <div className="am-panel am-empty">正在读取 Storage 文件…</div> : visible.length === 0 ? <div className="am-panel am-empty">当前 Bucket 暂无文件。可以上传图片或 PDF。</div> :
        <div className="am-media-grid">
          {visible.map(file => {
            const isImage = (file.mimeType ?? '').startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.name)
            return <article className="am-media-card" key={`${file.bucket}:${file.path}`}>
              <button type="button" className="am-media-thumb" onClick={() => isImage && setPreview(file)} title={isImage ? '预览图片' : '文件预览'}>
                {isImage && file.url ? <img src={file.url} alt={file.name}/> : file.name.toLowerCase().endsWith('.pdf') ? <FileText size={34}/> : <FileImage size={34}/>}
              </button>
              <div className="am-media-name" title={file.path}>{file.name}</div>
              <div className="am-media-meta">{sizeText(file.size)} · {file.mimeType || '未知类型'}</div>
              <div className="am-media-actions">
                <button className="am-icon" title="复制访问地址" onClick={() => void copyUrl(file)}><Copy size={13}/></button>
                {file.url && <a className="am-icon" href={file.url} target="_blank" rel="noreferrer" title="打开文件"><ExternalLink size={13}/></a>}
                <button className="am-icon" title="删除文件" onClick={() => void remove(file)} disabled={busyPath === file.path}><Trash2 size={13}/></button>
              </div>
            </article>
          })}
        </div>
      }
      {preview && <div className="am-modal-backdrop" onClick={() => setPreview(null)}><div className="am-modal" onClick={e => e.stopPropagation()}><div className="am-panel-heading"><strong>{preview.name}</strong><button className="am-icon" onClick={() => setPreview(null)}><X size={15}/></button></div><img src={preview.url} alt={preview.name}/></div></div>}
    </div>
  )
}
