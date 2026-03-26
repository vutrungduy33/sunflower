import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, type RouterProviderProps } from 'react-router-dom'
import { createAppQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'
import { bootstrapAdminSession } from '@/features/auth/auth-service'
import { useAdminAuth } from '@/features/auth/auth-store'

interface AppProps {
  router?: RouterProviderProps['router']
}

function AdminAuthBootstrap() {
  const { token, isBootstrapping } = useAdminAuth()

  useEffect(() => {
    if (!token || !isBootstrapping) {
      return
    }

    void bootstrapAdminSession()
  }, [isBootstrapping, token])

  return null
}

function App({ router }: AppProps) {
  const [queryClient] = useState(() => createAppQueryClient())
  const [appRouter] = useState(() => router ?? createAppRouter())

  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthBootstrap />
      <RouterProvider router={appRouter} future={{ v7_startTransition: true }} />
    </QueryClientProvider>
  )
}

export default App
