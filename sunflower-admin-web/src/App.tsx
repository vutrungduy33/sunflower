import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, type RouterProviderProps } from 'react-router-dom'
import { createAppQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'

interface AppProps {
  router?: RouterProviderProps['router']
}

function App({ router }: AppProps) {
  const [queryClient] = useState(() => createAppQueryClient())
  const [appRouter] = useState(() => router ?? createAppRouter())

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={appRouter} future={{ v7_startTransition: true }} />
    </QueryClientProvider>
  )
}

export default App
