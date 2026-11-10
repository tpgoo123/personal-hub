import { ArrowDown, ArrowRight, ArrowUpRight, Code2, GraduationCap, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SiteLayout } from '../components/SiteLayout'
import { ContentCard } from '../components/ContentCard'
import { ConfigNotice } from '../components/ConfigNotice'
import { fetchPublished, type ContentRow } from '../lib/content'

export function Home() {
  const [projects, setProjects] = useState<ContentRow[]>([])
  const [posts, setPosts] = useState<ContentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchPublished('projects', 3).catch(() => []),
      fetchPublished('posts', 3).catch(() => []),
    ]).then(([projectRows, postRows]) => {
      if (!active) return
      setProjects(projectRows)
      setPosts(postRows)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return (
    <SiteLayout>
      <ConfigNotice/>
      <section className="hero container" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span/> PERSONAL SPACE / 2026</div>
          <h1>把想法变成作品<br/><em>把过程留给时间。</em></h1>
          <p className="hero-greeting">你好，我是 <strong>丁大帅哥。</strong></p>
          <p className="hero-description">
            AI Engineer &amp; Developer。关注人工智能、计算机视觉、推荐系统与智能应用开发。
            喜欢把研究问题拆解成可验证的实验，也喜欢把想法做成真正能用的产品。
          </p>
          <div className="tag-row"><span>AI Research</span><span>Engineering</span><span>Curiosity</span></div>
          <div className="hero-actions">
            <Link className="button-primary" to="/projects">探索我的项目 <ArrowUpRight size={16}/></Link>
            <Link className="button-quiet" to="/about">更多关于我 <ArrowRight size={15}/></Link>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-grid"/>
          <div className="orbit orbit-one"/>
          <div className="orbit orbit-two"/>
          <div className="profile-card">
            <div className="profile-card-top"><span>A LITTLE ABOUT ME</span><i/></div>
            <div className="avatar-monogram">TP<span>✳</span></div>
            <h2>丁大帅哥</h2>
            <p>AI Engineer &amp; Developer</p>
            <div className="profile-card-bottom"><span><i/> Currently exploring AI &amp; intelligent systems</span><ArrowUpRight size={15}/></div>
          </div>
          <div className="float-note note-top"><Sparkles size={14}/> Stay curious</div>
          <div className="float-note note-bottom">01&nbsp; Build · Learn · Share</div>
          <div className="art-caption">A SPACE TO THINK, MAKE &amp; GROW</div>
        </div>
      </section>

      <section className="stats container">
        <div className="stats-intro"><span className="eyebrow">AT A GLANCE</span><p>一些正在持续积累的<br/>小小里程碑。</p></div>
        <div className="stat"><strong>05<sup>+</sup></strong><span>PROJECTS</span></div>
        <div className="stat"><strong>03</strong><span>RESEARCH</span></div>
        <div className="stat"><strong>02<sup>+</sup></strong><span>NOTES</span></div>
        <div className="stats-note">不断尝试，<br/>持续输出。 <ArrowUpRight size={14}/></div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div><span className="eyebrow">SELECTED WORK</span><h2>精选项目</h2><p>从问题出发，用技术把想法落地。</p></div>
          <Link to="/projects" className="text-link">全部项目 <ArrowUpRight size={15}/></Link>
        </div>
        {loading ? <div className="empty-state">正在加载项目…</div> : projects.length ? (
          <div className="card-grid">{projects.map((row, i) => <ContentCard key={row.id ?? i} row={row} kind="项目"/> )}</div>
        ) : <div className="empty-state">项目内容将在管理员发布后显示。</div>}
      </section>

      <section className="section container section-tint">
        <div className="section-heading">
          <div><span className="eyebrow">LATEST NOTES</span><h2>最近笔记</h2><p>记录技术实践、研究思考与阶段总结。</p></div>
          <Link to="/posts" className="text-link">全部文章 <ArrowUpRight size={15}/></Link>
        </div>
        {loading ? <div className="empty-state">正在加载文章…</div> : posts.length ? (
          <div className="card-grid">{posts.map((row, i) => <ContentCard key={row.id ?? i} row={row} kind="文章"/> )}</div>
        ) : <div className="empty-state">文章内容将在管理员发布后显示。</div>}
      </section>

      <section className="closing container">
        <div><span className="eyebrow">LET'S CONNECT</span><h2>保持好奇，持续创造。</h2><p>欢迎交流技术、项目与有趣的想法。</p></div>
        <Link className="button-primary" to="/account">进入个人中心 <ArrowUpRight size={16}/></Link>
      </section>
    </SiteLayout>
  )
}
