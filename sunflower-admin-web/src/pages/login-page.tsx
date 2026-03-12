import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Input, Space, Tag } from 'tdesign-react'
import { appEnv } from '@/config/env'
import {
  getAdminLoginErrorMessage,
  loginWithAdminToken,
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
  const { isAuthenticated } = useAdminAuth()
  const [token, setToken] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = resolveRedirectTarget(location.state as LoginRouteState | null | undefined)

  if (isAuthenticated) {
    return <Navigate replace to={redirectTo} />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await loginWithAdminToken(token)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(getAdminLoginErrorMessage(error))
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
              S10 管理后台登录与权限骨架
            </Tag>
            <h1>管理端登录</h1>
            <p>
              使用后端 `app.admin.auth.token` 对应的管理 token 登录，前端会自动注入
              `Authorization: Bearer &lt;token&gt;` 并为业务路由做未登录拦截。
            </p>
            <div className="login-panel__meta">
              <span>应用标题：{appEnv.appTitle}</span>
              <span>API 地址：{appEnv.apiBaseUrl}</span>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <span className="login-form__label">管理 token</span>
            <Input
              type="password"
              clearable
              size="large"
              placeholder="请输入管理端 token"
              value={token}
              onChange={(value) => setToken(String(value))}
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
                当前阶段只构建最小登录态与页面守卫，不引入后台用户表与 RBAC。
              </p>
            </Space>
          </form>
        </Card>

        <Card className="login-side-panel" title="本阶段已交付能力">
          <ul className="bullet-list">
            <li>登录页与失败提示。</li>
            <li>受保护路由与未登录跳转。</li>
            <li>侧边菜单、顶栏和退出登录。</li>
            <li>请求头自动注入管理 token。</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
