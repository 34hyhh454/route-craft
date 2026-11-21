import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, Compass, Heart, History, Info, Moon, Route, Sun } from 'lucide-react'
import { getHealth } from '../services/api'

const links = [
  { to: '/', label: 'Dashboard', icon: Compass, end: true },
  { to: '/visualizer', label: 'Visualizer', icon: Activity },
  { to: '/history', label: 'History', icon: History },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/about', label: 'About', icon: Info },
]

function ThemeButton({ theme, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      <span>{theme === 'dark' ? 'Light appearance' : 'Dark appearance'}</span>
    </button>
  )
}

export default function AppLayout() {
  const [health, setHealth] = useState('checking')
  const [themeState, setThemeState] = useState(() => {
    try {
      const saved = window.localStorage.getItem('route-craft-theme')
      return { theme: saved === 'light' ? 'light' : 'dark', error: '' }
    } catch (error) {
      return { theme: 'dark', error: `Could not read the saved theme: ${error.message}` }
    }
  })
  const { theme, error: themeError } = themeState
  const location = useLocation()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      window.localStorage.setItem('route-craft-theme', next)
      setThemeState({ theme: next, error: '' })
    } catch (error) {
      setThemeState({ theme: next, error: `Could not save the selected theme: ${error.message}` })
    }
  }
  useEffect(() => {
    let active = true
    const check = () => getHealth().then(() => active && setHealth('online')).catch(() => active && setHealth('offline'))
    check()
    const timer = window.setInterval(check, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  return (
    <div className={`app-shell ${location.pathname === '/' ? 'dashboard-shell' : ''}`}>
      <aside className="app-sidebar">
        <NavLink to="/" className="brand-lockup" aria-label="Route Craft home">
          <span className="brand-mark"><Route size={20} strokeWidth={2.5} /></span>
          <span><strong>ROUTE CRAFT</strong><small>ROUTE INTELLIGENCE</small></span>
        </NavLink>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className={`backend-status ${health}`} role="status">
            <span className="status-dot" />
            <span>{health === 'checking' ? 'Checking backend' : health === 'online' ? 'Online' : 'Offline'}</span>
            <span className="status-service">API</span>
          </div>
          <ThemeButton theme={theme} onToggle={toggleTheme} />
          {themeError && <p className="theme-error" role="status">{themeError}</p>}
        </div>
      </aside>

      <main className="app-main">
        <div className={`app-content ${location.pathname === '/' ? 'app-content-dashboard' : ''}`}>
          <Outlet />
        </div>
      </main>

      <nav className="mobile-tabs" aria-label="Mobile navigation">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-tab${isActive ? ' active' : ''}`} aria-label={label}>
            <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
          </NavLink>
        ))}
        <button type="button" className="mobile-tab mobile-theme" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}<span>Theme</span>
        </button>
      </nav>
    </div>
  )
}
