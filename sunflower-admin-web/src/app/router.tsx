import { createBrowserRouter } from 'react-router-dom'
import { ShellLayout } from '@/app/shell-layout'
import { FoundationsPage } from '@/pages/foundations-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { WorkspacePage } from '@/pages/workspace-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ShellLayout />,
    children: [
      {
        index: true,
        element: <WorkspacePage />,
      },
      {
        path: 'foundations',
        element: <FoundationsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
