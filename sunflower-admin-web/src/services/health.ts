import { httpClient } from '@/services/http'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export interface HealthSnapshot {
  status: string
  service?: string
  timestamp?: string
}

export async function fetchHealth() {
  const response = await httpClient.get<ApiEnvelope<HealthSnapshot>>('/health')

  if (!response.data?.data) {
    throw new Error('Missing health payload')
  }

  return response.data.data
}
