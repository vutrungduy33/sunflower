import {
  createBrowserRouter,
  createMemoryRouter,
  type RouteObject,
} from 'react-router-dom'
import { navigationItems, type RouteHandle } from '@/app/navigation'
import { ProtectedShell } from '@/app/protected-shell'
import { FeaturePlaceholderPage } from '@/pages/feature-placeholder-page'
import { FoundationsPage } from '@/pages/foundations-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { WorkspacePage } from '@/pages/workspace-page'

const [overviewItem, roomsItem, pricingItem, ordersItem, foundationsItem] = navigationItems

export const appRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedShell />,
    children: [
      {
        index: true,
        element: <WorkspacePage />,
        handle: overviewItem satisfies RouteHandle,
      },
      {
        path: 'rooms',
        element: (
          <FeaturePlaceholderPage
            title={roomsItem.label}
            stage={roomsItem.stage}
            summary="当前阶段先提供菜单入口与登录守卫，房型 CRUD 将在下一阶段接入。"
            bulletPoints={[
              '接入 S7 房型列表与详情查询接口。',
              '补齐创建、编辑、上架与下架操作。',
              '统一成功/失败反馈与表单校验。',
            ]}
          />
        ),
        handle: roomsItem satisfies RouteHandle,
      },
      {
        path: 'pricing',
        element: (
          <FeaturePlaceholderPage
            title={pricingItem.label}
            stage={pricingItem.stage}
            summary="当前仅保留受保护菜单入口，价格日历与库存批量编辑将在 S12 完成。"
            bulletPoints={[
              '按日期区间批量设置价格与库存。',
              '展示已发布价格、剩余库存和冲突反馈。',
              '补齐至少一条端到端冒烟场景。',
            ]}
          />
        ),
        handle: pricingItem satisfies RouteHandle,
      },
      {
        path: 'orders',
        element: (
          <FeaturePlaceholderPage
            title={ordersItem.label}
            stage={ordersItem.stage}
            summary="当前仅开放登录后的页面骨架，订单筛选、详情和售后操作将在 S13 开发。"
            bulletPoints={[
              '接入 S8 订单列表与详情接口。',
              '补齐改期、退款和失败反馈处理。',
              '统一状态标签、筛选区和详情视图。',
            ]}
          />
        ),
        handle: ordersItem satisfies RouteHandle,
      },
      {
        path: 'foundations',
        element: <FoundationsPage />,
        handle: foundationsItem satisfies RouteHandle,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

export function createAppRouter(initialEntries?: string[]) {
  if (initialEntries) {
    return createMemoryRouter(appRoutes, { initialEntries })
  }

  return createBrowserRouter(appRoutes)
}
