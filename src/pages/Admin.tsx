
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ProjectsManager } from './ProjectsManager'
import { PapersManager } from './admin/PapersManager'
import { PostsManager } from './admin/PostsManager'
import { CommentsManager } from './admin/CommentsManager'
import { MediaManager } from './admin/MediaManager'
import { UsersManager } from './admin/UsersManager'
import { SettingsManager } from './admin/SettingsManager'
import './Admin.css'

type AdminSection =
  | 'overview'
  | 'projects'
  | 'papers'
  | 'posts'
  | 'comments'
  | 'users'
  | 'media'
  | 'settings'

type NavItem = {
  id: AdminSection
  label: string
  description: string
  icon: LucideIcon
  available: boolean
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: '数据概览',
    description: '查看网站整体运行与内容统计',
    icon: LayoutDashboard,
    available: true,
  },
  {
    id: 'projects',
    label: '项目管理',
    description: '管理项目作品、技术栈和发布状态',
    icon: FolderKanban,
    available: true,
  },
  {
    id: 'papers',
    label: '论文管理',
    description: '管理论文信息、DOI、PDF 和发表状态',
    icon: BookOpen,
    available: true,
  },
  {
    id: 'posts',
    label: '博客管理',
    description: 'Markdown 编辑、分类、标签和发布',
    icon: FileText,
    available: true,
  },
  {
    id: 'comments',
    label: '评论管理',
    description: '评论审核、回复和用户留言处理',
    icon: MessageSquare,
    available: true,
  },
  {
    id: 'users',
    label: '用户管理',
    description: '用户资料、角色和账号安全管理',
    icon: Users,
    available: true,
  },
  {
    id: 'media',
    label: '媒体资源',
    description: '上传、预览、搜索和删除网站资源',
    icon: ImageIcon,
    available: true,
  },
  {
    id: 'settings',
    label: '网站设置',
    description: '维护首页介绍、个人资料和联系方式',
    icon: Settings,
    available: true,
  },
]

const overviewItems = [
  {
    key: 'profiles',
    label: '注册用户',
    caption: '网站注册账号数量',
    icon: Users,
  },
  {
    key: 'projects',
    label: '项目作品',
    caption: '全部项目记录',
    icon: FolderKanban,
  },
  {
    key: 'papers',
    label: '科研论文',
    caption: '全部论文记录',
    icon: BookOpen,
  },
  {
    key: 'posts',
    label: '技术文章',
    caption: '全部博客记录',
    icon: FileText,
  },
  {
    key: 'comments',
    label: '用户评论',
    caption: '全部评论记录',
    icon: MessageSquare,
  },
  {
    key: 'messages',
    label: '用户留言',
    caption: '全部留言记录',
    icon: Activity,
  },
] as const

type CountKey = (typeof overviewItems)[number]['key']

export function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSection = searchParams.get('section') as AdminSection | null
  const activeSection: AdminSection = navItems.some(item => item.id === requestedSection)
    ? requestedSection!
    : 'overview'

  const [mobileOpen, setMobileOpen] = useState(false)

  const [counts, setCounts] =
    useState<Partial<Record<CountKey, number>>>({})

  const [countErrors, setCountErrors] = useState<string[]>([])
  const [loadingCounts, setLoadingCounts] = useState(true)

  const activeItem =
    navItems.find(item => item.id === activeSection) ?? navItems[0]

  // 加载后台数据统计
  const loadOverview = useCallback(async () => {
    const client = supabase

    if (!client) {
      setCountErrors(['Supabase 尚未配置'])
      setLoadingCounts(false)
      return
    }

    setLoadingCounts(true)

    try {
      const results = await Promise.all(
        overviewItems.map(async item => {
          try {
            const { count, error } = await client
              .from(item.key)
              .select('*', { count: 'exact', head: true })

            return {
              key: item.key,
              label: item.label,
              count: count ?? 0,
              error: error?.message ?? '',
            }
          } catch (err) {
            return {
              key: item.key,
              label: item.label,
              count: 0,
              error:
                err instanceof Error
                  ? err.message
                  : '数据读取失败',
            }
          }
        })
      )

      const nextCounts: Partial<Record<CountKey, number>> = {}
      const nextErrors: string[] = []

      results.forEach(item => {
        if (item.error) {
          nextErrors.push(`${item.label}：${item.error}`)
        } else {
          nextCounts[item.key] = item.count
        }
      })

      setCounts(nextCounts)
      setCountErrors(nextErrors)
    } finally {
      setLoadingCounts(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  // 切换后台模块
  function switchSection(section: AdminSection) {
    const target = navItems.find(item => item.id === section)

    if (!target?.available) return

    setSearchParams(section === 'overview' ? {} : { section })
    setMobileOpen(false)
  }

  // 退出管理员账号
  async function handleSignOut() {
    const client = supabase

    if (client) {
      const { error } = await client.auth.signOut()

      if (error) {
        window.alert(`退出登录失败：${error.message}`)
        return
      }
    }

    navigate('/login', { replace: true })
  }

  const email = user?.email || '管理员账号'

  const avatarText = email.charAt(0).toUpperCase() || 'A'

  return (
    <div className="admin-shell">

      {/* 移动端遮罩 */}
      {mobileOpen && (
        <button
          type="button"
          className="admin-overlay"
          aria-label="关闭菜单"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 左侧管理菜单 */}
      <aside
        className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}
      >
        <div className="admin-brand">
          <div className="admin-brand-icon">P.</div>

          <div>
            <strong>PERSONAL HUB.</strong>
            <span>ADMIN CONSOLE</span>
          </div>

          <button
            type="button"
            className="admin-mobile-close"
            aria-label="关闭菜单"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="admin-sidebar-label">
          WORKSPACE
        </div>

        <nav className="admin-nav">
          {navItems.map(item => {
            const Icon = item.icon
            const active = activeSection === item.id

            return (
              <button
                type="button"
                key={item.id}
                disabled={!item.available}
                className={`admin-nav-item ${active ? 'active' : ''}`}
                style={{
                  cursor: item.available ? 'pointer' : 'not-allowed',
                  opacity: item.available ? 1 : 0.55,
                }}
                onClick={() => switchSection(item.id)}
                title={item.description}
              >
                <Icon size={18} />

                <span>{item.label}</span>

                {!item.available && (
                  <span className="admin-nav-soon">
                    SOON
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* 侧边栏底部 */}
        <div className="admin-sidebar-bottom">

          <div className="admin-user">
            <div className="admin-user-avatar">
              {avatarText}
            </div>

            <div className="admin-user-info">
              <strong>网站管理员</strong>
              <span>{email}</span>
            </div>

            <ShieldCheck
              size={17}
              className="admin-shield"
            />
          </div>

          <Link
            to="/"
            className="admin-bottom-link"
          >
            <ArrowUpRight size={16} />
            返回公开网站
          </Link>

          <button
            type="button"
            className="admin-bottom-link"
            onClick={() => void handleSignOut()}
          >
            <LogOut size={16} />
            退出登录
          </button>

        </div>
      </aside>

      {/* 右侧主区域 */}
      <div className="admin-main">

        {/* 顶部导航 */}
        <header className="admin-topbar">

          <button
            type="button"
            className="admin-mobile-menu"
            aria-label="打开菜单"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="admin-breadcrumb">
            <span>PERSONAL HUB</span>
            <span>/</span>
            <strong>{activeItem.label}</strong>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-online">
              <i />
              管理员模式
            </span>

            <Link
              to="/"
              className="admin-view-site"
            >
              查看网站
              <ArrowUpRight size={14} />
            </Link>
          </div>

        </header>

        {/* 后台内容 */}
        <main className="admin-content">

          {activeSection === 'overview' && (
            <>
              <div className="admin-page-heading">

                <div>
                  <span className="admin-eyebrow">
                    PERSONAL HUB / OVERVIEW
                  </span>

                  <h1>数据概览</h1>

                  <p>
                    欢迎回来，管理你的网站内容与个人数字空间。
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => void loadOverview()}
                  disabled={loadingCounts}
                >
                  <RefreshCw
                    size={15}
                    className={loadingCounts ? 'animate-spin' : ''}
                  />
                  刷新数据
                </button>

              </div>

              {/* 数据统计 */}
              <div className="admin-metric-grid">
                {overviewItems.map(item => {
                  const Icon = item.icon

                  return (
                    <div
                      className="admin-metric-card"
                      key={item.key}
                    >
                      <div className="admin-metric-top">
                        <span>{item.label}</span>
                        <Icon size={17} />
                      </div>

                      <strong>
                        {loadingCounts
                          ? '...'
                          : counts[item.key] ?? '—'}
                      </strong>

                      <span className="admin-metric-caption">
                        {item.caption}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* 数据读取异常提示 */}
              {countErrors.length > 0 && (
                <div className="admin-alert error">
                  <AlertCircle size={17} />

                  <div>
                    <strong>部分统计数据暂不可用</strong>
                    <p>
                      {countErrors.join('；')}
                    </p>
                  </div>
                </div>
              )}

              {/* 快捷管理入口 */}
              <div className="admin-panel">

                <div className="admin-panel-heading">
                  <div>
                    <h2>内容管理</h2>
                    <p>
                      选择需要维护的网站内容模块。
                    </p>
                  </div>
                </div>

                <div className="admin-quick-grid">
                  {navItems
                    .filter(item => item.id !== 'overview')
                    .map(item => {
                      const Icon = item.icon

                      return (
                        <button
                          type="button"
                          key={item.id}
                          className="admin-quick-card"
                          disabled={!item.available}
                          style={{
                            opacity: item.available ? 1 : 0.55,
                            cursor: item.available
                              ? 'pointer'
                              : 'not-allowed',
                          }}
                          onClick={() => switchSection(item.id)}
                        >
                          <Icon size={21} />

                          <strong>{item.label}</strong>

                          <span>
                            {item.available
                              ? item.description
                              : '该模块正在开发中'}
                          </span>
                        </button>
                      )
                    })}
                </div>

              </div>

              <div className="admin-footer">
                <span>PERSONAL HUB ADMIN</span>
                <span>·</span>
                <span>CONTENT MANAGEMENT SYSTEM</span>
              </div>
            </>
          )}

          {/* 项目管理：直接接入现有 CRUD 组件 */}
          {activeSection === 'projects' && (
            <ProjectsManager />
          )}

          {activeSection === 'papers' && <PapersManager />}
          {activeSection === 'posts' && <PostsManager />}
          {activeSection === 'comments' && <CommentsManager />}
          {activeSection === 'media' && <MediaManager />}
          {activeSection === 'users' && <UsersManager />}
          {activeSection === 'settings' && <SettingsManager />}

        </main>
      </div>
    </div>
  )
}
