import type { ReactNode } from 'react'
import { useLocation, useMatches, useNavigate } from 'react-router-dom'
import { Avatar, Breadcrumb, Button, Layout, Menu, Space, Tag } from 'tdesign-react'
import { appEnv } from '@/config/env'
import { navigationItems, type RouteHandle, resolveNavigation } from '@/app/navigation'
import { clearAdminToken } from '@/features/auth/auth-store'

function readRouteHandle(matches: ReturnType<typeof useMatches>, pathname: string) {
  const matchedRoute = [...matches]
    .reverse()
    .find((match) => match.handle && typeof (match.handle as RouteHandle).label !== 'undefined')

  return (matchedRoute?.handle as RouteHandle | undefined) ?? resolveNavigation(pathname)
}

interface ShellLayoutProps {
  children: ReactNode
}

export function ShellLayout({ children }: ShellLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const matches = useMatches()
  const currentRoute = readRouteHandle(matches, location.pathname)

  const handleMenuChange = (value: string | number) => {
    const targetRoute = navigationItems.find((item) => item.value === value)

    if (targetRoute) {
      void navigate(targetRoute.path)
    }
  }

  const handleLogout = () => {
    clearAdminToken()
    void navigate('/login', { replace: true })
  }

  return (
    <Layout className="admin-layout">
      <Layout.Aside className="admin-layout__aside">
        <div className="admin-brand">
          <div className="brand-mark">SF</div>
          <div>
            <p className="eyebrow">Sunflower Admin</p>
            <h1>{appEnv.appTitle}</h1>
          </div>
        </div>

        <Menu
          className="admin-menu"
          theme="light"
          value={currentRoute.value}
          width="100%"
          onChange={handleMenuChange}
        >
          {navigationItems.map((item) => (
            <Menu.MenuItem
              key={item.value}
              value={item.value}
              content={
                <div className="admin-menu__item">
                  <span>{item.label}</span>
                  <small>{item.stage}</small>
                </div>
              }
            />
          ))}
        </Menu>

        <div className="admin-layout__aside-footer">
          <Tag theme="success" variant="light-outline">
            已登录
          </Tag>
          <p>当前使用静态 Bearer Token 鉴权，未登录访问业务页将自动跳转到登录页。</p>
        </div>
      </Layout.Aside>

      <Layout className="admin-layout__main">
        <Layout.Header className="admin-layout__header">
          <div className="admin-layout__header-copy">
            <Breadcrumb
              options={[
                { content: '管理后台' },
                { content: currentRoute.label },
              ]}
            />
            <h2>{currentRoute.label}</h2>
            <p>{currentRoute.description}</p>
          </div>

          <Space align="center" size={16}>
            <Tag theme="warning" variant="light-outline">
              S10 登录与权限骨架
            </Tag>
            <Avatar size="40px">A</Avatar>
            <Button variant="outline" theme="primary" onClick={handleLogout}>
              退出登录
            </Button>
          </Space>
        </Layout.Header>

        <Layout.Content className="admin-layout__content">
          {children}
        </Layout.Content>

        <Layout.Footer className="admin-layout__footer">
          <span>当前 API：{appEnv.apiBaseUrl}</span>
          <span>未登录不可访问后台业务页</span>
        </Layout.Footer>
      </Layout>
    </Layout>
  )
}
