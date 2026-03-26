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
import {
  activateAdminAccount,
  loginWithAdminPassword,
  resetAdminPassword,
  sendAdminSmsCode,
} from '@/features/auth/auth-service'
import {
  clearAdminSession,
  setAdminBootstrapping,
  setAdminSession,
} from '@/features/auth/auth-store'
import { ActivatePage } from '@/pages/activate-page'
import { LoginPage } from '@/pages/login-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'

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
    disabled,
    onClick,
    type,
  }: {
    children?: ReactNode
    disabled?: boolean
    onClick?: () => void
    type?: 'button' | 'submit' | 'reset'
  }) {
    return (
      <button disabled={disabled} onClick={onClick} type={type === 'submit' ? 'submit' : 'button'}>
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
  activateAdminAccount: vi.fn(),
  bootstrapAdminSession: vi.fn(),
  getAdminAuthErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : '操作失败，请稍后重试',
  loginWithAdminPassword: vi.fn(),
  resetAdminPassword: vi.fn(),
  sendAdminSmsCode: vi.fn(),
}))

function renderLogin(initialEntries?: Array<string | { pathname: string; state?: unknown }>) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<h1>经营概览</h1>} />
        <Route path="/orders" element={<h1>订单售后</h1>} />
        <Route path="/activate" element={<ActivatePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('admin auth flow', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    clearAdminSession()
    setAdminBootstrapping(false)
    vi.mocked(loginWithAdminPassword).mockReset()
    vi.mocked(activateAdminAccount).mockReset()
    vi.mocked(resetAdminPassword).mockReset()
    vi.mocked(sendAdminSmsCode).mockReset()
    vi.mocked(loginWithAdminPassword).mockImplementation(async () => {
      const session = {
        token: 'admin-session-token',
        account: {
          id: 'admin_1',
          phone: '13800000000',
          role: 'ADMIN',
          roleLabel: '管理员',
        },
      }
      setAdminSession(session)
      return session
    })
    vi.mocked(activateAdminAccount).mockImplementation(async () => {
      const session = {
        token: 'activated-session-token',
        account: {
          id: 'admin_2',
          phone: '13800000000',
          role: 'ADMIN',
          roleLabel: '管理员',
        },
      }
      setAdminSession(session)
      return session
    })
    vi.mocked(resetAdminPassword).mockImplementation(async () => {
      const session = {
        token: 'reset-session-token',
        account: {
          id: 'admin_3',
          phone: '13800000000',
          role: 'ADMIN',
          roleLabel: '管理员',
        },
      }
      setAdminSession(session)
      return session
    })
    vi.mocked(sendAdminSmsCode).mockResolvedValue({
      purpose: 'ACTIVATE',
      purposeLabel: '首次激活',
      maskedPhone: '138****0000',
      expiresInSeconds: 600,
      resendCooldownSeconds: 60,
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

  it('shows a loading state while restoring an existing session', async () => {
    setAdminSession({
      token: 'persisted-session-token',
      account: null,
    })
    setAdminBootstrapping(true)

    render(
      <MemoryRouter initialEntries={['/rooms']}>
        <Routes>
          <Route element={<ProtectedShell />}>
            <Route path="/rooms" element={<h1>房型管理</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 3, name: '登录态恢复中' })).toBeInTheDocument()
  })

  it('navigates to the target business route after a successful login', async () => {
    const user = userEvent.setup()

    renderLogin([{ pathname: '/login', state: { from: '/orders' } }])

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800000000')
    await user.type(screen.getByPlaceholderText('请输入后台密码'), 'Admin12345')
    await user.click(screen.getByRole('button', { name: '登录后台' }))

    expect(vi.mocked(loginWithAdminPassword)).toHaveBeenCalledWith('13800000000', 'Admin12345')
    expect(await screen.findByRole('heading', { level: 1, name: '订单售后' })).toBeInTheDocument()
  })

  it('shows a clear error when login fails', async () => {
    const user = userEvent.setup()

    vi.mocked(loginWithAdminPassword).mockRejectedValueOnce(new Error('手机号或密码错误'))

    renderLogin(['/login'])

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800000000')
    await user.type(screen.getByPlaceholderText('请输入后台密码'), 'Wrong12345')
    await user.click(screen.getByRole('button', { name: '登录后台' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('手机号或密码错误')
    expect(screen.getByRole('heading', { level: 1, name: '管理端登录' })).toBeInTheDocument()
  })

  it('activates account after sending sms code', async () => {
    const user = userEvent.setup()

    renderLogin(['/activate'])

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800000000')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))
    await user.type(screen.getByPlaceholderText('请输入 6 位验证码'), '123456')
    await user.type(screen.getByPlaceholderText('请输入 8-32 位字母数字组合'), 'Admin12345')
    await user.click(screen.getByRole('button', { name: '激活并进入后台' }))

    expect(vi.mocked(sendAdminSmsCode)).toHaveBeenCalledWith('13800000000', 'ACTIVATE')
    expect(vi.mocked(activateAdminAccount)).toHaveBeenCalledWith('13800000000', '123456', 'Admin12345')
    expect(await screen.findByRole('heading', { level: 1, name: '经营概览' })).toBeInTheDocument()
  })

  it('resets password after sending sms code', async () => {
    const user = userEvent.setup()
    vi.mocked(sendAdminSmsCode).mockResolvedValueOnce({
      purpose: 'RESET_PASSWORD',
      purposeLabel: '重置密码',
      maskedPhone: '138****0000',
      expiresInSeconds: 600,
      resendCooldownSeconds: 60,
    })

    renderLogin(['/reset-password'])

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800000000')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))
    await user.type(screen.getByPlaceholderText('请输入 6 位验证码'), '654321')
    await user.type(screen.getByPlaceholderText('请输入 8-32 位字母数字组合'), 'Admin23456')
    await user.click(screen.getByRole('button', { name: '重置密码并进入后台' }))

    expect(vi.mocked(sendAdminSmsCode)).toHaveBeenCalledWith('13800000000', 'RESET_PASSWORD')
    expect(vi.mocked(resetAdminPassword)).toHaveBeenCalledWith('13800000000', '654321', 'Admin23456')
    expect(await screen.findByRole('heading', { level: 1, name: '经营概览' })).toBeInTheDocument()
  })
})
