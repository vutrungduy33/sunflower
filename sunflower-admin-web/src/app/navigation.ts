export interface NavigationItem {
  value: string
  path: string
  label: string
  description: string
  stage: string
}

export type RouteHandle = NavigationItem

export const navigationItems: NavigationItem[] = [
  {
    value: 'overview',
    path: '/',
    label: '经营概览',
    description: '查看当前后台登录状态与联调基线。',
    stage: 'S10',
  },
  {
    value: 'rooms',
    path: '/rooms',
    label: '房型管理',
    description: 'S11 将补齐房型列表、创建与编辑流程。',
    stage: 'S11',
  },
  {
    value: 'pricing',
    path: '/pricing',
    label: '价格库存',
    description: 'S12 将补齐价格日历与库存批量编辑。',
    stage: 'S12',
  },
  {
    value: 'orders',
    path: '/orders',
    label: '订单售后',
    description: 'S13 将补齐订单筛选、详情与售后处理。',
    stage: 'S13',
  },
  {
    value: 'foundations',
    path: '/foundations',
    label: '工程基线',
    description: '查看 Web 工程约束、鉴权模块与运行依赖。',
    stage: 'S9',
  },
]

export function resolveNavigation(pathname: string) {
  return (
    navigationItems.find((item) => item.path === pathname) ??
    navigationItems.find((item) => item.path !== '/' && pathname.startsWith(`${item.path}/`)) ??
    navigationItems[0]
  )
}
