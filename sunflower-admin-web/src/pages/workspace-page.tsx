import { useQuery } from '@tanstack/react-query'
import { Button, Card, Space, Tag } from 'tdesign-react'
import { appEnv } from '@/config/env'
import { fetchHealth } from '@/services/health'

const installedCapabilities = [
  'Vite + React 18 + TypeScript 基础工程',
  'TDesign React 组件库与视觉基线',
  'React Router 路由入口与 404 页面',
  'Axios HTTP 客户端与环境配置',
  'TanStack Query 查询基线',
  'Vitest + Testing Library 测试依赖',
]

const nextSteps = [
  { stage: 'S10', title: '登录与权限骨架' },
  { stage: 'S11', title: '房型管理页面' },
  { stage: 'S12', title: '价格库存批量编辑' },
  { stage: 'S13', title: '订单与售后页面' },
]

export function WorkspacePage() {
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
            S9 管理后台工程初始化
          </Tag>
          <h2>Sunflower Admin Web</h2>
          <p>
            当前阶段完成工程骨架、UI 组件库、路由、HTTP 客户端、环境配置与测试依赖接入，
            暂不进入登录和业务页面开发。
          </p>
        </div>
        <div className="hero-panel__meta">
          <span>标题：{appEnv.appTitle}</span>
          <span>代理目标：{appEnv.apiProxyTarget}</span>
        </div>
      </section>

      <section className="dashboard-grid">
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
