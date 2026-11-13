import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react'
import { SiteLayout } from '../components/SiteLayout'
import { ContentCard } from '../components/ContentCard'
import { ConfigNotice } from '../components/ConfigNotice'
import { contentConfig, fetchPublished, summaryOf, titleOf, type ContentKind, type ContentRow } from '../lib/content'

const routeMap: Record<string, ContentKind> = {
  projects: 'projects',
  papers: 'papers',
  posts: 'posts',
  life: 'life_entries',
}

export function ContentList({ section: sectionProp }: { section: string }) {
  const params = useParams()
  const section = sectionProp || params.section || 'projects'
  const kind = routeMap[section] ?? 'projects'
  const config = contentConfig[kind]
  const [rows, setRows] = useState<ContentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setSearch('')
    fetchPublished(kind)
      .then(data => { if (active) setRows(data) })
      .catch(err => { if (active) setError(err.message || '内容加载失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [kind])

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(row => (
      `${titleOf(row)} ${summaryOf(row)} ${String(row.category ?? '')} ${String(row.tags ?? '')}`
    ).toLowerCase().includes(query))
  }, [rows, search])

  return (
    <SiteLayout>
      <ConfigNotice/>
      <section className="page-hero container">
        <Link to="/" className="back-link"><ArrowLeft size={14}/> 返回首页</Link>
        <span className="eyebrow">PERSONAL HUB / {section.toUpperCase()}</span>
        <h1>{config.label}</h1>
        <p>{config.description}</p>
      </section>
      <section className="container listing-section">
        {!loading && !error && rows.length > 0 && (
          <div className="listing-toolbar">
            <label className="listing-search">
              <Search size={16}/>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={`搜索${config.singular}标题、简介或标签`}
                aria-label={`搜索${config.label}`}
              />
            </label>
            <span className="listing-count">显示 {visibleRows.length} / {rows.length} 项</span>
          </div>
        )}
        {loading ? (
          <div className="empty-state">正在加载内容…</div>
        ) : error ? (
          <div className="empty-state error-state">{error}</div>
        ) : visibleRows.length ? (
          <div className="card-grid">
            {visibleRows.map((row, i) => <ContentCard key={row.id ?? i} row={row} kind={config.singular}/>)}
          </div>
        ) : rows.length ? (
          <div className="empty-state"><strong>没有找到匹配内容</strong><span>试试其他关键词。</span></div>
        ) : (
          <div className="empty-state">
            <strong>这里还没有公开内容</strong>
            <span>管理员发布内容后，会自动展示在这里。</span>
            <Link className="text-link" to="/login">管理员登录 <ArrowUpRight size={14}/></Link>
          </div>
        )}
      </section>
    </SiteLayout>
  )
}
