import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/features/auth/auth-store'
import { ShellLayout } from '@/app/shell-layout'

export function ProtectedShell() {
  const location = useLocation()
  const { isAuthenticated, isBootstrapping } = useAdminAuth()

  if (isBootstrapping) {
    return (
      <div className="page-stack">
        <section className="panel-card page-loading-card">
          <h3>登录态恢复中</h3>
          <p>正在校验后台会话，请稍候。</p>
        </section>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        to="/login"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    )
  }

  return (
    <ShellLayout>
      <Outlet />
    </ShellLayout>
  )
}
