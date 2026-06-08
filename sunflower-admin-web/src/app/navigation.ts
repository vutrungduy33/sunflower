export interface NavigationItem {
  value: string
  path: string
  label: string
  description: string
  statusLabel: string
}

export type RouteHandle = NavigationItem

export const navigationItems: NavigationItem[] = [
  {
    value: 'overview',
    path: '/',
    label: '经营概览',
    description: '快速查看订单、房型、库存和系统连通状态。',
    statusLabel: '运营中',
  },
  {
    value: 'rooms',
    path: '/rooms',
    label: '房型管理',
    description: '维护房型基础资料、上架状态、卖点和基础价格。',
    statusLabel: '可操作',
  },
  {
    value: 'pricing',
    path: '/pricing',
    label: '价格库存',
    description: '按月查看房态日历，并批量发布价格与库存。',
    statusLabel: '可操作',
  },
  {
    value: 'orders',
    path: '/orders',
    label: '订单售后',
    description: '处理订单详情、入住履约、改期、退款和售后审批。',
    statusLabel: '可操作',
  },
  {
    value: 'foundations',
    path: '/foundations',
    label: '系统状态',
    description: '查看账号安全、接口连通、运行依赖和上线检查入口。',
    statusLabel: '可查看',
  },
]

export function resolveNavigation(pathname: string) {
  return (
    navigationItems.find((item) => item.path === pathname) ??
    navigationItems.find((item) => item.path !== '/' && pathname.startsWith(`${item.path}/`)) ??
    navigationItems[0]
  )
}
