import { Card } from 'tdesign-react'

const modules = [
  'app/router：统一路由入口',
  'config/env：环境变量解析',
  'services/http：Axios 实例',
  'services/health：健康检查调用',
  'pages/*：S9 占位页面',
]

const rules = [
  '默认通过 Vite proxy 转发 /api，避免业务代码写死 localhost',
  'TDesign 作为唯一主 UI 框架',
  '服务端状态优先走 TanStack Query',
  'S9 只做工程底座，不提前做登录和业务流',
]

export function FoundationsPage() {
  return (
    <div className="page-stack">
      <Card className="panel-card" title="目录基线">
        <ul className="bullet-list">
          {modules.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card className="panel-card" title="工程约束">
        <ul className="bullet-list">
          {rules.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
