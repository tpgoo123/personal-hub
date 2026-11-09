import { useEffect, useState } from 'react'
import type { ReactNode, FormEvent } from 'react'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, BriefcaseBusiness, Check, ChevronDown,
  Code2, ExternalLink, FileText, Github, GraduationCap, Heart, Layers3, LockKeyhole, Mail,
  Menu, Plus, Save, Settings2, ShieldCheck, Sparkles, X, LogOut, LayoutDashboard, FolderKanban,
  ImagePlus, Trash2, Pencil, Eye, EyeOff, Upload, RefreshCw, CircleHelp, Clock3, Send,
  Database, Download, FileUp, Search,
} from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import type { SiteData, Project, Publication, Post, TimelineItem, Profile } from './types'
import { seedData } from './lib/seed'
import { loadAdminContent, loadPublicContent } from './lib/content'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { compressImageToDataUrl, exportContentBackup, isLocalPreview, loadLocalContent, saveLocalContent, validateSiteData } from './lib/localStore'

type AdminTab = 'overview' | 'projects' | 'publications' | 'posts' | 'timeline' | 'life' | 'profile' | 'settings'
type ContentKind = Exclude<AdminTab, 'overview' | 'profile' | 'settings'>

const navItems = [
  { label: '首页', href: '#home' }, { label: '关于', href: '#about' }, { label: '项目', href: '#projects' },
  { label: '科研', href: '#research' }, { label: '笔记', href: '#journal' }, { label: '生活', href: '#life' },
]

function App() {
  const adminRoute = window.location.pathname.replace(/\/$/, '') === '/admin'
  return adminRoute ? <AdminApp /> : <PublicApp />
}

function PublicApp() {
  const [data, setData] = useState<SiteData>(seedData)
  const [menuOpen, setMenuOpen] = useState(false)
  const [detail, setDetail] = useState<Project | Post | null>(null)
  const [detailType, setDetailType] = useState<'project' | 'post'>('project')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPublicContent().then(setData).finally(() => setLoading(false))
  }, [])

  const profile = data.profile
  const taglineParts = profile.tagline.split(/[，,]/, 2)
  const aboutParts = (profile.about_heading || '对复杂问题保持耐心，对新鲜事物保持好奇。').split(/[，,]/, 2)
  const featured = data.projects.filter((item) => item.featured).slice(0, 4)
  const publishedPosts = data.posts.slice(0, 3)
  const projectCount = data.projects.length
  const researchCount = data.publications.length

  const openProject = (item: Project) => { setDetail(item); setDetailType('project') }
  const openPost = (item: Post) => { setDetail(item); setDetailType('post') }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Personal Hub 首页">
          <span className="brand-mark">P.</span><span className="brand-name">PERSONAL HUB<span className="brand-dot">.</span></span>
        </a>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          {navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
        </nav>
        <div className="header-actions">
          <a className="admin-link" href="/admin"><LockKeyhole size={14} /> 管理入口</a>
          <button className="mobile-menu" onClick={() => setMenuOpen((v) => !v)} aria-label="切换导航">{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main>
        <section className="hero section-wrap" id="home">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> PERSONAL SPACE <span className="eyebrow-year">/ 2026</span></div>
            <h1>{taglineParts[0]}{taglineParts.length > 1 ? <><br /><em>{taglineParts[1]}</em></> : null}</h1>
            <p className="hero-lead">你好，我是 <strong>{profile.name}</strong>。</p>
            <p className="hero-description">{profile.bio}</p>
            <div className="hero-tags">{(profile.hero_tags || ['AI Research', 'Engineering', 'Curiosity']).map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="hero-actions">
              <a className="button button-dark" href="#projects">探索我的项目 <ArrowUpRight size={16} /></a>
              <a className="text-link" href="#about">更多关于我 <ArrowDownRight size={16} /></a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <div className="hero-grid" />
            <div className="hero-card-main">
              <div className="hero-card-top"><span className="tiny-label">A LITTLE ABOUT ME</span><span className="status-dot" /></div>
              <div className="avatar-art">{profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name} /> : <span>{profile.avatar_mark || 'TP'}</span>}<div className="avatar-spark">✳</div></div>
              <div className="hero-card-name">{profile.name}</div>
              <div className="hero-card-role">{profile.role}</div>
              <div className="hero-card-divider" />
              <div className="hero-card-bottom"><span><span className="live-dot" /> {profile.status}</span><ArrowUpRight size={16} /></div>
            </div>
            <div className="floating-note note-top"><Sparkles size={14} /> Stay curious</div>
            <div className="floating-note note-bottom"><span className="note-index">01</span> Build · Learn · Share</div>
            <span className="visual-caption">A SPACE TO THINK, MAKE & GROW</span>
          </div>
        </section>

        <section className="stats-strip section-wrap" aria-label="个人概览">
          <div className="stat-intro"><span className="section-kicker">AT A GLANCE</span><p>一些正在持续积累的<br />小小里程碑。</p></div>
          <div className="stat-item"><strong>{String(projectCount).padStart(2, '0')}<sup>+</sup></strong><span>PROJECTS</span></div>
          <div className="stat-item"><strong>{String(researchCount).padStart(2, '0')}</strong><span>RESEARCH</span></div>
          <div className="stat-item"><strong>{String(data.posts.length).padStart(2, '0')}<sup>+</sup></strong><span>NOTES</span></div>
          <div className="stat-aside">不断尝试，<br />持续输出。<ArrowUpRight size={16} /></div>
        </section>

        <section className="section-block section-wrap" id="about">
          <SectionHeading number="01" eyebrow="A BIT ABOUT ME" title="关于我" subtitle="保持好奇，认真做事，也认真生活。" />
          <div className="about-grid">
            <div className="about-statement"><span className="quote-mark">“</span><h2>{aboutParts[0]}{aboutParts.length > 1 ? <><br /><em>{aboutParts[1]}</em></> : null}</h2></div>
            <div className="about-content"><p>{profile.bio}</p><p>{profile.about_detail || '我喜欢在研究与实践之间建立连接，把有价值的过程整理成可复用的知识与作品。'}</p>
              <div className="about-meta"><div><span>FOCUS</span><strong>{profile.focus || 'AI · Computer Vision · Recommendation'}</strong></div><div><span>BASED IN</span><strong>{profile.location || 'China'}</strong></div></div>
              <a className="inline-link" href="#contact">和我聊聊 <ArrowUpRight size={15} /></a>
            </div>
          </div>
        </section>

        <section className="section-block projects-section" id="projects">
          <div className="section-wrap">
            <SectionHeading number="02" eyebrow="SELECTED WORK" title="项目作品" subtitle="从研究想法到工程实践，让每一个想法落地。" action={<a className="inline-link" href="/admin">管理项目 <ArrowUpRight size={15} /></a>} />
            <div className="project-grid">
              {featured.map((item, index) => <ProjectCard key={item.id} project={item} index={index} onClick={() => openProject(item)} />)}
            </div>
            {featured.length === 0 && <EmptyPublic text="项目内容正在整理中，敬请期待。" />}
          </div>
        </section>

        <section className="section-block section-wrap" id="research">
          <SectionHeading number="03" eyebrow="RESEARCH & PUBLICATIONS" title="科研与探索" subtitle="记录问题、方法与阶段性成果。" />
          <div className="research-layout">
            <div className="research-intro"><div className="research-icon"><GraduationCap size={23} /></div><h3>Research<br /><em>is a journey.</em></h3><p>关注模型设计、实验验证与真实问题之间的联系。这里收录研究方向、论文成果与正在探索的课题。</p><div className="research-topics"><span>Temporal Action Detection</span><span>Federated Recommendation</span><span>Remote Sensing</span></div></div>
            <div className="publication-list">
              {data.publications.map((paper, index) => <PublicationRow key={paper.id} paper={paper} index={index} />)}
              {data.publications.length === 0 && <EmptyPublic text="科研成果正在整理中。" />}
            </div>
          </div>
        </section>

        <section className="section-block journal-section" id="journal">
          <div className="section-wrap">
            <SectionHeading number="04" eyebrow="NOTES & JOURNAL" title="笔记与记录" subtitle="把思考写下来，让经验可以被再次使用。" action={<a className="inline-link" href="/admin">写一篇文章 <ArrowUpRight size={15} /></a>} />
            <div className="journal-grid">
              {publishedPosts.map((post, index) => <button className="journal-card" key={post.id} onClick={() => openPost(post)}>
                <div className={`journal-art art-${index % 3}`}>{post.cover_url && <img className="journal-cover-image" src={post.cover_url} alt="" />}<span className="art-stamp">{String(index + 1).padStart(2, '0')}</span><BookOpen size={28} strokeWidth={1.2} /><span className="art-caption">FIELD NOTES / {post.category.toUpperCase()}</span></div>
                <div className="journal-meta"><span>{post.category}</span><span>{post.published_at || 'Recently'}</span></div>
                <h3>{post.title}</h3><p>{post.excerpt}</p><span className="read-more">阅读全文 <ArrowUpRight size={14} /></span>
              </button>)}
              {publishedPosts.length === 0 && <EmptyPublic text="第一篇文章正在路上。" />}
            </div>
          </div>
        </section>

        <section className="section-block section-wrap" id="life">
          <SectionHeading number="05" eyebrow="BEYOND THE SCREEN" title="生活切片" subtitle="工作之外，也有值得认真对待的日常。" />
          <div className="life-grid">
            {data.lifeEntries.slice(0, 3).map((entry, index) => <div className={`life-card ${index === 0 ? 'life-large' : index === 1 ? 'life-medium' : 'life-dark'}`} key={entry.id} style={entry.cover_url ? { backgroundImage: `linear-gradient(180deg, rgba(20,27,22,.08), rgba(20,27,22,.78)), url(${entry.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><div className={`life-symbol ${index === 0 ? 'symbol-sun' : index === 1 ? 'symbol-book' : 'symbol-game'}`}>{index === 0 ? '✳' : index === 1 ? '⌁' : '◈'}</div><span className="life-label">{String(index + 1).padStart(2, '0')} / {entry.date_label || entry.category.toUpperCase()}</span><h3>{entry.title}</h3><p>{entry.description}</p><span className="life-foot">{entry.category.toUpperCase()}</span></div>)}
            {data.lifeEntries.length === 0 && <EmptyPublic text="生活记录正在整理中。" />}
          </div>
        </section>

        <section className="section-block timeline-section">
          <div className="section-wrap">
            <SectionHeading number="06" eyebrow="THE JOURNEY SO FAR" title="一路走来" subtitle="不急着定义终点，先认真记录每一步。" />
            <div className="timeline-list">
              {data.timeline.map((item) => <div className="timeline-item" key={item.id}><span className="timeline-date">{item.date_label}</span><span className="timeline-point" /><div><h3>{item.title}</h3><p>{item.description}</p></div><span className="timeline-kind">{item.kind}</span></div>)}
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="section-wrap contact-inner"><span className="section-kicker">HAVE A GOOD IDEA?</span><h2>让我们从一次<br /><em>有趣的交流开始。</em></h2><p>无论是技术交流、项目合作，还是一个值得讨论的新想法，都欢迎联系我。</p>
            <div className="contact-actions">{profile.email ? <a className="button button-light" href={`mailto:${profile.email}`}>发送邮件 <Mail size={16} /></a> : <a className="button button-light" href="/admin">设置联系方式 <Settings2 size={16} /></a>}{profile.github && <a className="contact-social" href={profile.github} target="_blank" rel="noreferrer"><Github size={17} /> GitHub <ArrowUpRight size={14} /></a>}{profile.scholar && <a className="contact-social" href={profile.scholar} target="_blank" rel="noreferrer"><GraduationCap size={17} /> Scholar <ArrowUpRight size={14} /></a>}</div>
          </div>
        </section>
      </main>

      <footer className="site-footer section-wrap"><a className="brand" href="#home"><span className="brand-mark">P.</span><span className="brand-name">PERSONAL HUB<span className="brand-dot">.</span></span></a><span>© {new Date().getFullYear()} {profile.name}. Made with curiosity.</span><a href="#home" className="back-top">BACK TO TOP ↑</a></footer>
      {loading && <div className="loading-indicator">正在整理个人空间…</div>}
      {detail && <DetailModal item={detail} type={detailType} onClose={() => setDetail(null)} />}
    </div>
  )
}

function SectionHeading({ number, eyebrow, title, subtitle, action }: { number: string; eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="section-heading"><div className="heading-left"><div className="heading-eyebrow"><span>{number}</span>{eyebrow}</div><h2>{title}</h2><p>{subtitle}</p></div>{action && <div className="heading-action">{action}</div>}</div>
}

function ProjectCard({ project, index, onClick }: { project: Project; index: number; onClick: () => void }) {
  const tones = ['project-visual-blue', 'project-visual-sand', 'project-visual-lilac', 'project-visual-green']
  const icons = [<Code2 />, <Layers3 />, <BriefcaseBusiness />, <FolderKanban />]
  return <button className="project-card" onClick={onClick}>
    <div className={`project-visual ${tones[index % tones.length]}`}>{project.cover_url && <img className="project-cover-image" src={project.cover_url} alt="" />}<div className="project-visual-grid" /><span className="project-number">PROJECT / {String(index + 1).padStart(2, '0')}</span><div className="project-visual-icon">{icons[index % icons.length]}</div><span className="project-open"><ArrowUpRight size={18} /></span></div>
    <div className="project-card-body"><div className="project-category">{project.category}</div><h3>{project.title}</h3><p>{project.summary}</p><div className="tag-list">{project.tech_stack.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
  </button>
}

function PublicationRow({ paper, index }: { paper: Publication; index: number }) {
  return <div className="publication-row"><div className="publication-index">{String(index + 1).padStart(2, '0')}</div><div className="publication-main"><div className="publication-top"><span>{paper.venue}</span><span>{paper.year}</span></div><h3>{paper.title}</h3>{paper.abstract && <p>{paper.abstract}</p>}<div className="publication-bottom"><span className={`publication-status ${paper.status.toLowerCase().replaceAll(' ', '-')}`}>{paper.status}</span>{paper.tags.slice(0, 3).map((tag) => <span className="publication-tag" key={tag}>{tag}</span>)}</div></div><div className="publication-arrow">{paper.paper_url ? <a href={paper.paper_url} target="_blank" rel="noreferrer" aria-label="查看论文"><ExternalLink size={16} /></a> : <FileText size={17} />}</div></div>
}

function EmptyPublic({ text }: { text: string }) { return <div className="empty-public"><CircleHelp size={18} /><span>{text}</span></div> }

function DetailModal({ item, type, onClose }: { item: Project | Post; type: 'project' | 'post'; onClose: () => void }) {
  const isProject = type === 'project'
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="detail-modal"><button className="modal-close" onClick={onClose}><X size={18} /></button><span className="section-kicker">{isProject ? (item as Project).category : (item as Post).category}</span><h2>{item.title}</h2><p className="detail-summary">{isProject ? (item as Project).summary : (item as Post).excerpt}</p><div className="detail-divider" />{isProject ? <><p>{(item as Project).description}</p><h4>项目亮点</h4><ul>{(item as Project).highlights.map((x) => <li key={x}>{x}</li>)}</ul><h4>技术栈</h4><div className="tag-list">{(item as Project).tech_stack.map((x) => <span key={x}>{x}</span>)}</div></> : <div className="detail-content"><MarkdownPreview content={(item as Post).content} /></div>}</div></div>
}

function AdminApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let active = true
    async function verify() {
      if (!session || !supabase) { setAuthorized(false); return }
      setCheckingAdmin(true)
      const { data, error } = await supabase.from('site_admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      if (active) { setAuthorized(Boolean(data && !error)); setCheckingAdmin(false) }
    }
    verify()
    return () => { active = false }
  }, [session])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
  }

  const signOut = async () => { await supabase?.auth.signOut(); setAuthorized(false) }

  if (!isSupabaseConfigured && isLocalPreview()) return <AdminDashboard email="本地管理员" localMode onSignOut={() => { window.location.href = '/' }} />
  if (!isSupabaseConfigured) return <SetupScreen />
  if (authLoading || checkingAdmin) return <div className="admin-loading"><div className="spinner" />正在验证管理权限…</div>
  if (!session) return <LoginScreen onSignIn={signIn} error={authError} />
  if (!authorized) return <AccessDenied email={session.user.email || ''} onSignOut={signOut} />
  return <AdminDashboard email={session.user.email || ''} onSignOut={signOut} />
}

function SetupScreen() {
  return <div className="setup-page"><a className="brand" href="/"><span className="brand-mark">P.</span><span className="brand-name">PERSONAL HUB<span className="brand-dot">.</span></span></a><div className="setup-card"><div className="setup-icon"><Settings2 size={24} /></div><span className="section-kicker">ADMIN SETUP</span><h1>管理后台还差一步配置。</h1><p>公开主页可以直接预览。要启用安全的私人管理后台，需要先连接 Supabase，为管理员账号和内容数据库配置权限。</p><ol><li>在 Supabase 创建一个项目。</li><li>复制项目 URL 和 anon key，填写到 <code>.env</code>。</li><li>在 SQL Editor 执行项目中的 <code>supabase/schema.sql</code>。</li><li>创建管理员账号，并将该账号 UUID 加入 <code>site_admins</code> 表。</li></ol><a className="button button-dark" href="/">返回公开主页 <ArrowUpRight size={16} /></a><p className="setup-foot">详细步骤请查看项目根目录 README.md。</p></div></div>
}

function LoginScreen({ onSignIn, error }: { onSignIn: (email: string, password: string) => void; error: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); await onSignIn(email, password); setBusy(false) }
  return <div className="login-page"><a className="brand" href="/"><span className="brand-mark">P.</span><span className="brand-name">PERSONAL HUB<span className="brand-dot">.</span></span></a><div className="login-card"><div className="login-lock"><LockKeyhole size={22} /></div><span className="section-kicker">PRIVATE WORKSPACE</span><h1>欢迎回来。</h1><p>登录后管理你的项目、研究、文章与个人资料。</p><form onSubmit={submit}><label>邮箱地址<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label>密码<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" required /></label>{error && <div className="form-error">{error}</div>}<button className="button button-dark login-submit" disabled={busy}>{busy ? '正在登录…' : '登录管理后台'} <ArrowUpRight size={16} /></button></form><a className="login-back" href="/">← 返回公开主页</a></div><p className="login-note"><ShieldCheck size={14} /> 管理权限由 Supabase 数据库策略验证</p></div>
}

function AccessDenied({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return <div className="login-page"><div className="login-card"><div className="login-lock"><ShieldCheck size={22} /></div><span className="section-kicker">ACCESS CONTROL</span><h1>当前账号没有管理权限。</h1><p>{email} 已登录，但尚未加入网站管理员列表。请将该用户 UUID 添加到 Supabase 的 <code>site_admins</code> 表。</p><button className="button button-dark login-submit" onClick={onSignOut}>退出登录 <LogOut size={16} /></button><a className="login-back" href="/">返回公开主页</a></div></div>
}

function AdminDashboard({ email, onSignOut, localMode = false }: { email: string; onSignOut: () => void; localMode?: boolean }) {
  const [tab, setTab] = useState<AdminTab>('overview')
  const [data, setData] = useState<SiteData>(seedData)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ kind: ContentKind; item: any | null } | null>(null)
  const [notice, setNotice] = useState('')
  const [profileDraft, setProfileDraft] = useState<Profile>(seedData.profile)
  const [savingProfile, setSavingProfile] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const next = localMode ? loadLocalContent() : await loadAdminContent()
      setData(next)
      setProfileDraft(next.profile)
    } catch (e: any) {
      setNotice(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { refresh() }, [])

  const tabMeta: { id: AdminTab; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: '总览', icon: <LayoutDashboard size={17} /> },
    { id: 'projects', label: '项目作品', icon: <FolderKanban size={17} /> },
    { id: 'publications', label: '科研论文', icon: <GraduationCap size={17} /> },
    { id: 'posts', label: '文章笔记', icon: <FileText size={17} /> },
    { id: 'timeline', label: '成长时间轴', icon: <Clock3 size={17} /> },
    { id: 'life', label: '生活记录', icon: <Heart size={17} /> },
    { id: 'profile', label: '个人资料', icon: <Settings2 size={17} /> },
    { id: 'settings', label: '数据与设置', icon: <Database size={17} /> },
  ]

  const tableName: Record<ContentKind, string> = { projects: 'projects', publications: 'publications', posts: 'posts', timeline: 'timeline', life: 'life_entries' }
  const dataKey: Record<ContentKind, keyof SiteData> = { projects: 'projects', publications: 'publications', posts: 'posts', timeline: 'timeline', life: 'lifeEntries' }
  const rows = tab === 'projects' ? data.projects : tab === 'publications' ? data.publications : tab === 'posts' ? data.posts : tab === 'timeline' ? data.timeline : tab === 'life' ? data.lifeEntries : []

  const saveItem = async (kind: ContentKind, item: any) => {
    const payload = { ...item }
    if (kind === 'projects') { payload.tech_stack = splitCsv(payload.tech_stack); payload.highlights = splitLines(payload.highlights) }
    if (kind === 'publications' || kind === 'posts') payload.tags = splitCsv(payload.tags)
    if (kind !== 'posts') payload.sort_order = Number(payload.sort_order || 0)
    if (localMode) {
      if (!payload.id || String(payload.id).startsWith('new-')) payload.id = `local-${Date.now()}`
      const next = { ...data, [dataKey[kind]]: [...(data[dataKey[kind]] as any[])] } as SiteData
      const list = next[dataKey[kind]] as any[]
      const index = list.findIndex((entry) => entry.id === payload.id)
      if (index >= 0) list[index] = payload
      else list.unshift(payload)
      try {
        saveLocalContent(next)
        setData(next)
        setModal(null)
        setNotice('已保存到本地浏览器。打开公开主页并刷新即可查看。')
      } catch (e: any) { setNotice(e.message || '保存失败') }
      return
    }
    if (!supabase) return
    if (!payload.id || String(payload.id).startsWith('new-')) delete payload.id
    const { error } = await supabase.from(tableName[kind]).upsert(payload).select().single()
    if (error) { setNotice(`保存失败：${error.message}`); return }
    setModal(null); setNotice('内容已保存'); await refresh()
  }

  const deleteItem = async (kind: ContentKind, id: string) => {
    if (!window.confirm('确定删除这条内容吗？此操作无法撤销。')) return
    if (localMode) {
      const next = { ...data, [dataKey[kind]]: (data[dataKey[kind]] as any[]).filter((entry) => entry.id !== id) } as SiteData
      try { saveLocalContent(next); setData(next); setNotice('内容已删除。') }
      catch (e: any) { setNotice(e.message || '删除失败') }
      return
    }
    if (!supabase) return
    const { error } = await supabase.from(tableName[kind]).delete().eq('id', id)
    if (error) setNotice(`删除失败：${error.message}`)
    else { setNotice('已删除'); await refresh() }
  }

  const uploadImage = async (file: File) => {
    if (localMode) return compressImageToDataUrl(file)
    if (!supabase) throw new Error('Supabase 尚未配置')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `uploads/${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from('site-media').upload(path, file, { upsert: false })
    if (error) throw error
    return supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    if (localMode) {
      try {
        const next = { ...data, profile: profileDraft }
        saveLocalContent(next)
        setData(next)
        setNotice('个人资料已保存到本地。刷新公开主页即可查看。')
      } catch (e: any) { setNotice(e.message || '保存失败') }
      finally { setSavingProfile(false) }
      return
    }
    if (!supabase) { setSavingProfile(false); return }
    const { error } = await supabase.from('site_settings').upsert({ key: 'profile', value: profileDraft, is_public: true }, { onConflict: 'key' })
    setSavingProfile(false)
    setNotice(error ? `保存失败：${error.message}` : '个人资料已更新')
    if (!error) await refresh()
  }

  const importBackup = async (file?: File) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const candidate = parsed.data || parsed
      if (!validateSiteData(candidate)) throw new Error('备份文件格式不正确，未修改当前数据。')
      if (!localMode) throw new Error('云端模式暂不支持直接覆盖导入，请先导出备份并通过内容编辑器更新。')
      saveLocalContent(candidate)
      setData(candidate)
      setProfileDraft(candidate.profile)
      setNotice('备份恢复成功。')
    } catch (e: any) { setNotice(e.message || '备份导入失败') }
  }

  const addNew = () => {
    const base: Record<ContentKind, any> = {
      projects: { id: `new-${Date.now()}`, title: '', slug: '', category: 'AI Engineering', summary: '', description: '', tech_stack: [], highlights: [], cover_url: '', github_url: '', demo_url: '', featured: true, is_published: false, sort_order: data.projects.length + 1 },
      publications: { id: `new-${Date.now()}`, title: '', venue: '', year: String(new Date().getFullYear()), status: 'In Progress', authors: '', abstract: '', paper_url: '', doi: '', tags: [], is_published: false, sort_order: data.publications.length + 1 },
      posts: { id: `new-${Date.now()}`, title: '', slug: '', excerpt: '', content: '', category: '技术笔记', cover_url: '', tags: [], is_published: false, published_at: new Date().toISOString().slice(0, 10) },
      timeline: { id: `new-${Date.now()}`, date_label: String(new Date().getFullYear()), title: '', description: '', kind: 'Milestone', is_published: false, sort_order: data.timeline.length + 1 },
      life: { id: `new-${Date.now()}`, title: '', category: 'Fitness', date_label: 'LIFE NOTE', description: '', cover_url: '', is_published: false, sort_order: data.lifeEntries.length + 1 },
    }
    if (tab !== 'overview' && tab !== 'profile' && tab !== 'settings') setModal({ kind: tab, item: base[tab] })
  }

  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="brand" href="/"><span className="brand-mark">P.</span><span className="brand-name">PERSONAL HUB<span className="brand-dot">.</span></span></a><div className="admin-sidebar-label">WORKSPACE</div><nav>{tabMeta.map((item) => <button key={item.id} className={`admin-nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>{item.icon}<span>{item.label}</span>{tab === item.id && <span className="nav-active-dot" />}</button>)}</nav><div className="admin-sidebar-bottom"><div className="admin-user"><div className="admin-user-avatar">{localMode ? 'TP' : email.slice(0, 1).toUpperCase()}</div><div><strong>{email}</strong><span>{localMode ? 'Local workspace' : 'Administrator'}</span></div></div>{!localMode && <button className="admin-signout" onClick={onSignOut}><LogOut size={15} />退出登录</button>}<a className="view-site-link" href="/" target="_blank"><ExternalLink size={14} /> 查看公开主页</a></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div><span className="admin-breadcrumb">PERSONAL HUB / ADMIN</span><h1>{tabMeta.find((x) => x.id === tab)?.label}</h1></div><div className="admin-top-actions"><span className={`admin-save-state ${localMode ? 'local-mode-state' : ''}`}><span className="live-dot" /> {localMode ? '本地保存已启用' : '数据库已连接'}</span><button className="icon-button" onClick={refresh} title="刷新数据"><RefreshCw size={17} /></button><a className="button button-dark button-small" href="/" target="_blank">预览网站 <ArrowUpRight size={14} /></a></div></header>
      {localMode && <div className="local-mode-banner"><Database size={16} /><span><strong>本地编辑模式</strong> · 内容保存在当前浏览器。公开部署前需要连接 Supabase，才能让其他访客看到更新。</span></div>}
      {notice && <div className="admin-notice"><Check size={15} />{notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}
      {loading ? <div className="admin-loading"><div className="spinner" />正在加载内容…</div> : <>
        {tab === 'overview' && <AdminOverview data={data} onNavigate={setTab} />}
        {tab === 'profile' && <ProfileEditor profile={profileDraft} onChange={setProfileDraft} onSave={saveProfile} saving={savingProfile} onUploadAvatar={uploadImage} />}
        {(['projects', 'publications', 'posts', 'timeline', 'life'] as ContentKind[]).includes(tab as ContentKind) && <AdminContentList kind={tab as ContentKind} rows={rows} onAdd={addNew} onEdit={(item) => setModal({ kind: tab as ContentKind, item })} onDelete={(id) => deleteItem(tab as ContentKind, id)} />}
        {tab === 'settings' && <AdminSettings data={data} localMode={localMode} onImport={importBackup} />}
      </>}
    </main>
    {modal && <EditorModal kind={modal.kind} item={modal.item} onClose={() => setModal(null)} onSave={saveItem} onUpload={uploadImage} />}
  </div>
}

function AdminOverview({ data, onNavigate }: { data: SiteData; onNavigate: (tab: AdminTab) => void }) {
  const cards = [{ label: '项目作品', value: data.projects.length, icon: <FolderKanban />, tab: 'projects' as AdminTab }, { label: '科研论文', value: data.publications.length, icon: <GraduationCap />, tab: 'publications' as AdminTab }, { label: '文章笔记', value: data.posts.length, icon: <FileText />, tab: 'posts' as AdminTab }, { label: '时间轴记录', value: data.timeline.length, icon: <Clock3 />, tab: 'timeline' as AdminTab }, { label: '生活记录', value: data.lifeEntries.length, icon: <Heart />, tab: 'life' as AdminTab }]
  return <div className="admin-content"><div className="admin-welcome"><div><span className="section-kicker">YOUR PERSONAL SPACE</span><h2>今天，想更新些什么？</h2><p>在这里管理公开主页的内容。保存后，访客将看到已发布的最新版本。</p></div><div className="welcome-mark">P<span>.</span></div></div><div className="admin-stat-grid">{cards.map((card) => <button className="admin-stat-card" key={card.tab} onClick={() => onNavigate(card.tab)}><div className="admin-stat-icon">{card.icon}</div><strong>{card.value.toString().padStart(2, '0')}</strong><span>{card.label}</span><ArrowUpRight size={15} /></button>)}</div><div className="admin-overview-columns"><div className="admin-panel"><div className="panel-heading"><div><span className="section-kicker">CONTENT STATUS</span><h3>内容发布情况</h3></div></div>{cards.map((card) => { const arr = card.tab === 'projects' ? data.projects : card.tab === 'publications' ? data.publications : card.tab === 'posts' ? data.posts : card.tab === 'timeline' ? data.timeline : data.lifeEntries; const published = arr.filter((x: any) => x.is_published).length; return <div className="status-line" key={card.tab}><span>{card.label}</span><div className="status-track"><i style={{ width: `${arr.length ? (published / arr.length) * 100 : 0}%` }} /></div><strong>{published}/{arr.length}</strong></div> })}</div><div className="admin-panel quick-panel"><span className="section-kicker">QUICK ACTIONS</span><h3>快速开始</h3><button onClick={() => onNavigate('projects')}><Plus size={16} /> 添加一个项目 <ArrowRight size={14} /></button><button onClick={() => onNavigate('publications')}><Plus size={16} /> 更新科研成果 <ArrowRight size={14} /></button><button onClick={() => onNavigate('posts')}><Plus size={16} /> 写一篇新文章 <ArrowRight size={14} /></button><button onClick={() => onNavigate('profile')}><Settings2 size={16} /> 修改个人资料 <ArrowRight size={14} /></button></div></div><div className="admin-tip"><Sparkles size={17} /><div><strong>一个小建议</strong><p>先完善个人资料和联系方式，再逐步补充项目截图、论文链接与文章正文。公开发布前记得检查内容准确性。</p></div></div></div>
}

function AdminContentList({ kind, rows, onAdd, onEdit, onDelete }: { kind: ContentKind; rows: any[]; onAdd: () => void; onEdit: (item: any) => void; onDelete: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const titleMap: Record<ContentKind, string> = { projects: '项目作品', publications: '科研论文', posts: '文章笔记', timeline: '成长时间轴', life: '生活记录' }
  const descriptionMap: Record<ContentKind, string> = { projects: '管理项目介绍、技术栈、成果和演示链接。', publications: '维护论文信息、发表状态和论文链接。', posts: '撰写技术文章、研究笔记与生活记录。', timeline: '记录教育经历、项目节点和个人成长。', life: '整理运动、阅读、游戏、旅行和日常片段。' }
  const filtered = rows.filter((item) => {
    const text = [item.title, item.summary, item.excerpt, item.abstract, item.description, item.category, item.venue].join(' ').toLowerCase()
    return text.includes(query.toLowerCase()) && (status === 'all' || (status === 'published' ? item.is_published : !item.is_published))
  })
  return <div className="admin-content"><div className="list-page-heading"><div><span className="section-kicker">CONTENT MANAGEMENT</span><h2>{titleMap[kind]}</h2><p>{descriptionMap[kind]}</p></div><button className="button button-dark" onClick={onAdd}><Plus size={16} /> 新增内容</button></div><div className="content-toolbar"><label className="content-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`搜索${titleMap[kind]}…`} /></label><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option></select><span>共 {filtered.length} 条</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>内容</th><th>分类 / 时间</th><th>状态</th><th>操作</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="table-title">{item.title || '未命名内容'}</div><div className="table-subtitle">{item.summary || item.excerpt || item.abstract || item.description || item.slug || ''}</div></td><td>{item.category || item.venue || item.date_label || item.year || '—'}</td><td><span className={`publish-badge ${item.is_published ? 'published' : 'draft'}`}>{item.is_published ? '已发布' : '草稿'}</span></td><td><div className="table-actions"><button onClick={() => onEdit(item)} title="编辑"><Pencil size={15} /></button><button onClick={() => onDelete(item.id)} title="删除"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="table-empty"><FileText size={22} /><strong>{rows.length ? '没有找到匹配内容' : '还没有内容'}</strong><span>{rows.length ? '试试更换关键词或筛选条件。' : '点击右上角“新增内容”开始创建。'}</span></div>}</div></div>
}

function ProfileEditor({ profile, onChange, onSave, saving, onUploadAvatar }: { profile: Profile; onChange: (p: Profile) => void; onSave: () => void; saving: boolean; onUploadAvatar: (file: File) => Promise<string> }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const update = (key: keyof Profile, value: Profile[keyof Profile]) => onChange({ ...profile, [key]: value } as Profile)
  const handleAvatar = async (file?: File) => {
    if (!file) return
    setUploading(true); setUploadError('')
    try { update('avatar_url', await onUploadAvatar(file)) }
    catch (e: any) { setUploadError(e.message || '头像上传失败') }
    finally { setUploading(false) }
  }
  return <div className="admin-content"><div className="list-page-heading"><div><span className="section-kicker">PUBLIC PROFILE</span><h2>个人资料</h2><p>修改后保存，公开主页会展示最新信息。</p></div><button className="button button-dark" onClick={onSave} disabled={saving}><Save size={16} />{saving ? '保存中…' : '保存资料'}</button></div><div className="profile-form-grid"><div className="admin-panel"><h3>首页与个人介绍</h3><div className="field-grid"><Field label="显示名称" value={profile.name} onChange={(v) => update('name', v)} placeholder="丁大帅哥" /><Field label="专业 / 身份" value={profile.role} onChange={(v) => update('role', v)} placeholder="AI Engineer & Developer" /><Field label="头像文字" value={profile.avatar_mark || 'TP'} onChange={(v) => update('avatar_mark', v)} placeholder="TP" /><Field label="所在地区" value={profile.location} onChange={(v) => update('location', v)} /></div><Field label="首页标语" value={profile.tagline} onChange={(v) => update('tagline', v)} /><TextField label="个人简介" value={profile.bio} onChange={(v) => update('bio', v)} rows={4} /><Field label="关于我标题" value={profile.about_heading || ''} onChange={(v) => update('about_heading', v)} /><TextField label="关于我补充介绍" value={profile.about_detail || ''} onChange={(v) => update('about_detail', v)} rows={4} /><Field label="研究 / 技术方向" value={profile.focus || ''} onChange={(v) => update('focus', v)} /><Field label="首页标签（逗号分隔）" value={(profile.hero_tags || []).join(', ')} onChange={(v) => update('hero_tags', splitCsv(v))} /><Field label="当前状态" value={profile.status} onChange={(v) => update('status', v)} /></div><div className="admin-panel"><h3>头像与公开联系方式</h3><div className="profile-avatar-preview">{profile.avatar_url ? <img src={profile.avatar_url} alt="头像预览" /> : <span>{profile.avatar_mark || 'TP'}</span>}</div><ImageUpload label="上传头像图片（可选）" value={profile.avatar_url || ''} onUpload={handleAvatar} uploading={uploading} error={uploadError} /><Field label="联系邮箱" value={profile.email} onChange={(v) => update('email', v)} placeholder="name@example.com" /><Field label="GitHub 主页" value={profile.github} onChange={(v) => update('github', v)} placeholder="https://github.com/username" /><Field label="Google Scholar / 学术主页" value={profile.scholar} onChange={(v) => update('scholar', v)} placeholder="https://scholar.google.com/..." /><div className="field-hint">头像可直接使用 TP 字母，也可以上传图片。公开联系方式只填写愿意展示的信息。</div></div></div></div>
}

function AdminSettings({ data, localMode, onImport }: { data: SiteData; localMode: boolean; onImport: (file?: File) => void }) {
  const [selectedFile, setSelectedFile] = useState('')
  return <div className="admin-content"><div className="list-page-heading"><div><span className="section-kicker">SITE SETTINGS</span><h2>数据与设置</h2><p>管理个人网站内容备份，避免更换浏览器或电脑时丢失资料。</p></div><button className="button button-dark" onClick={() => exportContentBackup(data)}><Download size={16} /> 导出 JSON 备份</button></div><div className="settings-grid"><section className="admin-panel"><div className="settings-icon"><Download size={20} /></div><h3>导出全部内容</h3><p>将个人资料、项目、论文、文章、时间轴和生活记录打包为 JSON 文件。建议每次批量修改后保存一份。</p><button className="button button-dark" onClick={() => exportContentBackup(data)}>下载备份文件</button></section><section className="admin-panel"><div className="settings-icon"><FileUp size={20} /></div><h3>从备份恢复</h3><p>{localMode ? '选择之前导出的 JSON 文件，可以恢复个人网站的全部内容。恢复会覆盖当前本地内容。' : '云端模式下建议先导出备份，再通过各内容模块逐项维护。'}</p>{localMode ? <label className="backup-upload"><FileUp size={16} />{selectedFile || '选择 JSON 备份文件'}<input type="file" accept="application/json,.json" onChange={(e) => { const file = e.target.files?.[0]; setSelectedFile(file?.name || ''); onImport(file) }} /></label> : <span className="settings-readonly">云端数据由 Supabase 管理</span>}</section><section className="admin-panel settings-wide"><div className="settings-icon"><ShieldCheck size={20} /></div><h3>{localMode ? '当前为本地编辑模式' : '云端内容管理模式'}</h3><p>{localMode ? '数据保存在当前浏览器的本地存储中。清理浏览器站点数据可能导致内容丢失，请定期导出 JSON 备份。当前模式适合本机编辑和预览；要让公网访客看到内容，需要配置 Supabase 并部署网站。' : '公开访客只能读取已发布内容；管理操作需要 Supabase 登录，并由数据库 RLS 策略校验管理员身份。'}</p><div className="settings-facts"><span>项目：{data.projects.length}</span><span>论文：{data.publications.length}</span><span>文章：{data.posts.length}</span><span>生活记录：{data.lifeEntries.length}</span></div></section></div></div>
}

function EditorModal({ kind, item, onClose, onSave, onUpload }: { kind: ContentKind; item: any; onClose: () => void; onSave: (kind: ContentKind, item: any) => void; onUpload: (file: File) => Promise<string> }) {
  const [draft, setDraft] = useState<any>(() => ({ ...item, tech_stack: Array.isArray(item.tech_stack) ? item.tech_stack.join(', ') : item.tech_stack, tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags, highlights: Array.isArray(item.highlights) ? item.highlights.join('\n') : item.highlights }))
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [postMode, setPostMode] = useState<'edit' | 'preview'>('edit')
  const set = (key: string, value: any) => setDraft((current: any) => ({ ...current, [key]: value }))
  const titleMap: Record<ContentKind, string> = { projects: '项目', publications: '论文', posts: '文章', timeline: '时间轴记录', life: '生活记录' }
  const handleUpload = async (file?: File) => { if (!file) return; setUploading(true); setUploadError(''); try { const url = await onUpload(file); set('cover_url', url) } catch (e: any) { setUploadError(e.message || '上传失败') } finally { setUploading(false) } }
  const input = (label: string, key: string, placeholder = '') => <Field label={label} value={String(draft[key] ?? '')} onChange={(v) => set(key, v)} placeholder={placeholder} />
  const textarea = (label: string, key: string, rows = 3) => <TextField label={label} value={draft[key] || ''} onChange={(v) => set(key, v)} rows={rows} />
  const checkbox = (label: string, key: string) => <label className="check-field"><input type="checkbox" checked={Boolean(draft[key])} onChange={(e) => set(key, e.target.checked)} /><span>{label}</span></label>
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="editor-modal"><div className="editor-modal-head"><div><span className="section-kicker">EDIT CONTENT</span><h2>{item.id?.startsWith('new-') ? '新增' : '编辑'}{titleMap[kind]}</h2></div><button className="modal-close" onClick={onClose}><X size={18} /></button></div><div className="editor-modal-body">
    {kind === 'projects' && <>{input('项目名称', 'title')}{input('URL 标识（slug）', 'slug', 'my-project')}{input('项目分类', 'category')}{textarea('一句话介绍', 'summary', 2)}{textarea('项目详细介绍', 'description', 4)}{input('技术栈（逗号分隔）', 'tech_stack', 'Python, PyTorch, React')}{textarea('项目亮点（每行一条）', 'highlights', 3)}{input('GitHub 链接', 'github_url')}{input('演示链接', 'demo_url')}<ImageUpload value={draft.cover_url || ''} onUpload={handleUpload} uploading={uploading} error={uploadError} /><div className="check-row">{checkbox('首页精选', 'featured')}{checkbox('发布到网站', 'is_published')}</div>{input('排序权重', 'sort_order')}</>}
    {kind === 'publications' && <>{input('论文标题', 'title')}{input('期刊 / 会议', 'venue')}{input('年份', 'year')}{input('论文状态', 'status', 'Accepted / Under Review / In Progress')}{input('作者', 'authors')}{textarea('摘要 / 简介', 'abstract', 4)}{input('论文链接', 'paper_url')}{input('DOI', 'doi')}{input('关键词（逗号分隔）', 'tags') }<div className="check-row">{checkbox('发布到网站', 'is_published')}</div>{input('排序权重', 'sort_order')}</>}
    {kind === 'posts' && <>{input('文章标题', 'title')}{input('URL 标识（slug）', 'slug')}{input('文章分类', 'category')}{textarea('摘要', 'excerpt', 2)}<div className="editor-mode-switch"><span>正文编辑</span><div><button className={postMode === 'edit' ? 'active' : ''} onClick={() => setPostMode('edit')}>编辑</button><button className={postMode === 'preview' ? 'active' : ''} onClick={() => setPostMode('preview')}>预览</button></div></div>{postMode === 'edit' ? <TextField label="文章正文（支持 Markdown）" value={draft.content || ''} onChange={(v) => set('content', v)} rows={14} /> : <div className="markdown-preview"><MarkdownPreview content={draft.content || ''} /></div>}{input('标签（逗号分隔）', 'tags')}{input('发布日期', 'published_at') }<ImageUpload value={draft.cover_url || ''} onUpload={handleUpload} uploading={uploading} error={uploadError} /><div className="check-row">{checkbox('发布到网站', 'is_published')}</div></>}
    {kind === 'timeline' && <>{input('时间 / 日期', 'date_label')}{input('标题', 'title')}{textarea('描述', 'description', 4)}{input('类型', 'kind', 'Education / Research / Work') }<div className="check-row">{checkbox('发布到网站', 'is_published')}</div>{input('排序权重', 'sort_order')}</>}
    {kind === 'life' && <>{input('记录标题', 'title')}{input('分类', 'category', 'Fitness / Reading / Games / Travel')}{input('日期 / 标签', 'date_label')}{textarea('记录描述', 'description', 4)}<ImageUpload value={draft.cover_url || ''} onUpload={handleUpload} uploading={uploading} error={uploadError} /><div className="check-row">{checkbox('发布到网站', 'is_published')}</div>{input('排序权重', 'sort_order')}</>}
  </div><div className="editor-modal-foot"><button className="button button-quiet" onClick={onClose}>取消</button><button className="button button-dark" onClick={() => onSave(kind, draft)} disabled={uploading}><Save size={15} /> 保存内容</button></div></div></div>
}

function ImageUpload({ value, onUpload, uploading, error, label = '封面图片' }: { value: string; onUpload: (file?: File) => void; uploading: boolean; error: string; label?: string }) {
  return <div className="image-upload-field"><label>{label}</label>{value && <img className="image-upload-preview" src={value} alt="图片预览" />}<div className="image-upload-row"><input value={value.startsWith('data:') ? '已选择本地图片' : value} readOnly placeholder="上传图片后自动填入 URL" /><label className="upload-button"><Upload size={14} />{uploading ? '上传中…' : '选择图片'}<input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} disabled={uploading} /></label></div>{error && <span className="form-error">{error}</span>}</div>
}


function MarkdownPreview({ content }: { content: string }) {
  const blocks = content.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
  return <div className="markdown-body">{blocks.map((block, index) => {
    if (block.startsWith('```')) return <pre key={index}><code>{block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')}</code></pre>
    if (block.startsWith('### ')) return <h4 key={index}>{block.slice(4)}</h4>
    if (block.startsWith('## ')) return <h3 key={index}>{block.slice(3)}</h3>
    if (block.startsWith('# ')) return <h2 key={index}>{block.slice(2)}</h2>
    const lines = block.split('\n')
    if (lines.every((line) => /^[-*]\s/.test(line))) return <ul key={index}>{lines.map((line, i) => <li key={i}>{line.replace(/^[-*]\s/, '')}</li>)}</ul>
    if (/^>\s?/.test(block)) return <blockquote key={index}>{block.replace(/^>\s?/gm, '')}</blockquote>
    return <p key={index}>{lines.map((line, i) => <span key={i}>{line}{i < lines.length - 1 && <br />}</span>)}</p>
  })}</div>
}

function Field({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="field-label">{label}<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>
}
function TextField({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="field-label">{label}<textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></label>
}
function splitCsv(value: string | string[] | undefined) { return Array.isArray(value) ? value : String(value || '').split(',').map((x) => x.trim()).filter(Boolean) }
function splitLines(value: string | string[] | undefined) { return Array.isArray(value) ? value : String(value || '').split('\n').map((x) => x.trim()).filter(Boolean) }

export default App
