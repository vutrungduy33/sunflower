import { Card, Tag } from '@/app/admin-components'

const runtimeChecks = [
  '浏览器请求统一走同源 /api，由入口 Nginx 转发到后端服务。',
  '后台账号登录后恢复会话，失效时自动回到登录页。',
  '房型、价格库存、订单售后页面均使用后台受保护接口。',
  '生产账号、短信、支付和退款需要通过人工 QA 记录完成最终确认。',
]

const operationBoundaries = [
  '价格和库存发布前先确认房型、日期范围和变更摘要。',
  '退款、改期、入住、离店和失约处理都应以实际订单状态为准。',
  '真实支付和退款动作只在已获批准的验证窗口执行。',
  '本地测试结果不能替代生产账号、真实订单和外部支付链路证据。',
]

export function FoundationsPage() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <Tag theme="primary" variant="light-outline">
            运行状态
          </Tag>
          <h3>后台系统状态</h3>
          <p>面向上线前后运营检查，集中展示后台入口、账号安全、接口连通和关键操作边界。</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <Card className="panel-card" title="运行检查">
          <ul className="bullet-list">
            {runtimeChecks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="panel-card" title="操作边界">
          <ul className="bullet-list">
            {operationBoundaries.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  )
}
