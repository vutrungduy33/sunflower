import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Space, Tag } from '@/app/admin-components'
import { appEnv } from '@/config/env'
import { useAdminAuth } from '@/features/auth/auth-store'
import { fetchAdminOrderOverview } from '@/features/orders/admin-order-service'
import { fetchAdminRooms } from '@/features/rooms/admin-room-service'
import { fetchHealth } from '@/services/health'

function formatCurrency(amount?: number) {
  if (typeof amount !== 'number') {
    return '--'
  }

  return `¥${amount.toLocaleString('zh-CN')}`
}

export function WorkspacePage() {
  const { account } = useAdminAuth()
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  })
  const roomsQuery = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: fetchAdminRooms,
  })
  const orderOverviewQuery = useQuery({
    queryKey: ['admin-order-overview'],
    queryFn: fetchAdminOrderOverview,
  })

  const rooms = roomsQuery.data ?? []
  const activeRoomCount = rooms.filter((room) => room.status === 'ACTIVE').length
  const healthTheme =
    healthQuery.isSuccess && healthQuery.data.status === 'UP'
      ? 'success'
      : healthQuery.isError
        ? 'danger'
        : 'warning'
  const healthLabel =
    healthQuery.isSuccess && healthQuery.data.status
      ? healthQuery.data.status
      : healthQuery.isError
        ? 'UNAVAILABLE'
        : 'CHECKING'

  const metrics = [
    {
      label: '房型在售',
      value: roomsQuery.isPending ? '--' : activeRoomCount,
      detail: `共 ${rooms.length} 个房型`,
    },
    {
      label: '待入住',
      value: orderOverviewQuery.data?.pendingCheckInCount ?? '--',
      detail: '需关注今日及近期到店订单',
    },
    {
      label: '订单总数',
      value: orderOverviewQuery.data?.orderCount ?? '--',
      detail: '后台可处理订单',
    },
    {
      label: '成交额',
      value: formatCurrency(orderOverviewQuery.data?.revenueAmount),
      detail: '已支付和部分退款订单口径',
    },
  ]

  return (
    <div className="page-stack">
      <section className="hero-panel workspace-hero">
        <div className="hero-panel__copy">
          <h3>今日运营总览</h3>
          <p>
            面向前台和运营的日常工作台：快速确认房型在售、待入住订单、收入概览和接口健康状态。
          </p>
        </div>
        <div className="workspace-hero__account">
          <Tag theme="success" variant="light-outline">
            {account?.roleLabel || '后台账号'}
          </Tag>
          <strong>{account?.phone || '当前账号'}</strong>
          <span>接口入口：{appEnv.apiBaseUrl}</span>
        </div>
      </section>

      <section className="ops-metric-grid">
        {metrics.map((item) => (
          <article key={item.label} className="ops-metric-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <Card className="panel-card" title="系统健康">
          <div className="status-panel">
            <Space align="center" size={12}>
              <Tag theme={healthTheme} variant="light-outline">
                {healthLabel}
              </Tag>
              <Button
                theme="primary"
                variant="outline"
                onClick={() => void healthQuery.refetch()}
              >
                重新检测
              </Button>
            </Space>

            {healthQuery.isSuccess ? (
              <dl className="status-list">
                <div>
                  <dt>服务名</dt>
                  <dd>{healthQuery.data.service || 'unknown'}</dd>
                </div>
                <div>
                  <dt>最近响应</dt>
                  <dd>{healthQuery.data.timestamp || 'n/a'}</dd>
                </div>
              </dl>
            ) : null}

            {healthQuery.isError ? (
              <p className="status-error">
                无法访问 `/api/health`，请确认后端服务和反向代理可用。
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="panel-card" title="常用操作">
          <div className="quick-action-list">
            <Link to="/rooms">维护房型资料与上下架状态</Link>
            <Link to="/pricing">发布价格与库存</Link>
            <Link to="/orders">处理订单、入住、退款与售后</Link>
            <Link to="/account/password">修改当前后台账号密码</Link>
          </div>
        </Card>

        <Card className="panel-card" title="运营关注">
          <ul className="bullet-list">
            <li>上线前请用真实后台账号完成登录、房型维护、价格库存发布和订单售后全链路验收。</li>
            <li>真实支付、退款和小程序合法 HTTPS 域名仍需按外部验证清单完成记录。</li>
            <li>生产操作前确认订单、房态和退款动作都有对应的人工审批边界。</li>
          </ul>
        </Card>
      </section>
    </div>
  )
}
