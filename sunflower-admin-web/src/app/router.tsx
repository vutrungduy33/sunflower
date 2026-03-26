import { Suspense, lazy, type ReactNode } from 'react'
import {
  createBrowserRouter,
  createMemoryRouter,
  type RouteObject,
} from 'react-router-dom'
import { navigationItems, type RouteHandle } from '@/app/navigation'
import { ProtectedShell } from '@/app/protected-shell'

const [overviewItem, roomsItem, pricingItem, ordersItem, foundationsItem] = navigationItems
const FoundationsPage = lazy(async () => import('@/pages/foundations-page').then((module) => ({
  default: module.FoundationsPage,
})))
const ActivatePage = lazy(async () => import('@/pages/activate-page').then((module) => ({
  default: module.ActivatePage,
})))
const ChangePasswordPage = lazy(async () => import('@/pages/change-password-page').then((module) => ({
  default: module.ChangePasswordPage,
})))
const LoginPage = lazy(async () => import('@/pages/login-page').then((module) => ({
  default: module.LoginPage,
})))
const NotFoundPage = lazy(async () => import('@/pages/not-found-page').then((module) => ({
  default: module.NotFoundPage,
})))
const PricingManagementPage = lazy(async () => import('@/pages/pricing-management-page').then((module) => ({
  default: module.PricingManagementPage,
})))
const OrderManagementPage = lazy(async () => import('@/pages/order-management-page').then((module) => ({
  default: module.OrderManagementPage,
})))
const RoomManagementPage = lazy(async () => import('@/pages/room-management-page').then((module) => ({
  default: module.RoomManagementPage,
})))
const ResetPasswordPage = lazy(async () => import('@/pages/reset-password-page').then((module) => ({
  default: module.ResetPasswordPage,
})))
const WorkspacePage = lazy(async () => import('@/pages/workspace-page').then((module) => ({
  default: module.WorkspacePage,
})))

function renderDeferredPage(page: ReactNode) {
  return (
    <Suspense
      fallback={(
        <div className="page-stack">
          <section className="panel-card page-loading-card">
            <h3>页面加载中</h3>
            <p>正在按路由加载对应模块。</p>
          </section>
        </div>
      )}
    >
      {page}
    </Suspense>
  )
}

export const appRoutes: RouteObject[] = [
  {
    path: '/login',
    element: renderDeferredPage(<LoginPage />),
  },
  {
    path: '/activate',
    element: renderDeferredPage(<ActivatePage />),
  },
  {
    path: '/reset-password',
    element: renderDeferredPage(<ResetPasswordPage />),
  },
  {
    path: '/',
    element: <ProtectedShell />,
    children: [
      {
        index: true,
        element: renderDeferredPage(<WorkspacePage />),
        handle: overviewItem satisfies RouteHandle,
      },
      {
        path: 'rooms',
        element: renderDeferredPage(<RoomManagementPage />),
        handle: roomsItem satisfies RouteHandle,
      },
      {
        path: 'pricing',
        element: renderDeferredPage(<PricingManagementPage />),
        handle: pricingItem satisfies RouteHandle,
      },
      {
        path: 'orders',
        element: renderDeferredPage(<OrderManagementPage />),
        handle: ordersItem satisfies RouteHandle,
      },
      {
        path: 'foundations',
        element: renderDeferredPage(<FoundationsPage />),
        handle: foundationsItem satisfies RouteHandle,
      },
      {
        path: 'account/password',
        element: renderDeferredPage(<ChangePasswordPage />),
        handle: {
          value: 'account-password',
          path: '/account/password',
          label: '修改密码',
          description: '更新当前后台账号密码，并让旧登录态自动失效。',
          stage: 'S17',
        } satisfies RouteHandle,
      },
    ],
  },
  {
    path: '*',
    element: renderDeferredPage(<NotFoundPage />),
  },
]

export function createAppRouter(initialEntries?: string[]) {
  if (initialEntries) {
    return createMemoryRouter(appRoutes, { initialEntries })
  }

  return createBrowserRouter(appRoutes)
}
