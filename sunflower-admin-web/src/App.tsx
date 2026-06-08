import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
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
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 8,
          colorText: '#172033',
          colorBgLayout: '#f5f7fb',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Layout: {
            bodyBg: '#f5f7fb',
            headerBg: '#ffffff',
            siderBg: '#111827',
          },
          Menu: {
            darkItemBg: '#111827',
            darkSubMenuItemBg: '#111827',
            darkItemSelectedBg: '#2563eb',
          },
        },
      }}
    >
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <AdminAuthBootstrap />
          <RouterProvider router={appRouter} future={{ v7_startTransition: true }} />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
