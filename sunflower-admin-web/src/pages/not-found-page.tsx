import { Link } from 'react-router-dom'
import { Button, Card } from '@/app/admin-components'
import { useAdminAuth } from '@/features/auth/auth-store'

export function NotFoundPage() {
  const { isAuthenticated } = useAdminAuth()

  return (
    <div className="empty-state">
      <Card className="panel-card">
        <h2>页面不存在</h2>
        <p>请从左侧导航或登录入口进入经营概览、房型、价格库存、订单售后或账号页面。</p>
        <Button theme="primary">
          <Link to={isAuthenticated ? '/' : '/login'}>{isAuthenticated ? '返回工作台' : '返回登录页'}</Link>
        </Button>
      </Card>
    </div>
  )
}
