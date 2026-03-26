import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Input, Space, Tag } from 'tdesign-react'
import { appEnv } from '@/config/env'
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
        <Card className="login-panel">
          <div className="login-panel__hero">
            <Tag theme="warning" variant="light-outline">
              S17 管理端真实账号登录
            </Tag>
            <h1>管理端登录</h1>
            <p>
              使用手机号 + 密码登录，前端会自动恢复后台会话、注入
              `Authorization: Bearer &lt;token&gt;`，并在登录态失效后自动清理本地会话。
            </p>
            <div className="login-panel__meta">
              <span>应用标题：{appEnv.appTitle}</span>
              <span>API 地址：{appEnv.apiBaseUrl}</span>
            </div>
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
              <p className="login-form__hint">
                当前账号体系支持首次激活、短信重置密码、会话恢复与最小角色 `admin/operator`。
              </p>
              <div className="auth-form__links">
                <Link to="/activate">首次激活</Link>
                <Link to="/reset-password">忘记密码</Link>
              </div>
            </Space>
          </form>
        </Card>

        <Card className="login-side-panel" title="本阶段已交付能力">
          <ul className="bullet-list">
            <li>手机号 + 密码登录与失败提示。</li>
            <li>首次激活与短信重置密码。</li>
            <li>会话恢复、401 失效清理与退出登录。</li>
            <li>`admin/operator` 最小角色收口。</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
