import axios from 'axios'
import { httpClient } from '@/services/http'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

const ROOM_ENDPOINT = '/admin/rooms'
const ROOM_ERROR_FALLBACK = '房型操作失败，请稍后重试'

export type AdminRoomStatus = 'ACTIVE' | 'INACTIVE'
export type AdminRoomStatusFilter = 'ALL' | AdminRoomStatus

export interface AdminRoom {
  id: string
  name: string
  subtitle: string
  cover: string
  capacity: number
  area: number
  bedType: string
  scenicType: string
  tags: string[]
  basePrice: number
  breakfast: string
  intro: string
  amenities: string[]
  rules: string[]
  canCancelBeforeHours: number
  status: AdminRoomStatus
}

export interface SaveAdminRoomPayload {
  name: string
  subtitle: string
  cover: string
  capacity: number
  area: number
  bedType: string
  scenicType: string
  tags: string[]
  basePrice: number
  breakfast: string
  intro: string
  amenities: string[]
  rules: string[]
  canCancelBeforeHours: number
  status: AdminRoomStatus
}

export async function fetchAdminRooms() {
  const response = await httpClient.get<ApiEnvelope<AdminRoom[]>>(ROOM_ENDPOINT)
  return response.data.data
}

export async function createAdminRoom(payload: SaveAdminRoomPayload) {
  const response = await httpClient.post<ApiEnvelope<AdminRoom>>(ROOM_ENDPOINT, payload)
  return response.data.data
}

export async function updateAdminRoom(roomId: string, payload: Partial<SaveAdminRoomPayload>) {
  const response = await httpClient.patch<ApiEnvelope<AdminRoom>>(`${ROOM_ENDPOINT}/${roomId}`, payload)
  return response.data.data
}

export function getAdminRoomErrorMessage(error: unknown, fallback = ROOM_ERROR_FALLBACK) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    return error.response?.data?.message?.trim() || fallback
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return fallback
}
