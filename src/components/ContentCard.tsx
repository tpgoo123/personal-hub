import { ArrowUpRight, CalendarDays, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dateOf, imageOf, summaryOf, titleOf, type ContentRow } from '../lib/content'

export function ContentCard({ row, kind }: { row: ContentRow; kind: string }) {
  const title = titleOf(row)
  const summary = summaryOf(row)
  const image = imageOf(row)
  const date = dateOf(row)
  const tech = Array.isArray(row.tech_stack)
    ? row.tech_stack.filter((item: unknown) => typeof item === 'string').slice(0, 3)
    : []

  return (
    <article className="content-card">
      {image ? (
        <img className="content-image" src={image} alt={`${title}封面`} loading="lazy"/>
      ) : (
        <div className="content-image image-placeholder" aria-hidden="true"><span>TP.</span></div>
      )}
      <div className="content-card-body">
        <div className="content-meta">
          <span>{kind}</span>
          {date && <span><CalendarDays size={12}/>{date.slice(0, 10)}</span>}
        </div>
        <h3>{title}</h3>
        <p>{summary.length > 125 ? `${summary.slice(0, 125)}…` : summary}</p>
        {tech.length > 0 && (
          <div className="content-tags">
            {tech.map((item: string) => <span key={item}>{item}</span>)}
          </div>
        )}
        {kind === '论文' && (
          <div className="paper-card-meta">
            {row.venue && <span>{row.venue}</span>}
            {row.publication_year && <span>{row.publication_year}</span>}
          </div>
        )}
        {kind === '论文' && (row.pdf_url || row.doi || row.project_url) && (
          <div className="paper-card-links">
            {row.pdf_url && <a href={row.pdf_url} target="_blank" rel="noreferrer">PDF <ExternalLink size={11}/></a>}
            {row.doi && <a href={String(row.doi).startsWith('http') ? row.doi : `https://doi.org/${row.doi}`} target="_blank" rel="noreferrer">DOI <ExternalLink size={11}/></a>}
            {row.project_url && <a href={row.project_url} target="_blank" rel="noreferrer">项目主页 <ExternalLink size={11}/></a>}
          </div>
        )}
        {kind === '文章' && row.id ? (
          <Link className="text-link" to={`/posts/${row.id}`}>阅读文章 <ArrowUpRight size={14}/></Link>
        ) : kind === '项目' && row.project_url ? (
          <a className="text-link" href={row.project_url} target="_blank" rel="noreferrer">查看项目 <ExternalLink size={14}/></a>
        ) : (
          <span className="card-foot">PERSONAL HUB <ArrowUpRight size={14}/></span>
        )}
      </div>
    </article>
  )
}
