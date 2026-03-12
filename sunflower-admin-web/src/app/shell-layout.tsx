import { Outlet, NavLink } from 'react-router-dom'
import { Space, Tag } from 'tdesign-react'
import { appEnv } from '@/config/env'

const navItems = [
  { to: '/', label: '工作台' },
  { to: '/foundations', label: '工程基线' },
]

export function ShellLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <NavLink className="brand-mark" to="/">
            SF
          </NavLink>
          <div>
            <p className="eyebrow">Sunflower Admin</p>
            <h1>{appEnv.appTitle}</h1>
          </div>
        </div>
        <div className="app-header__meta">
          <Tag theme="success" variant="light-outline">
            S9 基线完成
          </Tag>
          <span>API：{appEnv.apiBaseUrl}</span>
        </div>
      </header>

      <nav className="app-nav">
        <Space size={12} breakLine>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </Space>
      </nav>

      <main className="app-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>Sunflower Admin Web</span>
        <span>React 18 + Vite + TDesign</span>
      </footer>
    </div>
  )
}
