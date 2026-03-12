import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/features/auth/auth-store'
import { ShellLayout } from '@/app/shell-layout'

export function ProtectedShell() {
  const location = useLocation()
  const { isAuthenticated } = useAdminAuth()

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
