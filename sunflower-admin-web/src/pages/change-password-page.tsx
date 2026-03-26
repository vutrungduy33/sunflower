import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Space, Tag } from 'tdesign-react'
import { changeAdminPassword, getAdminAuthErrorMessage } from '@/features/auth/auth-service'
import { useAdminAuth } from '@/features/auth/auth-store'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { account } = useAdminAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await changeAdminPassword(currentPassword, newPassword)
      setSuccessMessage('密码已更新，旧登录态已自动失效。')
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(getAdminAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <Card className="panel-card">
        <div className="page-header-inline">
          <div>
            <Tag theme="warning" variant="light-outline">
              S17
            </Tag>
            <h3>修改密码</h3>
            <p>当前账号：{account?.phone || '未知账号'}</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <span className="login-form__label">当前密码</span>
          <Input
            type="password"
            clearable
            size="large"
            placeholder="请输入当前密码"
            value={currentPassword}
            onChange={(value) => setCurrentPassword(String(value))}
          />

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
              更新密码
            </Button>
            <Button block size="large" theme="default" variant="outline" onClick={() => void navigate(-1)}>
              返回上一页
            </Button>
          </Space>
        </form>
      </Card>
    </div>
  )
}
