import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, Card, Input, Space, Tag } from 'tdesign-react'
import { getAdminAuthErrorMessage, resetAdminPassword, sendAdminSmsCode } from '@/features/auth/auth-service'
import { useAdminAuth } from '@/features/auth/auth-store'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isBootstrapping } = useAdminAuth()
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((currentValue) => Math.max(0, currentValue - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [cooldownSeconds])

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
    return <Navigate replace to="/" />
  }

  const handleSendCode = async () => {
    setIsSendingCode(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await sendAdminSmsCode(phone, 'RESET_PASSWORD')
      setCooldownSeconds(response.resendCooldownSeconds)
      setSuccessMessage(`验证码已发送至 ${response.maskedPhone}`)
    } catch (error) {
      setErrorMessage(getAdminAuthErrorMessage(error))
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await resetAdminPassword(phone, smsCode, newPassword)
      navigate('/', { replace: true })
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
            <h1>重置后台密码</h1>
            <p>通过短信验证码校验身份后，可以立即重置密码并恢复后台访问。</p>
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

            <span className="login-form__label">验证码</span>
            <div className="auth-inline-row">
              <Input
                clearable
                size="large"
                placeholder="请输入 6 位验证码"
                value={smsCode}
                onChange={(value) => setSmsCode(String(value))}
              />
              <Button
                theme="default"
                variant="outline"
                disabled={cooldownSeconds > 0}
                loading={isSendingCode}
                onClick={handleSendCode}
              >
                {cooldownSeconds > 0 ? `${cooldownSeconds}s 后重试` : '发送验证码'}
              </Button>
            </div>

            <span className="login-form__label">新密码</span>
            <Input
              type="password"
              clearable
              size="large"
              placeholder="请输入 8-32 位字母数字组合"
              value={newPassword}
              onChange={(value) => setNewPassword(String(value))}
            />

            {errorMessage ? (
              <p className="form-error" role="alert">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="form-success" role="status">
                {successMessage}
              </p>
            ) : null}

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Button block size="large" theme="primary" type="submit" loading={isSubmitting}>
                重置密码并进入后台
              </Button>
              <div className="auth-form__links">
                <Link to="/login">返回登录</Link>
                <Link to="/activate">首次激活</Link>
              </div>
            </Space>
          </form>
        </Card>

        <Card className="login-side-panel" title="重置说明">
          <ul className="bullet-list">
            <li>仅已激活的后台账号支持短信重置密码。</li>
            <li>重置成功后旧登录态立即失效。</li>
            <li>密码需为 8-32 位，并同时包含字母和数字。</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
