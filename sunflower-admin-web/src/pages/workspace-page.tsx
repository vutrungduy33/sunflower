import { useQuery } from '@tanstack/react-query'
import { Button, Card, Space, Tag } from 'tdesign-react'
import { appEnv } from '@/config/env'
import { useAdminAuth } from '@/features/auth/auth-store'
import { fetchHealth } from '@/services/health'

const installedCapabilities = ['登录页', '受保护路由', '统一菜单配置', 'Axios 鉴权注入', '401 失效清理']

const nextSteps = [
  { stage: 'S11', title: '房型管理页面' },
  { stage: 'S12', title: '价格库存批量编辑' },
  { stage: 'S13', title: '订单与售后页面' },
]

function maskToken(token: string) {
  if (token.length <= 6) {
    return `${token.slice(0, 2)}***`
  }

  return `${token.slice(0, 4)}***${token.slice(-2)}`
}

export function WorkspacePage() {
  const { token } = useAdminAuth()
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
          <Tag theme="warning" variant="light-outline">
            S10 管理后台登录与权限骨架
          </Tag>
          <h3>管理工作台</h3>
          <p>
            当前阶段已补齐登录页、统一请求鉴权、基础布局和业务路由守卫。S11-S13 将在此骨架上逐步接入房型、价格库存和订单售后页面。
          </p>
        </div>
        <div className="hero-panel__meta">
          <span>标题：{appEnv.appTitle}</span>
          <span>代理目标：{appEnv.apiProxyTarget}</span>
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
                <dd>Bearer Token</dd>
              </div>
              <div>
                <dt>自动处理</dt>
                <dd>请求头注入 + 401 清理</dd>
              </div>
              <div>
                <dt>受保护页面</dt>
                <dd>经营概览 / 房型管理 / 价格库存 / 订单售后</dd>
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
            {installedCapabilities.map((item) => (
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
