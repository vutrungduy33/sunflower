import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Input, Space, Tag } from '@/app/admin-components'
import {
  getAdminAuthErrorMessage,
  loginWithAdminPassword,
} from '@/features/auth/auth-service'
import { useAdminAuth } from '@/features/auth/auth-store'

interface LoginRouteState {
  from?: string
}

function resolveRedirectTarget(state: LoginRouteState | null | undefined) {
  if (!state?.from || state.from === '/login') {
    return '/'
  }

  return state.from
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isBootstrapping } = useAdminAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = resolveRedirectTarget(location.state as LoginRouteState | null | undefined)

  if (isBootstrapping) {
    return (
      <div className="login-shell">
        <Card className="login-panel">
          <p className="login-form__hint">正在恢复后台登录态...</p>
        </Card>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate replace to={redirectTo} />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await loginWithAdminPassword(phone, password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(getAdminAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-grid">
        <section className="login-intro">
          <div className="brand-mark">SF</div>
          <h1>Sunflower 运营后台</h1>
          <p>用于单店民宿的房型、房态、价格、订单和售后处理。账号登录后即可进入日常运营工作台。</p>
          <div className="login-intro__facts">
            <span>手机号密码登录</span>
            <span>短信激活与重置</span>
            <span>受保护运营页面</span>
          </div>
        </section>

        <Card className="login-panel">
          <div className="login-panel__hero">
            <Tag theme="primary" variant="light-outline">
              后台账号
            </Tag>
            <h1>登录管理后台</h1>
            <p>使用已激活的手机号和后台密码登录。登录态失效后会自动回到本页。</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <span className="login-form__label">手机号</span>
            <Input
              clearable
              size="large"
              placeholder="请输入手机号"
              value={phone}
              onChange={(value) => setPhone(String(value))}
            />

            <span className="login-form__label">密码</span>
            <Input
              type="password"
              clearable
              size="large"
              placeholder="请输入后台密码"
              value={password}
              onChange={(value) => setPassword(String(value))}
            />

            {errorMessage ? (
              <p className="form-error" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Button
                block
                size="large"
                theme="primary"
                type="submit"
                loading={isSubmitting}
              >
                登录后台
              </Button>
              <div className="auth-form__links">
                <Link to="/activate">首次激活</Link>
                <Link to="/reset-password">忘记密码</Link>
              </div>
            </Space>
          </form>
        </Card>
      </div>
    </div>
  )
}
