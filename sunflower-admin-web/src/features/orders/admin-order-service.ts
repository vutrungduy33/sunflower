import axios from 'axios'
import { httpClient } from '@/services/http'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

const ADMIN_ORDER_ENDPOINT = '/admin/orders'
const ADMIN_ORDER_OVERVIEW_ENDPOINT = '/admin/reports/summary'
const ADMIN_ORDER_ERROR_FALLBACK = '订单操作失败，请稍后重试'

export type AdminOrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'RESCHEDULED'
  | 'REFUNDED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type AdminOrderStatusFilter = 'ALL' | AdminOrderStatus
export type AdminOrderBookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW'
export type AdminOrderPaymentStatus =
  | 'UNPAID'
  | 'PAID'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
export type AdminOrderAfterSaleType = '' | 'RESCHEDULE' | 'REFUND'
export type AdminOrderAfterSaleStatus = '' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'

export interface AdminOrder {
  id: string
  orderNo: string
  userId: string
  source: string
  roomId: string
  roomName: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guestName: string
  guestPhone: string
  arrivalTime: string
  remark: string
  totalAmount: number
  status: AdminOrderStatus
  statusLabel: string
  bookingStatus: AdminOrderBookingStatus
  bookingStatusLabel: string
  paymentStatus: AdminOrderPaymentStatus
  paymentStatusLabel: string
  latestAfterSaleRequestId: number | null
  latestAfterSaleType: AdminOrderAfterSaleType
  latestAfterSaleStatus: AdminOrderAfterSaleStatus
  latestAfterSaleStatusLabel: string
  latestAfterSaleRejectReason: string
  rescheduleCount: number
  createdAt: string
  paidAt: string
  cancelledAt: string
  checkedInAt: string
  checkedOutAt: string
  noShowAt: string
  rescheduledAt: string
  refundedAt: string
  afterSaleReason: string
}

export interface AdminOrderOverview {
  orderCount: number
  pendingCheckInCount: number
  refundedOrderCount: number
  revenueAmount: number
}

export interface FetchAdminOrdersParams {
  status?: AdminOrderStatus
  keyword?: string
  checkInStartDate?: string
  checkInEndDate?: string
}

export interface RescheduleAdminOrderPayload {
  checkInDate: string
  checkOutDate: string
  reason?: string
}

export interface RefundAdminOrderPayload {
  reason?: string
}

export interface RejectAdminAfterSalePayload {
  rejectReason?: string
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim() ?? ''
  return normalized || undefined
}

function buildOrderQueryParams(params: FetchAdminOrdersParams) {
  return {
    status: params.status,
    keyword: normalizeOptionalText(params.keyword),
    checkInStartDate: normalizeOptionalText(params.checkInStartDate),
    checkInEndDate: normalizeOptionalText(params.checkInEndDate),
  }
}

export async function fetchAdminOrderOverview() {
  const response = await httpClient.get<ApiEnvelope<AdminOrderOverview>>(ADMIN_ORDER_OVERVIEW_ENDPOINT)
  return response.data.data
}

export async function fetchAdminOrders(params: FetchAdminOrdersParams = {}) {
  const response = await httpClient.get<ApiEnvelope<AdminOrder[]>>(ADMIN_ORDER_ENDPOINT, {
    params: buildOrderQueryParams(params),
  })

  return response.data.data
}

export async function fetchAdminOrderDetail(orderId: string) {
  const response = await httpClient.get<ApiEnvelope<AdminOrder>>(`${ADMIN_ORDER_ENDPOINT}/${orderId}`)
  return response.data.data
}

export async function rescheduleAdminOrder(orderId: string, payload: RescheduleAdminOrderPayload) {
  const response = await httpClient.post<ApiEnvelope<AdminOrder>>(
    `${ADMIN_ORDER_ENDPOINT}/${orderId}/reschedule`,
    {
      checkInDate: payload.checkInDate,
      checkOutDate: payload.checkOutDate,
      reason: normalizeOptionalText(payload.reason),
    },
  )

  return response.data.data
}

export async function refundAdminOrder(orderId: string, payload: RefundAdminOrderPayload) {
  const response = await httpClient.post<ApiEnvelope<AdminOrder>>(`${ADMIN_ORDER_ENDPOINT}/${orderId}/refund`, {
    reason: normalizeOptionalText(payload.reason),
  })

  return response.data.data
}

export async function approveAdminAfterSaleRequest(orderId: string, requestId: number) {
  const response = await httpClient.post<ApiEnvelope<AdminOrder>>(
    `${ADMIN_ORDER_ENDPOINT}/${orderId}/after-sale/${requestId}/approve`,
  )

  return response.data.data
}

export async function rejectAdminAfterSaleRequest(
  orderId: string,
  requestId: number,
  payload: RejectAdminAfterSalePayload,
) {
  const response = await httpClient.post<ApiEnvelope<AdminOrder>>(
    `${ADMIN_ORDER_ENDPOINT}/${orderId}/after-sale/${requestId}/reject`,
    {
      rejectReason: normalizeOptionalText(payload.rejectReason),
    },
  )

  return response.data.data
}

export async function checkInAdminOrder(orderId: string) {
  const response = await httpClient.post<ApiEnvelope<AdminOrder>>(
    `${ADMIN_ORDER_ENDPOINT}/${orderId}/check-in`,
  )

  return response.data.data
}

export async function checkOutAdminOrder(orderId: string) {
  const response = await httpClient.post<ApiEnvelope<AdminOrder>>(
    `${ADMIN_ORDER_ENDPOINT}/${orderId}/check-out`,
  )

  return response.data.data
}

export async function noShowAdminOrder(orderId: string) {
  const response = await httpClient.post<ApiEnvelope<AdminOrder>>(
    `${ADMIN_ORDER_ENDPOINT}/${orderId}/no-show`,
  )

  return response.data.data
}

export function getAdminOrderErrorMessage(error: unknown, fallback = ADMIN_ORDER_ERROR_FALLBACK) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    return error.response?.data?.message?.trim() || fallback
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return fallback
}
