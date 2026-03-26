import { useQuery } from '@tanstack/react-query'
import { Button, Card, Space, Tag } from 'tdesign-react'
import { appEnv } from '@/config/env'
import { useAdminAuth } from '@/features/auth/auth-store'
import { fetchHealth } from '@/services/health'

const installedCapabilities = [
  '手机号密码登录',
  '首次激活',
  '短信重置密码',
  '受保护路由',
  '统一菜单配置',
  'Axios 鉴权注入',
  '登录态恢复与 401 清理',
  '订单筛选与详情抽屉',
  '后台改期与退款处理',
]

const nextSteps = [
  { stage: 'S18', title: '真实微信支付 / 退款与资金流水' },
]

function maskToken(token: string) {
  if (token.length <= 6) {
    return `${token.slice(0, 2)}***`
  }

  return `${token.slice(0, 4)}***${token.slice(-2)}`
}

export function WorkspacePage() {
  const { token, account } = useAdminAuth()
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  })

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

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <Tag theme="success" variant="light-outline">
            S17 后台真实账号体系已接入
          </Tag>
          <h3>管理工作台</h3>
          <p>
            当前阶段已补齐手机号 + 密码登录、首次激活、短信重置密码、修改密码与会话恢复，并沿用现有房型、价格库存、订单售后主链路。
          </p>
        </div>
        <div className="hero-panel__meta">
          <span>标题：{appEnv.appTitle}</span>
          <span>代理目标：{appEnv.apiProxyTarget}</span>
          <span>当前账号：{account?.phone || '未恢复'}</span>
          <span>角色：{account?.roleLabel || '未知'}</span>
          <span>当前 token：{maskToken(token)}</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <Card className="panel-card" title="登录态概览">
          <div className="status-panel">
            <Tag theme="success" variant="light-outline">
              已登录
            </Tag>
            <dl className="status-list">
              <div>
                <dt>鉴权模式</dt>
                <dd>后台会话 Token</dd>
              </div>
              <div>
                <dt>当前账号</dt>
                <dd>{account?.phone || '未恢复'}</dd>
              </div>
              <div>
                <dt>当前角色</dt>
                <dd>{account?.roleLabel || '未知'}</dd>
              </div>
              <div>
                <dt>受保护页面</dt>
                <dd>经营概览 / 房型管理 / 价格库存 / 订单售后 / 修改密码</dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card className="panel-card" title="后端连通性">
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
                  <dt>时间戳</dt>
                  <dd>{healthQuery.data.timestamp || 'n/a'}</dd>
                </div>
              </dl>
            ) : null}

            {healthQuery.isError ? (
              <p className="status-error">
                无法访问 `/api/health`，请确认后端已启动。
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="panel-card" title="当前已接入能力">
          <ul className="bullet-list">
            {[
              ...installedCapabilities,
              '房型列表与创建编辑',
              '房型上下架与状态反馈',
              '价格日历按窗口查询',
              '按日期区间批量更新价格与库存',
              '订单列表筛选与经营概览',
              '订单详情抽屉与售后反馈',
            ].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <Card className="panel-card" title="后续阶段占位">
        <div className="roadmap-grid">
          {nextSteps.map((item) => (
            <article key={item.stage} className="roadmap-card">
              <span className="roadmap-card__stage">{item.stage}</span>
              <h3>{item.title}</h3>
            </article>
          ))}
        </div>
      </Card>
    </div>
  )
}
