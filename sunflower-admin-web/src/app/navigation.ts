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
    description: '查看管理端当前交付能力、联调状态和房型管理进展。',
    stage: 'S11',
  },
  {
    value: 'rooms',
    path: '/rooms',
    label: '房型管理',
    description: '维护房型基础信息、上下架状态和基础价格入口。',
    stage: 'S11',
  },
  {
    value: 'pricing',
    path: '/pricing',
    label: '价格库存',
    description: '按日期区间批量维护价格与库存，并查看最近一次发布反馈。',
    stage: 'S12',
  },
  {
    value: 'orders',
    path: '/orders',
    label: '订单售后',
    description: '查看订单筛选结果、详情抽屉，并完成改期和退款处理。',
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
