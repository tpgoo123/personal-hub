import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Eye, EyeOff, FileText, Pencil, Plus, RefreshCw, Save, Search, Star, Trash2, UploadCloud, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { MarkdownPreview } from '../../components/MarkdownPreview'
import './AdminModules.css'

type PostStatus = 'draft' | 'published' | 'archived'
type PostRow = {
  id: string; title: string; slug: string; excerpt: string; body_markdown: string
  category: string; tags: string[]; cover_image_url: string | null; status: PostStatus
  allow_comments: boolean; featured: boolean; published_at: string | null
  created_at: string; updated_at: string
}
type PostForm = {
  title: string; slug: string; excerpt: string; body_markdown: string
  category: string; tags: string; cover_image_url: string; status: PostStatus
  allow_comments: boolean; featured: boolean
}
const blank = (): PostForm => ({
  title: '', slug: '', excerpt: '', body_markdown: '', category: '技术',
  tags: '', cover_image_url: '', status: 'draft', allow_comments: true, featured: false,
})
const errorText = (e: unknown) => e instanceof Error ? e.message : String((e as {message?: string})?.message ?? '操作失败')
function slugify(value: string) {
  const slug = value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug || `post-${Date.now()}`
}

export function PostsManager() {
  const [rows, setRows] = useState<PostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editor, setEditor] = useState(false)
  const [editing, setEditing] = useState<PostRow | null>(null)
  const [form, setForm] = useState<PostForm>(blank)
  const [slugManual, setSlugManual] = useState(false)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase 尚未配置。'); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const { data, error } = await supabase.from('posts').select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      setRows((data ?? []) as PostRow[])
    } catch (e) { setError(errorText(e)) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(row => {
      const statusOk = filter === 'all' || row.status === filter
      const text = [row.title, row.slug, row.excerpt, row.body_markdown, row.category, ...(row.tags ?? [])].join(' ').toLowerCase()
      return statusOk && (!q || text.includes(q))
    })
  }, [rows, search, filter])

  function set<K extends keyof PostForm>(key: K, value: PostForm[K]) { setForm(old => ({ ...old, [key]: value })) }
  function openCreate() { setEditing(null); setForm(blank()); setSlugManual(false); setPreview(false); setEditor(true); setError(''); setNotice('') }
  function openEdit(row: PostRow) {
    setEditing(row); setSlugManual(true); setPreview(false)
    setForm({
      title: row.title ?? '', slug: row.slug ?? '', excerpt: row.excerpt ?? '',
      body_markdown: row.body_markdown ?? '', category: row.category ?? '技术',
      tags: (row.tags ?? []).join(', '), cover_image_url: row.cover_image_url ?? '',
      status: row.status, allow_comments: Boolean(row.allow_comments), featured: Boolean(row.featured),
    })
    setEditor(true); setError(''); setNotice('')
  }
  function changeTitle(value: string) {
    setForm(old => ({ ...old, title: value, slug: slugManual ? old.slug : slugify(value) }))
  }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('请选择图片文件。'); return }
    if (file.size > 25 * 1024 * 1024) { setError('图片不能超过 25 MB。'); return }
    if (!supabase) return
    setUploading(true); setError('')
    try {
      const path = `posts/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '-')}`
      const bucket = supabase.storage.from('site-media')
      const { error } = await bucket.upload(path, file, { upsert: false, contentType: file.type, cacheControl: '3600' })
      if (error) throw error
      set('cover_image_url', bucket.getPublicUrl(path).data.publicUrl)
      setNotice('文章封面上传成功。')
    } catch (e) { setError(`封面上传失败：${errorText(e)}`) }
    finally { setUploading(false) }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || saving || uploading) return
    if (!form.title.trim()) { setError('文章标题不能为空。'); return }
    if (!form.slug.trim()) { setError('文章 URL 标识不能为空。'); return }
    const payload = {
      title: form.title.trim(), slug: form.slug.trim(), excerpt: form.excerpt.trim(),
      body_markdown: form.body_markdown, category: form.category.trim() || '技术',
      tags: [...new Set(form.tags.split(/[,，;\n]+/).map(x => x.trim()).filter(Boolean))],
      cover_image_url: form.cover_image_url.trim() || null, status: form.status,
      allow_comments: form.allow_comments, featured: form.featured,
      published_at: form.status === 'published' ? editing?.published_at ?? new Date().toISOString() : null,
    }
    setSaving(true); setError(''); setNotice('')
    try {
      if (editing) {
        const { data, error } = await supabase.from('posts').update(payload).eq('id', editing.id).select('id').maybeSingle()
        if (error) throw error
        if (!data) throw new Error('没有更新记录，请检查管理员权限。')
        setNotice('文章修改成功。')
      } else {
        const { error } = await supabase.from('posts').insert(payload).select('id').single()
        if (error) throw error
        setNotice('文章创建成功。')
      }
      setEditor(false); setEditing(null); setForm(blank()); await load()
    } catch (e) { setError(errorText(e)) }
    finally { setSaving(false) }
  }

  async function toggleStatus(row: PostRow) {
    if (!supabase || busyId) return
    const next: PostStatus = row.status === 'published' ? 'draft' : 'published'
    setBusyId(row.id); setError(''); setNotice('')
    try {
      const { error } = await supabase.from('posts').update({
        status: next, published_at: next === 'published' ? row.published_at ?? new Date().toISOString() : null,
      }).eq('id', row.id)
      if (error) throw error
      setNotice(next === 'published' ? `《${row.title}》已发布。` : `《${row.title}》已撤回。`)
      await load()
    } catch (e) { setError(errorText(e)) }
    finally { setBusyId(null) }
  }
  async function remove(row: PostRow) {
    if (!supabase || busyId) return
    if (!window.confirm(`确定删除文章「${row.title}」吗？评论和收藏会随文章级联删除。`)) return
    setBusyId(row.id); setError('')
    try {
      const { error } = await supabase.from('posts').delete().eq('id', row.id)
      if (error) throw error
      setNotice(`文章「${row.title}」已删除。`); await load()
    } catch (e) { setError(errorText(e)) }
    finally { setBusyId(null) }
  }

  const published = rows.filter(x => x.status === 'published').length
  const drafts = rows.filter(x => x.status === 'draft').length

  return (
    <div className="am-module">
      <div className="am-heading">
        <div><span className="am-eyebrow">PERSONAL HUB / BLOG</span><h1>博客管理</h1><p>使用 Markdown 编写技术文章，管理分类、标签和评论开放状态。</p></div>
        <button className="am-primary" onClick={openCreate}><Plus size={15}/>新建文章</button>
      </div>
      <div className="am-stats">
        <div className="am-stat"><span>全部文章</span><strong>{rows.length}</strong></div>
        <div className="am-stat"><span>已发布</span><strong>{published}</strong></div>
        <div className="am-stat"><span>草稿</span><strong>{drafts}</strong></div>
        <div className="am-stat"><span>精选文章</span><strong>{rows.filter(x => x.featured).length}</strong></div>
      </div>
      {error && <div className="am-notice error">{error}</div>}
      {notice && <div className="am-notice success">{notice}</div>}

      {editor && (
        <section className="am-editor">
          <div className="am-editor-head"><div><h2>{editing ? '编辑文章' : '新建文章'}</h2><p>文章正文保存到 posts.body_markdown。</p></div><button className="am-icon" type="button" onClick={() => setEditor(false)}><X size={16}/></button></div>
          <form onSubmit={save}>
            <div className="am-form-grid">
              <label className="am-field am-full"><span>文章标题 *</span><input required maxLength={240} value={form.title} onChange={e => changeTitle(e.target.value)} placeholder="输入文章标题"/></label>
              <label className="am-field"><span>URL 标识（Slug）*</span><input required value={form.slug} onChange={e => { setSlugManual(true); set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')) }} placeholder="my-first-post"/><small>只能使用英文、数字和连字符，且必须唯一。</small></label>
              <label className="am-field"><span>文章分类</span><input value={form.category} onChange={e => set('category', e.target.value)} placeholder="技术"/></label>
              <label className="am-field am-full"><span>文章摘要</span><textarea rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="列表页展示的简短摘要"/></label>
              <div className="am-field am-full">
                <span>文章正文（Markdown）</span>
                <div className="am-inline-tabs"><button type="button" className={`am-tab ${!preview ? 'active' : ''}`} onClick={() => setPreview(false)}>编辑</button><button type="button" className={`am-tab ${preview ? 'active' : ''}`} onClick={() => setPreview(true)}>预览</button></div>
                {preview ? <div className="am-preview-box"><MarkdownPreview value={form.body_markdown} emptyText="输入 Markdown 后将在这里预览。"/></div> :
                  <textarea rows={16} value={form.body_markdown} onChange={e => set('body_markdown', e.target.value)} placeholder={'# 文章标题\n\n在这里编写 Markdown 正文...\n\n## 小节标题\n\n- 列表项\n- 列表项'}/>}
              </div>
              <label className="am-field"><span>标签</span><input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="AI, Python, Research"/><small>使用逗号分隔多个标签。</small></label>
              <label className="am-field"><span>发布状态</span><select value={form.status} onChange={e => set('status', e.target.value as PostStatus)}><option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已归档</option></select></label>
              <div className="am-field am-full">
                <span>文章封面</span>
                {form.cover_image_url && <div className="am-cover-preview"><img src={form.cover_image_url} alt="封面预览"/><button type="button" className="am-danger" onClick={() => set('cover_image_url', '')}><X size={13}/>移除</button></div>}
                <input value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} placeholder="封面图片公开 URL"/>
                <label className="am-upload"><UploadCloud size={15}/>{uploading ? '上传中…' : '上传图片'}<input type="file" accept="image/*" onChange={uploadCover} disabled={uploading}/></label>
              </div>
              <div className="am-checks am-full">
                <label className="am-check"><input type="checkbox" checked={form.allow_comments} onChange={e => set('allow_comments', e.target.checked)}/>允许评论</label>
                <label className="am-check"><input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)}/>设为精选</label>
              </div>
            </div>
            <div className="am-form-actions"><button type="button" className="am-secondary" onClick={() => setEditor(false)} disabled={saving || uploading}>取消</button><button type="submit" className="am-primary" disabled={saving || uploading}><Save size={15}/>{saving ? '保存中…' : '保存文章'}</button></div>
          </form>
        </section>
      )}

      <div className="am-toolbar">
        <div className="am-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索标题、正文、分类或标签"/></div>
        <select className="am-select" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">全部状态</option><option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已归档</option></select>
        <button className="am-icon" title="刷新" onClick={() => void load()} disabled={loading}><RefreshCw size={15}/></button>
      </div>
      <div className="am-table-wrap">
        <table className="am-table">
          <thead><tr><th>文章</th><th>分类 / 标签</th><th>状态</th><th>评论</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="am-empty">正在加载文章…</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="am-empty">暂无文章记录。</td></tr> :
              filtered.map(row => <tr key={row.id}>
                <td className="am-title-cell">{row.title}{row.featured && <span className="am-subtext">★ 精选</span>}<span className="am-subtext">/{row.slug} · {row.published_at ? new Date(row.published_at).toLocaleDateString('zh-CN') : '未发布'}</span></td>
                <td>{row.category}<span className="am-subtext">{(row.tags ?? []).join(' · ')}</span></td>
                <td><span className={`am-badge ${row.status}`}>{row.status === 'published' ? '已发布' : row.status === 'archived' ? '已归档' : '草稿'}</span></td>
                <td>{row.allow_comments ? '允许' : '关闭'}</td>
                <td><div className="am-row-actions">
                  <button className="am-icon" title="编辑" onClick={() => openEdit(row)}><Pencil size={14}/></button>
                  <button className="am-icon" title={row.status === 'published' ? '撤回' : '发布'} disabled={busyId === row.id} onClick={() => void toggleStatus(row)}>{row.status === 'published' ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                  <button className="am-icon" title="删除" disabled={busyId === row.id} onClick={() => void remove(row)}><Trash2 size={14}/></button>
                </div></td>
              </tr>)
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
