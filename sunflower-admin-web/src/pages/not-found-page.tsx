import { Link } from 'react-router-dom'
import { Button, Card } from 'tdesign-react'
import { useAdminAuth } from '@/features/auth/auth-store'

export function NotFoundPage() {
  const { isAuthenticated } = useAdminAuth()

  return (
    <div className="empty-state">
      <Card className="panel-card">
        <h2>页面不存在</h2>
        <p>当前仅完成 S10 登录与权限骨架，请从已配置路由继续进入后台页面。</p>
        <Button theme="primary">
          <Link to={isAuthenticated ? '/' : '/login'}>{isAuthenticated ? '返回工作台' : '返回登录页'}</Link>
        </Button>
      </Card>
    </div>
  )
}
