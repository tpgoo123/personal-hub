import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { SiteLayout } from '../components/SiteLayout'
import { ContentCard } from '../components/ContentCard'
import { ConfigNotice } from '../components/ConfigNotice'
import { contentConfig, fetchPublished, type ContentKind, type ContentRow } from '../lib/content'

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

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchPublished(kind)
      .then(data => { if (active) setRows(data) })
      .catch(err => { if (active) setError(err.message || '内容加载失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [kind])

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
        {loading ? <div className="empty-state">正在加载内容…</div> :
          error ? <div className="empty-state error-state">{error}</div> :
          rows.length ? <div className="card-grid">{rows.map((row, i) => <ContentCard key={row.id ?? i} row={row} kind={config.singular}/>)}</div> :
          <div className="empty-state"><strong>这里还没有公开内容</strong><span>管理员发布内容后，会自动展示在这里。</span><Link className="text-link" to="/login">管理员登录 <ArrowUpRight size={14}/></Link></div>}
      </section>
    </SiteLayout>
  )
}
