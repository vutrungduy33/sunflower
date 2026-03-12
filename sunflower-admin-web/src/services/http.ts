import axios, { AxiosHeaders } from 'axios'
import { appEnv } from '@/config/env'
import { clearAdminToken, getAdminToken } from '@/features/auth/auth-store'

export const httpClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  timeout: 10000,
})

httpClient.interceptors.request.use((config) => {
  const token = getAdminToken()

  if (!token) {
    return config
  }

  const headers = AxiosHeaders.from(config.headers)

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return {
    ...config,
    headers,
  }
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearAdminToken()
    }

    return Promise.reject(error)
  },
)
