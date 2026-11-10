import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ArrowUpRight, LockKeyhole, LogOut, Menu, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  ['项目', '/projects'],
  ['科研', '/papers'],
  ['笔记', '/posts'],
  ['生活', '/life'],
]

export function SiteLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      alert(error instanceof Error ? error.message : '退出登录失败')
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Personal Hub 首页">
            <span className="brand-mark">P.</span>
            <span className="brand-name">PERSONAL HUB<span>.</span></span>
          </Link>

          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="切换导航">
            <Menu size={19} />
          </button>

          <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
            <NavLink to="/" end>首页</NavLink>
            <NavLink to="/about">关于</NavLink>
            {navItems.map(([label, path]) => <NavLink key={path} to={path}>{label}</NavLink>)}
            {user ? (
              <>
                <NavLink to="/account" className="account-link">个人中心</NavLink>
                <button className="nav-text-button" onClick={handleSignOut}><LogOut size={14}/> 退出</button>
              </>
            ) : (
              <Link to="/login" className="login-link"><LockKeyhole size={14}/> 登录 / 注册</Link>
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
