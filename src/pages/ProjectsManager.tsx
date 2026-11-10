
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from 'react'
import {
  Plus, Search, RefreshCw, Edit3, Trash2, Save,
  X, UploadCloud, Star, Eye, EyeOff, ExternalLink,
  FolderKanban, CheckCircle2, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './ProjectsManager.css'

type ProjectStatus = 'draft' | 'published'

type ProjectRow = {
  id: string
  title: string
  slug: string
  summary: string
  description_md: string
  tech_stack: string[]
  cover_image_url: string | null
  repository_url: string | null
  demo_url: string | null
  featured: boolean
  status: string
  sort_order: number
  published_at: string | null
  created_at: string
  updated_at: string
}

type ProjectForm = {
  title: string
  slug: string
  summary: string
  description_md: string
  tech_stack: string
  cover_image_url: string
  repository_url: string
  demo_url: string
  featured: boolean
  status: ProjectStatus
  sort_order: string
}

function emptyForm(): ProjectForm {
  return {
    title: '',
    slug: '',
    summary: '',
    description_md: '',
    tech_stack: '',
    cover_image_url: '',
    repository_url: '',
    demo_url: '',
    featured: false,
    status: 'draft',
    sort_order: '0',
  }
}

function slugify(value: string) {
  const result = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return result || `project-${Date.now()}`
}

function errorText(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }
  return '操作失败，请稍后重试。'
}

function formatDate(value: string | null) {
  if (!value) return '尚未发布'
  return new Date(value).toLocaleDateString('zh-CN')
}

export function ProjectsManager() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null)
  const [form, setForm] = useState<ProjectForm>(emptyForm)

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // 从 Supabase 读取全部项目
  const loadProjects = useCallback(async () => {
    if (!supabase) {
      setError('Supabase 尚未配置，请检查 .env.local。')
      setLoading(false)
      return
    }

    const client = supabase
    setLoading(true)
    setError('')

    try {
      const { data, error } = await client
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error

      setProjects((data ?? []) as ProjectRow[])
    } catch (err) {
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  // 新建项目
  function openCreate() {
    setEditingProject(null)
    setForm(emptyForm())
    setSlugManuallyEdited(false)
    setEditorOpen(true)
    setError('')
    setNotice('')
  }

  // 编辑项目
  function openEdit(project: ProjectRow) {
    setEditingProject(project)
    setSlugManuallyEdited(true)

    setForm({
      title: project.title ?? '',
      slug: project.slug ?? '',
      summary: project.summary ?? '',
      description_md: project.description_md ?? '',
      tech_stack: (project.tech_stack ?? []).join(', '),
      cover_image_url: project.cover_image_url ?? '',
      repository_url: project.repository_url ?? '',
      demo_url: project.demo_url ?? '',
      featured: Boolean(project.featured),
      status: project.status === 'published' ? 'published' : 'draft',
      sort_order: String(project.sort_order ?? 0),
    })

    setEditorOpen(true)
    setError('')
    setNotice('')
  }

  function closeEditor() {
    if (saving || uploading) return
    setEditorOpen(false)
    setEditingProject(null)
    setForm(emptyForm())
  }

  // 更新表单
  function updateField<K extends keyof ProjectForm>(
    key: K,
    value: ProjectForm[K]
  ) {
    setForm(current => ({
      ...current,
      [key]: value,
    }))
  }

  function handleTitleChange(value: string) {
    setForm(current => ({
      ...current,
      title: value,
      slug: slugManuallyEdited ? current.slug : slugify(value),
    }))
  }

  // 上传项目封面到 site-media
  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件。')
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('图片不能超过 25 MB。')
      return
    }

    if (!supabase) {
      setError('Supabase 尚未配置。')
      return
    }

    const client = supabase
    setUploading(true)
    setError('')
    setNotice('')

    try {
      const safeName = file.name.replace(/[^\w.-]+/g, '-')
      const path = `projects/${Date.now()}-${safeName}`

      const bucket = client.storage.from('site-media')

      const { error: uploadError } = await bucket.upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

      if (uploadError) throw uploadError

      const { data } = bucket.getPublicUrl(path)

      updateField('cover_image_url', data.publicUrl)

      setNotice('项目封面上传成功。')
    } catch (err) {
      setError(
        `封面上传失败：${errorText(err)}。你也可以直接填写图片公开 URL。`
      )
    } finally {
      setUploading(false)
    }
  }

  // 保存项目
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || saving || uploading) return

    const client = supabase

    if (!form.title.trim()) {
      setError('项目名称不能为空。')
      return
    }

    if (!form.slug.trim()) {
      setError('项目 URL 标识不能为空。')
      return
    }

    const techStack = [
      ...new Set(
        form.tech_stack
          .split(/[,，]/)
          .map(item => item.trim())
          .filter(Boolean)
      ),
    ]

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      summary: form.summary.trim(),
      description_md: form.description_md.trim(),
      tech_stack: techStack,
      cover_image_url: form.cover_image_url.trim() || null,
      repository_url: form.repository_url.trim() || null,
      demo_url: form.demo_url.trim() || null,
      featured: form.featured,
      status: form.status,
      sort_order: Math.max(0, Number(form.sort_order) || 0),
      published_at:
        form.status === 'published'
          ? editingProject?.published_at ?? new Date().toISOString()
          : null,
      updated_at: new Date().toISOString(),
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      if (editingProject) {
        const { data, error } = await client
          .from('projects')
          .update(payload)
          .eq('id', editingProject.id)
          .select('id')
          .maybeSingle()

        if (error) throw error
        if (!data) throw new Error('没有更新记录，请检查管理员权限。')

        setNotice('项目修改成功。')
      } else {
        const { data, error } = await client
          .from('projects')
          .insert(payload)
          .select('id')
          .single()

        if (error) throw error
        if (!data) throw new Error('项目创建失败，没有返回记录。')

        setNotice('项目创建成功。')
      }

      setEditorOpen(false)
      setEditingProject(null)
      setForm(emptyForm())

      await loadProjects()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  // 发布或撤回项目
  async function togglePublish(project: ProjectRow) {
    if (!supabase || actionBusyId) return

    const client = supabase
    const nextStatus: ProjectStatus =
      project.status === 'published' ? 'draft' : 'published'

    setActionBusyId(project.id)
    setError('')
    setNotice('')

    try {
      const { data, error } = await client
        .from('projects')
        .update({
          status: nextStatus,
          published_at:
            nextStatus === 'published'
              ? new Date().toISOString()
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('状态修改失败，请检查管理员权限。')

      setNotice(
        nextStatus === 'published'
          ? `《${project.title}》已发布。`
          : `《${project.title}》已撤回为草稿。`
      )

      await loadProjects()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setActionBusyId(null)
    }
  }

  // 删除项目
  async function deleteProject(project: ProjectRow) {
    if (!supabase || actionBusyId) return

    const confirmed = window.confirm(
      `确定删除项目「${project.title}」吗？此操作无法撤销。`
    )

    if (!confirmed) return

    const client = supabase
    setActionBusyId(project.id)
    setError('')
    setNotice('')

    try {
      const { data, error } = await client
        .from('projects')
        .delete()
        .eq('id', project.id)
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('删除失败，请检查管理员权限。')

      setNotice(`项目「${project.title}」已删除。`)
      await loadProjects()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setActionBusyId(null)
    }
  }

  // 搜索与筛选
  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return projects.filter(project => {
      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter

      const searchable = [
        project.title,
        project.slug,
        project.summary,
        ...(project.tech_stack ?? []),
      ].join(' ').toLowerCase()

      return matchesStatus && (!keyword || searchable.includes(keyword))
    })
  }, [projects, search, statusFilter])

  const publishedCount = projects.filter(
    project => project.status === 'published'
  ).length

  const draftCount = projects.filter(
    project => project.status !== 'published'
  ).length

  return (
    <div className="projects-manager">

      {/* 页面标题 */}
      <div className="pm-heading">
        <div>
          <span className="pm-eyebrow">PERSONAL HUB / PROJECTS</span>
          <h1>项目管理</h1>
          <p>创建、编辑和发布你的项目作品。</p>
        </div>

        <button className="pm-primary-button" onClick={openCreate}>
          <Plus size={17} />
          新建项目
        </button>
      </div>

      {/* 状态统计 */}
      <div className="pm-stats">
        <div className="pm-stat-card">
          <span>全部项目</span>
          <strong>{projects.length}</strong>
        </div>
        <div className="pm-stat-card">
          <span>已发布</span>
          <strong>{publishedCount}</strong>
        </div>
        <div className="pm-stat-card">
          <span>草稿</span>
          <strong>{draftCount}</strong>
        </div>
        <div className="pm-stat-card">
          <span>精选项目</span>
          <strong>{projects.filter(p => p.featured).length}</strong>
        </div>
      </div>

      {/* 消息 */}
      {error && (
        <div className="pm-alert pm-error">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="pm-alert pm-success">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
        </div>
      )}

      {/* 编辑表单 */}
      {editorOpen && (
        <section className="pm-editor">
          <div className="pm-editor-heading">
            <div>
              <h2>{editingProject ? '编辑项目' : '新建项目'}</h2>
              <p>填写项目资料，完成后保存或发布。</p>
            </div>
            <button
              className="pm-icon-button"
              onClick={closeEditor}
              type="button"
              title="关闭"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="pm-form-grid">

              <label className="pm-field">
                <span>项目名称 *</span>
                <input
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="例如：智能轮胎字符检测系统"
                  required
                  maxLength={200}
                />
              </label>

              <label className="pm-field">
                <span>URL 标识（Slug）*</span>
                <input
                  value={form.slug}
                  onChange={e => {
                    setSlugManuallyEdited(true)
                    updateField(
                      'slug',
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                    )
                  }}
                  placeholder="tire-recognition-system"
                  required
                  maxLength={200}
                />
                <small>建议使用英文、数字和连字符，必须保持唯一。</small>
              </label>

              <label className="pm-field pm-full">
                <span>项目简介</span>
                <textarea
                  rows={3}
                  value={form.summary}
                  onChange={e => updateField('summary', e.target.value)}
                  placeholder="用一两句话介绍项目的目标和核心功能..."
                  maxLength={1000}
                />
              </label>

              <label className="pm-field pm-full">
                <span>项目详细介绍（支持 Markdown）</span>
                <textarea
                  rows={8}
                  value={form.description_md}
                  onChange={e => updateField('description_md', e.target.value)}
                  placeholder={'## 项目背景\n\n介绍项目背景...\n\n## 核心功能\n\n介绍主要功能...'}
                />
              </label>

              <label className="pm-field pm-full">
                <span>技术栈</span>
                <input
                  value={form.tech_stack}
                  onChange={e => updateField('tech_stack', e.target.value)}
                  placeholder="Python, PyTorch, YOLOv8, OpenCV"
                />
                <small>多个技术名称使用英文逗号或中文逗号分隔。</small>
              </label>

              <div className="pm-field pm-full">
                <span>项目封面</span>

                {form.cover_image_url && (
                  <div className="pm-cover-preview">
                    <img src={form.cover_image_url} alt="项目封面预览" />
                    <button
                      type="button"
                      onClick={() => updateField('cover_image_url', '')}
                    >
                      <X size={14} /> 移除封面地址
                    </button>
                  </div>
                )}

                <input
                  value={form.cover_image_url}
                  onChange={e =>
                    updateField('cover_image_url', e.target.value)
                  }
                  placeholder="https://... 图片公开 URL"
                />

                <label className="pm-upload-button">
                  <UploadCloud size={17} />
                  {uploading ? '正在上传…' : '上传本地图片'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadCover}
                    disabled={uploading}
                  />
                </label>

                <small>
                  上传目标为 site-media Bucket；如果 Storage 权限不允许上传，
                  可以直接填写已有图片 URL。
                </small>
              </div>

              <label className="pm-field">
                <span>GitHub / 仓库地址</span>
                <input
                  type="url"
                  value={form.repository_url}
                  onChange={e =>
                    updateField('repository_url', e.target.value)
                  }
                  placeholder="https://github.com/..."
                />
              </label>

              <label className="pm-field">
                <span>项目演示地址</span>
                <input
                  type="url"
                  value={form.demo_url}
                  onChange={e => updateField('demo_url', e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="pm-field">
                <span>排序权重</span>
                <input
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={e => updateField('sort_order', e.target.value)}
                />
                <small>数值越小，排序越靠前。</small>
              </label>

              <label className="pm-field">
                <span>发布状态</span>
                <select
                  value={form.status}
                  onChange={e =>
                    updateField('status', e.target.value as ProjectStatus)
                  }
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                </select>
              </label>

              <label className="pm-featured-field">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={e => updateField('featured', e.target.checked)}
                />
                <Star size={17} />
                <span>设为精选项目</span>
              </label>
            </div>

            <div className="pm-form-actions">
              <button
                type="button"
                className="pm-secondary-button"
                onClick={closeEditor}
                disabled={saving || uploading}
              >
                取消
              </button>

              <button
                type="submit"
                className="pm-primary-button"
                disabled={saving || uploading}
              >
                <Save size={16} />
                {saving
                  ? '正在保存…'
                  : form.status === 'published'
                    ? '保存并发布'
                    : '保存草稿'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 搜索及筛选 */}
      <div className="pm-toolbar">
        <div className="pm-search">
          <Search size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索项目名称、简介或技术栈..."
          />
        </div>

        <select
          className="pm-filter"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
        </select>

        <button
          className="pm-refresh-button"
          onClick={() => void loadProjects()}
          disabled={loading}
          title="刷新项目"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* 项目列表 */}
      <div className="pm-list">
        <div className="pm-list-heading">
          <h2>项目列表</h2>
          <span>共 {filteredProjects.length} 个项目</span>
        </div>

        {loading ? (
          <div className="pm-empty">正在读取项目数据…</div>
        ) : filteredProjects.length === 0 ? (
          <div className="pm-empty">
            <FolderKanban size={34} />
            <strong>暂无项目</strong>
            <span>可以点击右上角「新建项目」创建第一条项目记录。</span>
          </div>
        ) : (
          <div className="pm-project-list">
            {filteredProjects.map(project => (
              <article className="pm-project-card" key={project.id}>
                <div className="pm-project-cover">
                  {project.cover_image_url ? (
                    <img src={project.cover_image_url} alt="" />
                  ) : (
                    <FolderKanban size={29} />
                  )}
                </div>

                <div className="pm-project-info">
                  <div className="pm-project-title-row">
                    <h3>{project.title}</h3>
                    {project.featured && (
                      <span className="pm-featured-tag">
                        <Star size={12} /> 精选
                      </span>
                    )}
                    <span
                      className={`pm-status ${
                        project.status === 'published'
                          ? 'published'
                          : 'draft'
                      }`}
                    >
                      {project.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </div>

                  <p>{project.summary || '暂无项目简介'}</p>

                  <div className="pm-tech-list">
                    {(project.tech_stack ?? []).slice(0, 6).map(tech => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>

                  <div className="pm-project-meta">
                    <span>创建：{formatDate(project.created_at)}</span>
                    <span>排序：{project.sort_order}</span>
                    <span>发布：{formatDate(project.published_at)}</span>
                  </div>
                </div>

                <div className="pm-project-actions">
                  <button
                    onClick={() => openEdit(project)}
                    title="编辑项目"
                    className="pm-action-button"
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    onClick={() => void togglePublish(project)}
                    title={project.status === 'published' ? '撤回发布' : '发布项目'}
                    className="pm-action-button"
                    disabled={actionBusyId === project.id}
                  >
                    {project.status === 'published'
                      ? <EyeOff size={16} />
                      : <Eye size={16} />}
                  </button>

                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      title="打开演示"
                      className="pm-action-button"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}

                  <button
                    onClick={() => void deleteProject(project)}
                    title="删除项目"
                    className="pm-action-button danger"
                    disabled={actionBusyId === project.id}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
