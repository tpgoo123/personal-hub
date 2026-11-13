
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SiteLayout } from '../components/SiteLayout'
import { ContentCard } from '../components/ContentCard'
import { ConfigNotice } from '../components/ConfigNotice'
import {
  fetchPublished,
  fetchPublishedCount,
  fetchSiteSettings,
  type ContentRow,
  type SiteSettings,
} from '../lib/content'

type LoadResult<T> = {
  value: T
  error: string | null
}

async function safelyLoad<T>(
  promise: Promise<T>,
  fallback: T
): Promise<LoadResult<T>> {
  try {
    return { value: await promise, error: null }
  } catch (error) {
    return {
      value: fallback,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function Home() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [projects, setProjects] = useState<ContentRow[]>([])
  const [posts, setPosts] = useState<ContentRow[]>([])
  const [papers, setPapers] = useState<ContentRow[]>([])
  const [counts, setCounts] = useState({
    projects: 0,
    papers: 0,
    posts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    async function loadHome() {
      setLoading(true)

      const [
        settingsResult,
        projectsResult,
        postsResult,
        papersResult,
        projectCountResult,
        paperCountResult,
        postCountResult,
      ] = await Promise.all([
        safelyLoad(fetchSiteSettings(), null),
        safelyLoad(fetchPublished('projects', 3), [] as ContentRow[]),
        safelyLoad(fetchPublished('posts', 3), [] as ContentRow[]),
        safelyLoad(fetchPublished('papers', 3), [] as ContentRow[]),
        safelyLoad(fetchPublishedCount('projects'), 0),
        safelyLoad(fetchPublishedCount('papers'), 0),
        safelyLoad(fetchPublishedCount('posts'), 0),
      ])

      if (!active) return

      setSettings(settingsResult.value)
      setProjects(projectsResult.value)
      setPosts(postsResult.value)
      setPapers(papersResult.value)

      setCounts({
        projects: projectCountResult.value,
        papers: paperCountResult.value,
        posts: postCountResult.value,
      })

      const errors = [
        settingsResult.error,
        projectsResult.error,
        postsResult.error,
        papersResult.error,
        projectCountResult.error,
        paperCountResult.error,
        postCountResult.error,
      ].filter((error): error is string => Boolean(error))

      if (errors.length) {
        console.error('首页数据加载失败：', errors)
        setLoadError('部分首页数据暂时无法加载，请检查 Supabase 数据表读取权限。')
      }

      setLoading(false)
    }

    void loadHome()

    return () => {
      active = false
    }
  }, [])

  const displayName = settings?.display_name || '丁大帅哥'
  const professionalTitle =
    settings?.professional_title || 'AI Engineer & Developer'
  const avatarText = settings?.avatar_text || 'TP'
  const introduction =
    settings?.introduction ||
    '关注人工智能、计算机视觉、推荐系统与智能应用开发。喜欢把研究问题拆解成可验证的实验，也喜欢把想法做成真正能用的产品。'

  return (
    <SiteLayout>
      <ConfigNotice />

      {loadError && (
        <div className="container">
          <div className="empty-state error-state">{loadError}</div>
        </div>
      )}

      <section className="hero container" id="top">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> PERSONAL SPACE / {new Date().getFullYear()}
          </div>

          <h1>
            把想法变成作品
            <br />
            <em>把过程留给时间。</em>
          </h1>

          <p className="hero-greeting">
            你好，我是 <strong>{displayName}。</strong>
          </p>

          <p className="hero-description">
            {professionalTitle}。{introduction}
          </p>

          <div className="tag-row">
            <span>AI Research</span>
            <span>Engineering</span>
            <span>Curiosity</span>
          </div>

          <div className="hero-actions">
            <Link className="button-primary" to="/projects">
              探索我的项目 <ArrowUpRight size={16} />
            </Link>
            <Link className="button-quiet" to="/about">
              更多关于我 <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="hero-art">
          <div className="art-grid" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="profile-card">
            <div className="profile-card-top">
              <span>A LITTLE ABOUT ME</span>
              <i />
            </div>

            <div className="avatar-monogram">
              {avatarText}
              <span>✳</span>
            </div>

            <h2>{displayName}</h2>
            <p>{professionalTitle}</p>

            <div className="profile-card-bottom">
              <span>
                <i /> 持续探索 AI 与智能系统
              </span>
              <ArrowUpRight size={15} />
            </div>
          </div>

          <div className="float-note note-top">
            <Sparkles size={14} /> Stay curious
          </div>

          <div className="float-note note-bottom">
            01&nbsp; Build · Learn · Share
          </div>

          <div className="art-caption">
            A SPACE TO THINK, MAKE &amp; GROW
          </div>
        </div>
      </section>

      <section className="stats container">
        <div className="stats-intro">
          <span className="eyebrow">AT A GLANCE</span>
          <p>
            一些正在持续积累的
            <br />
            小小里程碑。
          </p>
        </div>

        <div className="stat">
          <strong>{counts.projects.toString().padStart(2, '0')}</strong>
          <span>PROJECTS</span>
        </div>

        <div className="stat">
          <strong>{counts.papers.toString().padStart(2, '0')}</strong>
          <span>RESEARCH</span>
        </div>

        <div className="stat">
          <strong>{counts.posts.toString().padStart(2, '0')}</strong>
          <span>NOTES</span>
        </div>

        <div className="stats-note">
          不断尝试，
          <br />
          持续输出。 <ArrowUpRight size={14} />
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SELECTED WORK</span>
            <h2>精选项目</h2>
            <p>从问题出发，用技术把想法落地。</p>
          </div>

          <Link to="/projects" className="text-link">
            全部项目 <ArrowUpRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">正在加载项目…</div>
        ) : projects.length ? (
          <div className="card-grid">
            {projects.map((row, i) => (
              <ContentCard key={row.id ?? i} row={row} kind="项目" />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            项目内容将在管理员发布后显示。
          </div>
        )}
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">RESEARCH &amp; PUBLICATIONS</span>
            <h2>科研成果</h2>
            <p>持续探索问题边界，将研究过程沉淀为可复现的成果。</p>
          </div>
          <Link to="/papers" className="text-link">
            全部科研 <ArrowUpRight size={15}/>
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">正在加载科研成果…</div>
        ) : papers.length ? (
          <div className="card-grid">
            {papers.map((row, i) => (
              <ContentCard key={row.id ?? i} row={row} kind="论文"/>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            科研成果将在管理员发布后显示。
          </div>
        )}
      </section>

      <section className="section container section-tint">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LATEST NOTES</span>
            <h2>最近笔记</h2>
            <p>记录技术实践、研究思考与阶段总结。</p>
          </div>

          <Link to="/posts" className="text-link">
            全部文章 <ArrowUpRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">正在加载文章…</div>
        ) : posts.length ? (
          <div className="card-grid">
            {posts.map((row, i) => (
              <ContentCard key={row.id ?? i} row={row} kind="文章" />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            文章内容将在管理员发布后显示。
          </div>
        )}
      </section>

      <section className="closing container">
        <div>
          <span className="eyebrow">LET'S CONNECT</span>
          <h2>保持好奇，持续创造。</h2>
          <p>欢迎交流技术、项目与有趣的想法。</p>
        </div>

        <Link className="button-primary" to="/account">
          进入个人中心 <ArrowUpRight size={16} />
        </Link>
      </section>
    </SiteLayout>
  )
}
