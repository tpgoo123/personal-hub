import { useEffect, useState } from 'react'
import { SiteLayout } from '../components/SiteLayout'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchSiteSettings, type SiteSettings } from '../lib/content'

export function About() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    let active = true
    fetchSiteSettings().then(data => { if (active) setSettings(data) }).catch(error => console.error('读取个人资料失败：', error))
    return () => { active = false }
  }, [])

  const name = settings?.display_name || '丁大帅哥'
  const title = settings?.professional_title || 'AI Engineer & Developer'
  const introduction = settings?.introduction || '我关注人工智能、计算机视觉、推荐系统与智能应用开发，喜欢研究问题，也喜欢把想法转化为可以验证和使用的作品。'

  return (
    <SiteLayout>
      <section className="page-hero container">
        <Link to="/" className="back-link"><ArrowLeft size={14}/> 返回首页</Link>
        <span className="eyebrow">PERSONAL HUB / ABOUT</span>
        <h1>关于我</h1>
        <p>{title}</p>
      </section>
      <section className="container about-content">
        <div className="about-monogram">{settings?.avatar_text || 'TP'}.</div>
        <div>
          <h2>你好，我是{name}。</h2>
          <p>{introduction}</p>
          <p>这里是我的个人数字空间，用来整理项目、科研成果、技术笔记和生活记录。</p>
          {settings?.contact_email && <p>联系邮箱：<a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></p>}
          {settings?.github_url && <p><a href={settings.github_url} target="_blank" rel="noreferrer">GitHub 主页</a></p>}
          {settings?.other_links && Object.entries(settings.other_links).map(([label, value]) => typeof value === 'string' && /^https?:\/\//i.test(value) ? <p key={label}><a href={value} target="_blank" rel="noreferrer">{label}</a></p> : null)}
        </div>
      </section>
    </SiteLayout>
  )
}
