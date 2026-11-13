import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Github, Mail, UserRound } from 'lucide-react'
import { SiteLayout } from '../components/SiteLayout'
import { Link } from 'react-router-dom'
import { fetchSiteSettings, type SiteSettings } from '../lib/content'

export function About() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchSiteSettings()
      .then(data => { if (active) setSettings(data) })
      .catch(error => console.error('读取个人资料失败：', error))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const name = settings?.display_name || '丁大帅哥'
  const title = settings?.professional_title || 'AI Engineer & Developer'
  const introduction = settings?.introduction || '我关注人工智能、计算机视觉、推荐系统与智能应用开发，喜欢研究问题，也喜欢把想法转化为可以验证和使用的作品。'
  const links = Object.entries(settings?.other_links ?? {}).filter(
    ([, value]) => typeof value === 'string' && /^https?:\/\//i.test(value)
  ) as [string, string][]

  return (
    <SiteLayout>
      <section className="page-hero container">
        <Link to="/" className="back-link"><ArrowLeft size={14}/> 返回首页</Link>
        <span className="eyebrow">PERSONAL HUB / ABOUT</span>
        <h1>关于我</h1>
        <p>{title}</p>
      </section>
      <section className="container about-content">
        <div className="about-monogram"><span>{settings?.avatar_text || 'TP'}.</span></div>
        <div className="about-copy">
          <span className="eyebrow">A LITTLE INTRODUCTION</span>
          <h2>你好，我是{name}。</h2>
          <p>{introduction}</p>
          <p>这里是我的个人数字空间，用来整理项目、科研成果、技术笔记和生活记录。</p>
          {loading && <p className="muted">正在读取最新个人资料…</p>}
          <div className="about-links">
            {settings?.contact_email && <a href={`mailto:${settings.contact_email}`}><Mail size={15}/>联系邮箱 <ArrowUpRight size={13}/></a>}
            {settings?.github_url && <a href={settings.github_url} target="_blank" rel="noreferrer"><Github size={15}/>GitHub <ArrowUpRight size={13}/></a>}
            {links.map(([label, value]) => <a key={label} href={value} target="_blank" rel="noreferrer"><UserRound size={15}/>{label}<ArrowUpRight size={13}/></a>)}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
