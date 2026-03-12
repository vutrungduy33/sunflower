import {
  Children,
  cloneElement,
  isValidElement,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedShell } from '@/app/protected-shell'
import { loginWithAdminToken } from '@/features/auth/auth-service'
import { clearAdminToken, setAdminToken } from '@/features/auth/auth-store'
import { LoginPage } from '@/pages/login-page'

vi.mock('tdesign-react', () => {
  function LayoutLike({
    children,
    className,
  }: {
    children?: ReactNode
    className?: string
  }) {
    return <div className={className}>{children}</div>
  }

  function Card({
    children,
    className,
    title,
  }: {
    children?: ReactNode
    className?: string
    title?: ReactNode
  }) {
    return (
      <section className={className}>
        {title ? <h3>{title}</h3> : null}
        {children}
      </section>
    )
  }

  function Space({ children }: { children?: ReactNode }) {
    return <div>{children}</div>
  }

  function Tag({ children }: { children?: ReactNode }) {
    return <span>{children}</span>
  }

  function Avatar({ children }: { children?: ReactNode }) {
    return <span>{children}</span>
  }

  function Breadcrumb({
    options,
  }: {
    options?: Array<{ content?: ReactNode }>
  }) {
    return <nav>{options?.map((option) => option.content).filter(Boolean).join(' / ')}</nav>
  }

  function Button({
    children,
    onClick,
    type,
  }: {
    children?: ReactNode
    onClick?: () => void
    type?: 'button' | 'submit' | 'reset'
  }) {
    return (
      <button onClick={onClick} type={type === 'submit' ? 'submit' : 'button'}>
        {children}
      </button>
    )
  }

  function Input({
    type = 'text',
    placeholder,
    value,
    onChange,
  }: {
    type?: string
    placeholder?: string
    value?: string
    onChange?: (value: string) => void
  }) {
    return (
      <input
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)}
      />
    )
  }

  function Menu({
    children,
    onChange,
    value,
  }: {
    children?: ReactNode
    onChange?: (value: string | number) => void
    value?: string | number
  }) {
    return (
      <nav>
        {Children.map(children, (child) => {
          if (!isValidElement(child)) {
            return child
          }

          return cloneElement(child, {
            activeValue: value,
            onMenuChange: onChange,
          })
        })}
      </nav>
    )
  }

  function MenuItem({
    content,
    value,
    activeValue,
    onMenuChange,
  }: {
    content?: ReactNode
    value?: string | number
    activeValue?: string | number
    onMenuChange?: (value: string | number) => void
  }) {
    return (
      <button
        aria-current={activeValue === value ? 'page' : undefined}
        onClick={() => onMenuChange?.(value ?? '')}
        type="button"
      >
        {content}
      </button>
    )
  }

  Menu.MenuItem = MenuItem

  LayoutLike.Aside = LayoutLike
  LayoutLike.Header = LayoutLike
  LayoutLike.Content = LayoutLike
  LayoutLike.Footer = LayoutLike

  return {
    Avatar,
    Breadcrumb,
    Button,
    Card,
    Input,
    Layout: LayoutLike,
    Menu,
    Space,
    Tag,
  }
})

vi.mock('@/app/shell-layout', () => ({
  ShellLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/features/auth/auth-service', () => ({
  loginWithAdminToken: vi.fn(),
  getAdminLoginErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : '登录失败，请稍后重试',
}))

function renderLogin(initialEntries?: Array<string | { pathname: string; state?: unknown }>) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<h1>经营概览</h1>} />
        <Route path="/orders" element={<h1>订单售后</h1>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('admin auth flow', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    clearAdminToken()
    vi.mocked(loginWithAdminToken).mockReset()
    vi.mocked(loginWithAdminToken).mockImplementation(async (token: string) => {
      setAdminToken(token.trim())
    })
  })

  it('redirects unauthenticated users to login for protected routes', async () => {
    render(
      <MemoryRouter initialEntries={['/rooms']}>
        <Routes>
          <Route path="/login" element={<h1>管理端登录</h1>} />
          <Route element={<ProtectedShell />}>
            <Route path="/rooms" element={<h1>房型管理</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: '管理端登录' })).toBeInTheDocument()
  })

  it('navigates to the target business route after a successful login', async () => {
    const user = userEvent.setup()

    renderLogin([{ pathname: '/login', state: { from: '/orders' } }])

    await user.type(screen.getByPlaceholderText('请输入管理端 token'), '  test-admin-token  ')
    await user.click(screen.getByRole('button', { name: '登录后台' }))

    expect(vi.mocked(loginWithAdminToken)).toHaveBeenCalledWith('  test-admin-token  ')
    expect(await screen.findByRole('heading', { level: 1, name: '订单售后' })).toBeInTheDocument()
  })

  it('shows a clear error when login fails', async () => {
    const user = userEvent.setup()

    vi.mocked(loginWithAdminToken).mockRejectedValueOnce(new Error('管理端登录态无效'))

    renderLogin(['/login'])

    await user.type(screen.getByPlaceholderText('请输入管理端 token'), 'wrong-admin-token')
    await user.click(screen.getByRole('button', { name: '登录后台' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('管理端登录态无效')
    expect(screen.getByRole('heading', { level: 1, name: '管理端登录' })).toBeInTheDocument()
  })
})
