import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ArrowUpRight, LockKeyhole, LogOut, Menu, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  ['项目', '/projects'],
  ['科研', '/papers'],
  ['笔记', '/posts'],
  ['生活', '/life'],
]

export function SiteLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
      setMenuOpen(false)
      navigate('/', { replace: true })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '退出登录失败')
    }
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Personal Hub 首页" onClick={closeMenu}>
            <span className="brand-mark">P.</span>
            <span className="brand-name">PERSONAL HUB<span>.</span></span>
          </Link>

          <button
            type="button"
            className="mobile-menu"
            onClick={() => setMenuOpen(value => !value)}
            aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
          >
            {menuOpen ? <X size={19}/> : <Menu size={19}/>}
          </button>

          <nav id="primary-navigation" className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label="主导航">
            <NavLink to="/" end onClick={closeMenu}>首页</NavLink>
            <NavLink to="/about" onClick={closeMenu}>关于</NavLink>
            {navItems.map(([label, path]) => (
              <NavLink key={path} to={path} onClick={closeMenu}>{label}</NavLink>
            ))}
            {user ? (
              <>
                {isAdmin && (
                  <NavLink to="/admin" className="admin-nav-link" onClick={closeMenu}>
                    <ShieldCheck size={14}/> 管理后台
                  </NavLink>
                )}
                <NavLink to="/account" className="account-link" onClick={closeMenu}>个人中心</NavLink>
                <button type="button" className="nav-text-button" onClick={() => void handleSignOut()}>
                  <LogOut size={14}/> 退出
                </button>
              </>
            ) : (
              <Link to="/login" className="login-link" onClick={closeMenu}>
                <LockKeyhole size={14}/> 登录 / 注册
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="footer-inner">
          <span>© {new Date().getFullYear()} PERSONAL HUB.</span>
          <span>Build · Learn · Share <Sparkles size={13}/></span>
          <a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            返回顶部 <ArrowUpRight size={13}/>
          </a>
        </div>
      </footer>
    </div>
  )
}
