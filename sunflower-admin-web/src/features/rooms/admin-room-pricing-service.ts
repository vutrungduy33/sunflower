import axios from 'axios'
import { httpClient } from '@/services/http'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

const ROOM_CALENDAR_ERROR_FALLBACK = '价格日历加载失败，请稍后重试'
const ROOM_PRICING_ERROR_FALLBACK = '价格库存操作失败，请稍后重试'

export type AdminRoomPriceSource = 'MANUAL' | 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY'

export interface RoomCalendarItem {
  date: string
  weekdayLabel: string
  price: number
  stock: number
}

export interface RoomCalendarResponse {
  roomId: string
  calendar: RoomCalendarItem[]
}

export interface FetchRoomCalendarParams {
  startDate: string
  days: number
}

export interface UpdateAdminRoomPricePayload {
  roomId: string
  items: Array<{
    date: string
    price: number
    source: AdminRoomPriceSource
  }>
}

export interface AdminRoomPriceBatchResponse {
  roomId: string
  updatedCount: number
  items: Array<{
    date: string
    price: number
    source: string
  }>
}

export interface UpdateAdminRoomInventoryPayload {
  roomId: string
  items: Array<{
    date: string
    totalStock: number
  }>
}

export interface AdminRoomInventoryBatchResponse {
  roomId: string
  updatedCount: number
  items: Array<{
    date: string
    totalStock: number
    availableStock: number
    lockedStock: number
  }>
}

export async function fetchRoomCalendar(roomId: string, params: FetchRoomCalendarParams) {
  const response = await httpClient.get<ApiEnvelope<RoomCalendarResponse>>(`/rooms/${roomId}/calendar`, {
    params,
  })

  return response.data.data.calendar
}

export async function updateAdminRoomPrices(payload: UpdateAdminRoomPricePayload) {
  const response = await httpClient.post<ApiEnvelope<AdminRoomPriceBatchResponse>>('/admin/room-prices', payload)
  return response.data.data
}

export async function updateAdminRoomInventory(payload: UpdateAdminRoomInventoryPayload) {
  const response = await httpClient.post<ApiEnvelope<AdminRoomInventoryBatchResponse>>(
    '/admin/room-inventory',
    payload,
  )
  return response.data.data
}

export function getRoomCalendarErrorMessage(error: unknown, fallback = ROOM_CALENDAR_ERROR_FALLBACK) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    return error.response?.data?.message?.trim() || fallback
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return fallback
}

export function getAdminRoomPricingErrorMessage(
  error: unknown,
  fallback = ROOM_PRICING_ERROR_FALLBACK,
) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    return error.response?.data?.message?.trim() || fallback
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return fallback
}
