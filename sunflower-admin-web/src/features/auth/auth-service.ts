import axios from 'axios'
import { httpClient } from '@/services/http'
import { setAdminToken } from '@/features/auth/auth-store'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

const LOGIN_ERROR_FALLBACK = '登录失败，请稍后重试'

export function getAdminLoginErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    return error.response?.data?.message?.trim() || LOGIN_ERROR_FALLBACK
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return LOGIN_ERROR_FALLBACK
}

export async function loginWithAdminToken(token: string) {
  const normalizedToken = token.trim()

  if (!normalizedToken) {
    throw new Error('请输入管理端 token')
  }

  await httpClient.get<ApiEnvelope<unknown>>('/admin/reports/summary', {
    headers: {
      Authorization: `Bearer ${normalizedToken}`,
    },
  })

  setAdminToken(normalizedToken)
}
