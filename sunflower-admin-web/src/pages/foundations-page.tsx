import { Card } from 'tdesign-react'

const modules = [
  'app/router：统一路由入口',
  'app/navigation：菜单与路由元信息',
  'config/env：环境变量解析',
  'features/auth/*：登录态存储与登录校验',
  'services/http：Axios 实例',
  'services/health：健康检查调用',
  'pages/*：S10 登录页与业务占位页',
]

const rules = [
  '默认通过 Vite proxy 转发 /api，避免业务代码写死 localhost',
  'TDesign 作为唯一主 UI 框架',
  '服务端状态优先走 TanStack Query',
  '登录态基于后台账号会话，应用启动后通过 /api/admin/account/me 恢复并校验',
  '401 时自动清理本地会话，未登录访问业务路由自动跳转 /login',
  'S17 仅实现最小角色 admin/operator，不提前扩展完整 RBAC 后台',
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
