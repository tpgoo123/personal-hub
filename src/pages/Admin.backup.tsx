import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FolderKanban, Image, MessageSquare, Settings, Users } from 'lucide-react'
import { SiteLayout } from '../components/SiteLayout'
import { supabase } from '../lib/supabase'

const sections = [
  { title: '项目管理', desc: '维护项目作品与技术成果', icon: FolderKanban, path: '/projects' },
  { title: '论文管理', desc: '整理科研论文与发表信息', icon: BookOpen, path: '/papers' },
  { title: '博客管理', desc: '撰写、编辑和发布文章', icon: MessageSquare, path: '/posts' },
  { title: '媒体资源', desc: '管理网站图片与附件', icon: Image, path: '/account' },
  { title: '用户管理', desc: '查看注册用户与账号状态', icon: Users, path: '/account' },
  { title: '网站设置', desc: '维护个人资料与站点信息', icon: Settings, path: '/account' },
]

export function Admin() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!supabase) return
    Promise.all(['profiles', 'projects', 'papers', 'posts', 'comments', 'messages'].map(async table => {
      const { count } = await supabase!.from(table).select('*', { count: 'exact', head: true })
      return [table, count ?? 0] as const
    })).then(entries => setCounts(Object.fromEntries(entries)))
  }, [])

  return (
    <SiteLayout>
      <section className="page-hero container">
        <span className="eyebrow">PERSONAL HUB / ADMIN</span>
        <h1>管理后台</h1>
        <p>管理公开网站内容、用户互动与个人数字空间。</p>
      </section>
      <section className="container admin-section">
        <div className="admin-metrics">
          {[['用户', 'profiles'], ['项目', 'projects'], ['论文', 'papers'], ['文章', 'posts'], ['评论', 'comments'], ['留言', 'messages']].map(([label, key]) => (
            <div className="metric-card" key={key}><span>{label}</span><strong>{counts[key] ?? '—'}</strong></div>
          ))}
        </div>
        <div className="admin-grid">
          {sections.map(item => {
            const Icon = item.icon
            return <Link to={item.path} className="admin-card" key={item.title}><Icon size={21}/><h3>{item.title}</h3><p>{item.desc}</p><span>进入模块 →</span></Link>
          })}
        </div>
        <div className="form-message">当前为前端第一阶段：管理员身份验证和数据概览已接入。内容 CRUD、评论审核、用户封禁及媒体管理将在下一阶段按实际数据库字段实现。</div>
      </section>
    </SiteLayout>
  )
}
