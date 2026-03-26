import axios from 'axios'
import { httpClient } from '@/services/http'
import {
  clearAdminSession,
  getAdminToken,
  setAdminBootstrapping,
  setAdminSession,
  type AdminAccountProfile,
  updateAdminAccount,
} from '@/features/auth/auth-store'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export interface AdminAuthSessionPayload {
  token: string
  account: AdminAccountProfile
}

export interface AdminSmsCodePayload {
  purpose: string
  purposeLabel: string
  maskedPhone: string
  expiresInSeconds: number
  resendCooldownSeconds: number
}

export type AdminSmsPurpose = 'ACTIVATE' | 'RESET_PASSWORD'

const AUTH_ERROR_FALLBACK = '操作失败，请稍后重试'
let bootstrapPromise: Promise<void> | null = null

export function getAdminAuthErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    return error.response?.data?.message?.trim() || AUTH_ERROR_FALLBACK
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return AUTH_ERROR_FALLBACK
}

function normalizePhone(phone: string) {
  return phone.trim()
}

function normalizePassword(password: string) {
  return password.trim()
}

function consumeAdminSession(payload: AdminAuthSessionPayload) {
  setAdminSession(payload)
  return payload
}

export async function loginWithAdminPassword(phone: string, password: string) {
  const normalizedPhone = normalizePhone(phone)
  const normalizedPassword = normalizePassword(password)

  if (!normalizedPhone) {
    throw new Error('请输入手机号')
  }

  if (!normalizedPassword) {
    throw new Error('请输入密码')
  }

  const response = await httpClient.post<ApiEnvelope<AdminAuthSessionPayload>>('/admin/auth/login', {
    phone: normalizedPhone,
    password: normalizedPassword,
  })

  return consumeAdminSession(response.data.data)
}

export async function sendAdminSmsCode(phone: string, purpose: AdminSmsPurpose) {
  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) {
    throw new Error('请输入手机号')
  }

  const response = await httpClient.post<ApiEnvelope<AdminSmsCodePayload>>('/admin/auth/sms-code', {
    phone: normalizedPhone,
    purpose,
  })

  return response.data.data
}

export async function activateAdminAccount(phone: string, smsCode: string, password: string) {
  const response = await httpClient.post<ApiEnvelope<AdminAuthSessionPayload>>('/admin/auth/activate', {
    phone: normalizePhone(phone),
    smsCode: smsCode.trim(),
    password: normalizePassword(password),
  })

  return consumeAdminSession(response.data.data)
}

export async function resetAdminPassword(phone: string, smsCode: string, newPassword: string) {
  const response = await httpClient.post<ApiEnvelope<AdminAuthSessionPayload>>('/admin/auth/reset-password', {
    phone: normalizePhone(phone),
    smsCode: smsCode.trim(),
    newPassword: normalizePassword(newPassword),
  })

  return consumeAdminSession(response.data.data)
}

export async function fetchCurrentAdminAccount() {
  const response = await httpClient.get<ApiEnvelope<AdminAccountProfile>>('/admin/account/me')
  return response.data.data
}

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  const response = await httpClient.post<ApiEnvelope<AdminAuthSessionPayload>>('/admin/account/change-password', {
    currentPassword: normalizePassword(currentPassword),
    newPassword: normalizePassword(newPassword),
  })

  return consumeAdminSession(response.data.data)
}

export async function logoutAdmin() {
  try {
    if (getAdminToken()) {
      await httpClient.post<ApiEnvelope<null>>('/admin/auth/logout')
    }
  } finally {
    clearAdminSession()
  }
}

export async function bootstrapAdminSession() {
  if (!getAdminToken()) {
    setAdminBootstrapping(false)
    return
  }

  if (bootstrapPromise) {
    return bootstrapPromise
  }

  setAdminBootstrapping(true)

  bootstrapPromise = (async () => {
    try {
      const account = await fetchCurrentAdminAccount()
      updateAdminAccount(account)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearAdminSession()
      } else {
        setAdminBootstrapping(false)
      }
    } finally {
      bootstrapPromise = null
    }
  })()

  return bootstrapPromise
}
