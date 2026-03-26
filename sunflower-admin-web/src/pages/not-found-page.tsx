import { Link } from 'react-router-dom'
import { Button, Card } from 'tdesign-react'
import { useAdminAuth } from '@/features/auth/auth-store'

export function NotFoundPage() {
  const { isAuthenticated } = useAdminAuth()

  return (
    <div className="empty-state">
      <Card className="panel-card">
        <h2>页面不存在</h2>
        <p>当前后台已升级到 S17 真实账号登录，请从已配置路由继续进入房型、价格库存、订单或账号页面。</p>
        <Button theme="primary">
          <Link to={isAuthenticated ? '/' : '/login'}>{isAuthenticated ? '返回工作台' : '返回登录页'}</Link>
        </Button>
      </Card>
    </div>
  )
}
