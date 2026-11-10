import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { BookOpen, ExternalLink, Eye, EyeOff, FileText, Pencil, Plus, RefreshCw, Save, Search, Star, Trash2, UploadCloud, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import '../admin/AdminModules.css'

type PaperStatus = 'draft' | 'published' | 'archived'
type PaperRow = {
  id: string
  title: string
  authors: string[]
  venue: string | null
  publication_year: number | null
  paper_type: string | null
  abstract: string
  doi: string | null
  pdf_url: string | null
  project_url: string | null
  status: PaperStatus
  featured: boolean
  sort_order: number
  published_at: string | null
  created_at: string
  updated_at: string
}
type PaperForm = {
  title: string
  authors: string
  venue: string
  publication_year: string
  paper_type: string
  abstract: string
  doi: string
  pdf_url: string
  project_url: string
  status: PaperStatus
  featured: boolean
  sort_order: string
}
const emptyForm = (): PaperForm => ({
  title: '', authors: '', venue: '', publication_year: '', paper_type: '',
  abstract: '', doi: '', pdf_url: '', project_url: '', status: 'draft',
  featured: false, sort_order: '0',
})
const errText = (e: unknown) => e instanceof Error ? e.message : String((e as {message?: string})?.message ?? '操作失败')
const dateText = (v: string | null) => v ? new Date(v).toLocaleDateString('zh-CN') : '—'

export function PapersManager() {
  const [rows, setRows] = useState<PaperRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editor, setEditor] = useState(false)
  const [editing, setEditing] = useState<PaperRow | null>(null)
  const [form, setForm] = useState<PaperForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase 尚未配置。'); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const { data, error } = await supabase.from('papers').select('*')
        .order('sort_order', { ascending: true })
        .order('publication_year', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      setRows((data ?? []) as PaperRow[])
    } catch (e) { setError(errText(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(row => {
      const statusOk = filter === 'all' || row.status === filter
      const text = [row.title, row.venue ?? '', row.paper_type ?? '', row.abstract, ...(row.authors ?? [])].join(' ').toLowerCase()
      return statusOk && (!q || text.includes(q))
    })
  }, [rows, search, filter])

  function set<K extends keyof PaperForm>(key: K, value: PaperForm[K]) {
    setForm(old => ({ ...old, [key]: value }))
  }
  function openCreate() { setEditing(null); setForm(emptyForm()); setEditor(true); setError(''); setNotice('') }
  function openEdit(row: PaperRow) {
    setEditing(row)
    setForm({
      title: row.title ?? '', authors: (row.authors ?? []).join(', '), venue: row.venue ?? '',
      publication_year: row.publication_year == null ? '' : String(row.publication_year),
      paper_type: row.paper_type ?? '', abstract: row.abstract ?? '', doi: row.doi ?? '',
      pdf_url: row.pdf_url ?? '', project_url: row.project_url ?? '', status: row.status,
      featured: Boolean(row.featured), sort_order: String(row.sort_order ?? 0),
    })
    setEditor(true); setError(''); setNotice('')
  }

  async function uploadPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') { setError('请选择 PDF 文件。'); return }
    if (file.size > 25 * 1024 * 1024) { setError('PDF 文件不能超过 25 MB。'); return }
    if (!supabase) { setError('Supabase 尚未配置。'); return }
    setUploading(true); setError(''); setNotice('')
    try {
      const name = file.name.replace(/[^\w.-]+/g, '-')
      const path = `papers/${Date.now()}-${name}`
      const bucket = supabase.storage.from('site-media')
      const { error } = await bucket.upload(path, file, { upsert: false, contentType: 'application/pdf', cacheControl: '3600' })
      if (error) throw error
      const { data } = bucket.getPublicUrl(path)
      set('pdf_url', data.publicUrl)
      setNotice('论文 PDF 上传成功。')
    } catch (e) { setError(`PDF 上传失败：${errText(e)}`) }
    finally { setUploading(false) }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || saving || uploading) return
    if (!form.title.trim()) { setError('论文标题不能为空。'); return }
    const year = form.publication_year.trim() ? Number(form.publication_year) : null
    if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2200)) { setError('发表年份必须在 1900–2200 之间。'); return }
    const authors = [...new Set(form.authors.split(/[,，;\n]+/).map(x => x.trim()).filter(Boolean))]
    const payload = {
      title: form.title.trim(), authors, venue: form.venue.trim() || null,
      publication_year: year, paper_type: form.paper_type.trim() || null,
      abstract: form.abstract.trim(), doi: form.doi.trim() || null,
      pdf_url: form.pdf_url.trim() || null, project_url: form.project_url.trim() || null,
      status: form.status, featured: form.featured,
      sort_order: Math.max(0, Number(form.sort_order) || 0),
      published_at: form.status === 'published' ? editing?.published_at ?? new Date().toISOString() : null,
    }
    setSaving(true); setError(''); setNotice('')
    try {
      if (editing) {
        const { data, error } = await supabase.from('papers').update(payload).eq('id', editing.id).select('id').maybeSingle()
        if (error) throw error
        if (!data) throw new Error('没有更新记录，请检查管理员权限。')
        setNotice('论文修改成功。')
      } else {
        const { error } = await supabase.from('papers').insert(payload).select('id').single()
        if (error) throw error
        setNotice('论文创建成功。')
      }
      setEditor(false); setEditing(null); setForm(emptyForm())
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setSaving(false) }
  }

  async function toggleStatus(row: PaperRow) {
    if (!supabase || busyId) return
    const next: PaperStatus = row.status === 'published' ? 'draft' : 'published'
    setBusyId(row.id); setError(''); setNotice('')
    try {
      const { error } = await supabase.from('papers').update({
        status: next, published_at: next === 'published' ? row.published_at ?? new Date().toISOString() : null,
      }).eq('id', row.id)
      if (error) throw error
      setNotice(next === 'published' ? `《${row.title}》已发布。` : `《${row.title}》已撤回。`)
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  async function remove(row: PaperRow) {
    if (!supabase || busyId) return
    if (!window.confirm(`确定删除论文「${row.title}」吗？此操作无法撤销。`)) return
    setBusyId(row.id); setError(''); setNotice('')
    try {
      const { error } = await supabase.from('papers').delete().eq('id', row.id)
      if (error) throw error
      setNotice(`论文「${row.title}」已删除。`)
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  const published = rows.filter(x => x.status === 'published').length
  const drafts = rows.filter(x => x.status === 'draft').length
  const archived = rows.filter(x => x.status === 'archived').length

  return (
    <div className="am-module">
      <div className="am-heading">
        <div><span className="am-eyebrow">PERSONAL HUB / RESEARCH</span><h1>论文管理</h1><p>维护论文成果、发表信息、DOI 与全文文件。</p></div>
        <button className="am-primary" onClick={openCreate}><Plus size={15}/>新增论文</button>
      </div>

      <div className="am-stats">
        <div className="am-stat"><span>全部论文</span><strong>{rows.length}</strong></div>
        <div className="am-stat"><span>已发布</span><strong>{published}</strong></div>
        <div className="am-stat"><span>草稿</span><strong>{drafts}</strong></div>
        <div className="am-stat"><span>已归档</span><strong>{archived}</strong></div>
      </div>

      {error && <div className="am-notice error">{error}</div>}
      {notice && <div className="am-notice success">{notice}</div>}

      {editor && (
        <section className="am-editor">
          <div className="am-editor-head"><div><h2>{editing ? '编辑论文' : '新增论文'}</h2><p>字段对应现有 papers 表，不会额外写入未定义列。</p></div><button className="am-icon" type="button" onClick={() => setEditor(false)}><X size={16}/></button></div>
          <form onSubmit={save}>
            <div className="am-form-grid">
              <label className="am-field am-full"><span>论文标题 *</span><input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={500} placeholder="输入论文完整标题"/></label>
              <label className="am-field am-full"><span>作者</span><textarea rows={2} value={form.authors} onChange={e => set('authors', e.target.value)} placeholder="多个作者用逗号或换行分隔"/></label>
              <label className="am-field"><span>期刊 / 会议</span><input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="例如 IEEE TGRS / AAAI"/></label>
              <label className="am-field"><span>发表年份</span><input type="number" min="1900" max="2200" value={form.publication_year} onChange={e => set('publication_year', e.target.value)} placeholder="2026"/></label>
              <label className="am-field"><span>论文类型</span><input value={form.paper_type} onChange={e => set('paper_type', e.target.value)} placeholder="期刊论文 / 会议论文 / 预印本"/></label>
              <label className="am-field"><span>排序权重</span><input type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', e.target.value)}/><small>数值越小，排序越靠前。</small></label>
              <label className="am-field am-full"><span>摘要</span><textarea rows={6} value={form.abstract} onChange={e => set('abstract', e.target.value)} placeholder="论文摘要"/></label>
              <label className="am-field"><span>DOI</span><input value={form.doi} onChange={e => set('doi', e.target.value)} placeholder="10.xxxx/xxxxx 或 DOI URL"/></label>
              <label className="am-field"><span>项目 / 代码地址</span><input type="url" value={form.project_url} onChange={e => set('project_url', e.target.value)} placeholder="https://github.com/..."/></label>
              <div className="am-field am-full">
                <span>论文 PDF</span>
                <input value={form.pdf_url} onChange={e => set('pdf_url', e.target.value)} placeholder="PDF 公开 URL"/>
                <label className="am-upload"><UploadCloud size={15}/>{uploading ? '上传中…' : '上传 PDF'}<input type="file" accept="application/pdf,.pdf" onChange={uploadPdf} disabled={uploading}/></label>
                <small>上传到现有 site-media Bucket，单个文件最大 25 MB。</small>
              </div>
              <div className="am-field am-full">
                <span>发布状态</span>
                <select value={form.status} onChange={e => set('status', e.target.value as PaperStatus)}>
                  <option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已归档</option>
                </select>
              </div>
              <div className="am-checks am-full">
                <label className="am-check"><input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)}/>设为精选论文</label>
              </div>
            </div>
            <div className="am-form-actions">
              <button type="button" className="am-secondary" onClick={() => setEditor(false)} disabled={saving || uploading}>取消</button>
              <button type="submit" className="am-primary" disabled={saving || uploading}><Save size={15}/>{saving ? '保存中…' : '保存论文'}</button>
            </div>
          </form>
        </section>
      )}

      <div className="am-toolbar">
        <div className="am-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索标题、作者、期刊或摘要"/></div>
        <select className="am-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">全部状态</option><option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已归档</option>
        </select>
        <button className="am-icon" title="刷新" onClick={() => void load()} disabled={loading}><RefreshCw size={15}/></button>
      </div>

      <div className="am-table-wrap">
        <table className="am-table">
          <thead><tr><th>论文</th><th>期刊 / 会议</th><th>年份</th><th>状态</th><th>精选</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="am-empty">正在加载论文…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={6} className="am-empty">没有符合条件的论文记录。</td></tr> :
              filtered.map(row => (
                <tr key={row.id}>
                  <td className="am-title-cell">{row.title}<span className="am-subtext">{(row.authors ?? []).join(', ') || '作者未填写'}</span></td>
                  <td>{row.venue || '—'}<span className="am-subtext">{row.paper_type || ''}</span></td>
                  <td>{row.publication_year ?? '—'}</td>
                  <td><span className={`am-badge ${row.status}`}>{row.status === 'published' ? '已发布' : row.status === 'archived' ? '已归档' : '草稿'}</span></td>
                  <td>{row.featured ? <Star size={15} fill="currentColor" color="#b28c43"/> : '—'}</td>
                  <td><div className="am-row-actions">
                    {row.pdf_url && <a className="am-icon" href={row.pdf_url} target="_blank" rel="noreferrer" title="查看 PDF"><FileText size={14}/></a>}
                    {row.project_url && <a className="am-icon" href={row.project_url} target="_blank" rel="noreferrer" title="项目地址"><ExternalLink size={14}/></a>}
                    <button className="am-icon" onClick={() => openEdit(row)} title="编辑"><Pencil size={14}/></button>
                    <button className="am-icon" onClick={() => void toggleStatus(row)} disabled={busyId === row.id} title={row.status === 'published' ? '撤回' : '发布'}>{row.status === 'published' ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                    <button className="am-icon" onClick={() => void remove(row)} disabled={busyId === row.id} title="删除"><Trash2 size={14}/></button>
                  </div></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
