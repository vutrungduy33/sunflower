import type { ReactNode } from 'react'
import { useLocation, useMatches, useNavigate } from 'react-router-dom'
import {
  AppstoreOutlined,
  CalendarOutlined,
  DashboardOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import { Avatar, Breadcrumb, Button, Layout, Menu, Space, Tag } from 'antd'
import { appEnv } from '@/config/env'
import { navigationItems, type RouteHandle, resolveNavigation } from '@/app/navigation'
import { logoutAdmin } from '@/features/auth/auth-service'
import { useAdminAuth } from '@/features/auth/auth-store'

function readRouteHandle(matches: ReturnType<typeof useMatches>, pathname: string) {
  const matchedRoute = [...matches]
    .reverse()
    .find((match) => match.handle && typeof (match.handle as RouteHandle).label !== 'undefined')

  return (matchedRoute?.handle as RouteHandle | undefined) ?? resolveNavigation(pathname)
}

interface ShellLayoutProps {
  children: ReactNode
}

const navigationIconMap: Record<string, ReactNode> = {
  foundations: <SafetyCertificateOutlined />,
  orders: <ShoppingOutlined />,
  overview: <DashboardOutlined />,
  pricing: <CalendarOutlined />,
  rooms: <HomeOutlined />,
}

export function ShellLayout({ children }: ShellLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const matches = useMatches()
  const { account } = useAdminAuth()
  const currentRoute = readRouteHandle(matches, location.pathname)

  const handleMenuChange = (value: string | number) => {
    const targetRoute = navigationItems.find((item) => item.value === value)

    if (targetRoute) {
      void navigate(targetRoute.path)
    }
  }

  const handleLogout = async () => {
    await logoutAdmin()
    void navigate('/login', { replace: true })
  }

  return (
    <Layout className="admin-layout">
      <Layout.Sider className="admin-layout__aside" width={248}>
        <div className="admin-brand">
          <div className="brand-mark">SF</div>
          <div>
            <p className="eyebrow">Sunflower</p>
            <h1>运营后台</h1>
          </div>
        </div>

        <Menu
          className="admin-menu"
          items={navigationItems.map((item) => ({
            icon: navigationIconMap[item.value] ?? <AppstoreOutlined />,
            key: item.value,
            label: (
                <div className="admin-menu__item">
                  <span>{item.label}</span>
                  <small>{item.statusLabel}</small>
                </div>
            ),
          }))}
          mode="inline"
          selectedKeys={[currentRoute.value]}
          theme="dark"
          onClick={({ key }) => handleMenuChange(key)}
        />

        <div className="admin-layout__aside-footer">
          <Tag color="green">
            {account?.roleLabel || '已登录'}
          </Tag>
          <p>{account?.phone || '当前后台账号'}</p>
        </div>
      </Layout.Sider>

      <Layout className="admin-layout__main">
        <Layout.Header className="admin-layout__header">
          <div className="admin-layout__header-copy">
            <Breadcrumb
              items={[
                { title: '管理后台' },
                { title: currentRoute.label },
              ]}
            />
            <h2>{currentRoute.label}</h2>
            <p>{currentRoute.description}</p>
          </div>

          <Space align="center" size={16}>
            <Tag color="blue">
              {currentRoute.statusLabel}
            </Tag>
            <Avatar size={40}>{(account?.roleLabel || '管').slice(0, 1)}</Avatar>
            <div className="admin-layout__account-copy">
              <strong>{account?.phone || '未命名账号'}</strong>
              <span>{account?.roleLabel || '后台账号'}</span>
            </div>
            <Button onClick={() => void navigate('/account/password')}>
              修改密码
            </Button>
            <Button type="primary" onClick={() => void handleLogout()}>
              退出登录
            </Button>
          </Space>
        </Layout.Header>

        <Layout.Content className="admin-layout__content">
          {children}
        </Layout.Content>

        <Layout.Footer className="admin-layout__footer">
          <span>接口入口：{appEnv.apiBaseUrl}</span>
          <span>{appEnv.appTitle}</span>
        </Layout.Footer>
      </Layout>
    </Layout>
  )
}
