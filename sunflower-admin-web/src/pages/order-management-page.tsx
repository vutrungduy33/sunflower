import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Input,
  MessagePlugin,
  Select,
  Space,
  Table,
  Tag,
  Textarea,
  type TableProps,
} from '@/app/admin-components'
import {
  approveAdminAfterSaleRequest,
  checkInAdminOrder,
  checkOutAdminOrder,
  fetchAdminOrderDetail,
  fetchAdminOrderOverview,
  fetchAdminOrders,
  getAdminOrderErrorMessage,
  noShowAdminOrder,
  rejectAdminAfterSaleRequest,
  refundAdminOrder,
  rescheduleAdminOrder,
  retryAdminRefund,
  type AdminOrder,
  type AdminOrderOverview,
  type AdminOrderAfterSaleStatus,
  type AdminOrderStatus,
  type AdminOrderStatusFilter,
} from '@/features/orders/admin-order-service'

const ORDER_LIST_QUERY_KEY = ['admin-orders']
const ORDER_OVERVIEW_QUERY_KEY = ['admin-order-overview']
const DATE_FILTER_PATTERN = /^\d{4}-\d{2}-\d{2}$/

type DrawerMode = 'detail' | 'reschedule' | 'refund'
type RescheduleEditorField = 'checkInDate' | 'checkOutDate' | 'reason'
type RefundEditorField = 'reason'
type RejectEditorField = 'rejectReason'

type RescheduleEditorErrors = Partial<Record<RescheduleEditorField, string>>
type RefundEditorErrors = Partial<Record<RefundEditorField, string>>
type RejectEditorErrors = Partial<Record<RejectEditorField, string>>

interface RescheduleEditorValue {
  checkInDate: string
  checkOutDate: string
  reason: string
}

interface RefundEditorValue {
  reason: string
}

interface RejectEditorValue {
  rejectReason: string
}

const orderStatusOptions: Array<{ label: string; value: AdminOrderStatusFilter }> = [
  { label: '全部状态', value: 'ALL' },
  { label: '待支付', value: 'PENDING_PAYMENT' },
  { label: '待入住', value: 'CONFIRMED' },
  { label: '已入住', value: 'CHECKED_IN' },
  { label: '已改期', value: 'RESCHEDULED' },
  { label: '退款中', value: 'REFUND_PENDING' },
  { label: '已退款', value: 'REFUNDED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
  { label: '已失约', value: 'NO_SHOW' },
]

const orderStatusThemeMap: Record<AdminOrderStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  PENDING_PAYMENT: 'warning',
  CONFIRMED: 'primary',
  CHECKED_IN: 'success',
  RESCHEDULED: 'success',
  REFUND_PENDING: 'warning',
  REFUNDED: 'danger',
  COMPLETED: 'success',
  CANCELLED: 'default',
  NO_SHOW: 'danger',
}

const orderSourceLabelMap: Record<string, string> = {
  direct: '直订',
  offline: '线下',
  ota: 'OTA',
}

function createOrderStatCards(overview?: AdminOrderOverview) {
  return [
    {
      title: '订单总数',
      value: overview?.orderCount ?? '--',
      hint: '全部后台可处理订单',
    },
    {
      title: '待入住',
      value: overview?.pendingCheckInCount ?? '--',
      hint: 'bookingStatus = CONFIRMED',
    },
    {
      title: '已退款',
      value: overview?.refundedOrderCount ?? '--',
      hint: '售后已完成退款单',
    },
    {
      title: '成交额',
      value: overview ? formatCurrency(overview.revenueAmount) : '--',
      hint: 'paymentStatus = PAID / PARTIALLY_REFUNDED',
    },
  ]
}

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString('zh-CN')}`
}

function formatDateTime(value: string) {
  if (!value) {
    return '未发生'
  }

  return value.slice(0, 16).replace('T', ' ')
}

function resolveSourceLabel(source: string) {
  const normalized = source.trim().toLowerCase()
  return (orderSourceLabelMap[normalized] ?? source) || '未知来源'
}

function hasPendingAfterSale(order: AdminOrder) {
  return order.latestAfterSaleStatus === 'REQUESTED' && order.latestAfterSaleRequestId != null
}

function hasRejectedAfterSale(order: AdminOrder) {
  return order.latestAfterSaleStatus === 'REJECTED'
}

function canDirectReschedule(order: AdminOrder) {
  return order.bookingStatus === 'CONFIRMED' && order.paymentStatus === 'PAID' && !hasPendingAfterSale(order)
}

function canDirectRefund(order: AdminOrder) {
  return order.bookingStatus === 'CONFIRMED' && order.paymentStatus === 'PAID' && !hasPendingAfterSale(order)
}

function canRetryRefund(order: AdminOrder) {
  return (
    order.latestRefundRecordId != null &&
    ['FAILED', 'ABNORMAL', 'CLOSED'].includes(order.latestRefundStatus) &&
    order.paymentStatus === 'PAID'
  )
}

function canCheckIn(order: AdminOrder) {
  return order.bookingStatus === 'CONFIRMED' && order.paymentStatus === 'PAID' && !hasPendingAfterSale(order)
}

function canCheckOut(order: AdminOrder) {
  return order.bookingStatus === 'CHECKED_IN'
}

function canMarkNoShow(order: AdminOrder) {
  return order.bookingStatus === 'CONFIRMED' && !hasPendingAfterSale(order)
}

function resolveAfterSaleSummary(order: AdminOrder) {
  if (!order.latestAfterSaleType || !order.latestAfterSaleStatus) {
    return order.afterSaleReason || '当前还没有售后记录'
  }

  const base = `${order.latestAfterSaleType === 'RESCHEDULE' ? '改期' : '退款'}${order.latestAfterSaleStatusLabel}`
  if (order.latestAfterSaleStatus === 'REJECTED' && order.latestAfterSaleRejectReason) {
    return `${base}：${order.latestAfterSaleRejectReason}`
  }
  return order.afterSaleReason ? `${base}：${order.afterSaleReason}` : base
}

function createRescheduleEditorValue(order?: AdminOrder): RescheduleEditorValue {
  return {
    checkInDate: order?.checkInDate ?? '',
    checkOutDate: order?.checkOutDate ?? '',
    reason: '',
  }
}

function createRefundEditorValue(): RefundEditorValue {
  return {
    reason: '',
  }
}

function createRejectEditorValue(): RejectEditorValue {
  return {
    rejectReason: '',
  }
}

function parseDateToUtc(value: string) {
  const parts = value.split('-').map(Number)
  if (parts.length !== 3 || parts.some((item) => !Number.isInteger(item))) {
    return Number.NaN
  }

  return Date.UTC(parts[0], parts[1] - 1, parts[2])
}

function calculateNights(checkInDate: string, checkOutDate: string) {
  const checkInTime = parseDateToUtc(checkInDate)
  const checkOutTime = parseDateToUtc(checkOutDate)

  if (!Number.isFinite(checkInTime) || !Number.isFinite(checkOutTime)) {
    return Number.NaN
  }

  return Math.round((checkOutTime - checkInTime) / 86400000)
}

function isCompleteDateFilter(value: string) {
  return !value || DATE_FILTER_PATTERN.test(value)
}

function resolveDateRangeError(checkInStartDate: string, checkInEndDate: string) {
  if (!isCompleteDateFilter(checkInStartDate) || !isCompleteDateFilter(checkInEndDate)) {
    return '请输入完整的入住日期，格式为 YYYY-MM-DD'
  }

  if (checkInStartDate && checkInEndDate && checkInStartDate > checkInEndDate) {
    return '入住开始日期不能晚于结束日期'
  }

  return ''
}

function validateRescheduleEditorValue(value: RescheduleEditorValue, order?: AdminOrder) {
  const errors: RescheduleEditorErrors = {}

  if (!value.checkInDate) {
    errors.checkInDate = '请选择新的入住日期'
  }
  if (!value.checkOutDate) {
    errors.checkOutDate = '请选择新的退房日期'
  }
  if (!value.reason.trim()) {
    errors.reason = '请填写改期原因'
  }

  if (value.checkInDate && value.checkOutDate) {
    const nights = calculateNights(value.checkInDate, value.checkOutDate)
    if (!Number.isFinite(nights) || nights <= 0) {
      errors.checkOutDate = '退房日期需晚于入住日期'
    } else if (order && nights !== order.nights) {
      errors.checkOutDate = `需保持 ${order.nights} 晚入住时长`
    } else if (
      order &&
      value.checkInDate === order.checkInDate &&
      value.checkOutDate === order.checkOutDate
    ) {
      errors.checkOutDate = '改期日期不能与原订单一致'
    }
  }

  return errors
}

function validateRefundEditorValue(value: RefundEditorValue) {
  const errors: RefundEditorErrors = {}

  if (!value.reason.trim()) {
    errors.reason = '请填写退款原因'
  }

  return errors
}

function validateRejectEditorValue(value: RejectEditorValue) {
  const errors: RejectEditorErrors = {}

  if (!value.rejectReason.trim()) {
    errors.rejectReason = '请填写拒绝原因'
  }

  return errors
}

function buildOrderTimeline(order: AdminOrder) {
  return [
    { label: '创建时间', value: formatDateTime(order.createdAt) },
    { label: '支付时间', value: formatDateTime(order.paidAt) },
    { label: '入住时间', value: formatDateTime(order.checkedInAt) },
    { label: '离店时间', value: formatDateTime(order.checkedOutAt) },
    { label: '改期时间', value: formatDateTime(order.rescheduledAt) },
    { label: '退款时间', value: formatDateTime(order.refundedAt) },
    { label: '失约时间', value: formatDateTime(order.noShowAt) },
    { label: '取消时间', value: formatDateTime(order.cancelledAt) },
  ]
}

export function OrderManagementPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatusFilter>('ALL')
  const [checkInStartDate, setCheckInStartDate] = useState('')
  const [checkInEndDate, setCheckInEndDate] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('detail')
  const [rescheduleEditor, setRescheduleEditor] = useState<RescheduleEditorValue>(() => createRescheduleEditorValue())
  const [refundEditor, setRefundEditor] = useState<RefundEditorValue>(() => createRefundEditorValue())
  const [rejectEditor, setRejectEditor] = useState<RejectEditorValue>(() => createRejectEditorValue())
  const [rescheduleErrors, setRescheduleErrors] = useState<RescheduleEditorErrors>({})
  const [refundErrors, setRefundErrors] = useState<RefundEditorErrors>({})
  const [rejectErrors, setRejectErrors] = useState<RejectEditorErrors>({})
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const deferredKeyword = useDeferredValue(keyword.trim())
  const dateRangeError = resolveDateRangeError(checkInStartDate, checkInEndDate)

  const orderOverviewQuery = useQuery({
    queryKey: ORDER_OVERVIEW_QUERY_KEY,
    queryFn: fetchAdminOrderOverview,
  })

  const orderListQuery = useQuery({
    queryKey: [
      ...ORDER_LIST_QUERY_KEY,
      {
        status: statusFilter,
        keyword: deferredKeyword,
        checkInStartDate,
        checkInEndDate,
      },
    ],
    queryFn: () =>
      fetchAdminOrders({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        keyword: deferredKeyword,
        checkInStartDate,
        checkInEndDate,
      }),
    enabled: !dateRangeError,
  })

  const selectedOrderFromList =
    selectedOrderId ? orderListQuery.data?.find((order) => order.id === selectedOrderId) ?? null : null

  const orderDetailQuery = useQuery({
    queryKey: ['admin-order-detail', selectedOrderId],
    queryFn: () => fetchAdminOrderDetail(selectedOrderId as string),
    enabled: Boolean(selectedOrderId),
  })

  const selectedOrder = orderDetailQuery.data ?? selectedOrderFromList
  const isDrawerVisible = Boolean(selectedOrderId)
  const overviewCards = createOrderStatCards(orderOverviewQuery.data)

  async function handleOrderMutationSuccess(order: AdminOrder, successMessage: string) {
    setActionFeedback(null)
    setRescheduleErrors({})
    setRefundErrors({})
    setRejectErrors({})
    setDrawerMode('detail')
    setRescheduleEditor(createRescheduleEditorValue(order))
    setRefundEditor(createRefundEditorValue())
    setRejectEditor(createRejectEditorValue())
    queryClient.setQueryData(['admin-order-detail', order.id], order)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ORDER_LIST_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ORDER_OVERVIEW_QUERY_KEY }),
    ])
    MessagePlugin.success(successMessage)
  }

  const rescheduleMutation = useMutation({
    mutationFn: async ({
      orderId,
      payload,
    }: {
      orderId: string
      payload: RescheduleEditorValue
    }) =>
      rescheduleAdminOrder(orderId, {
        checkInDate: payload.checkInDate,
        checkOutDate: payload.checkOutDate,
        reason: payload.reason,
      }),
    onSuccess: async (order) => handleOrderMutationSuccess(order, '订单已改期'),
    onError: (error) => {
      const message = getAdminOrderErrorMessage(error, '订单改期失败，请稍后重试')
      setActionFeedback(message)
      MessagePlugin.error(message)
    },
  })

  const refundMutation = useMutation({
    mutationFn: async ({
      orderId,
      payload,
    }: {
      orderId: string
      payload: RefundEditorValue
    }) =>
      refundAdminOrder(orderId, {
        reason: payload.reason,
      }),
    onSuccess: async (order) => handleOrderMutationSuccess(order, '订单已退款'),
    onError: (error) => {
      const message = getAdminOrderErrorMessage(error, '订单退款失败，请稍后重试')
      setActionFeedback(message)
      MessagePlugin.error(message)
    },
  })

  const retryRefundMutation = useMutation({
    mutationFn: async ({ orderId, refundId }: { orderId: string; refundId: number }) =>
      retryAdminRefund(orderId, refundId),
    onSuccess: async (order) => handleOrderMutationSuccess(order, '退款已重新发起'),
    onError: (error) => {
      const message = getAdminOrderErrorMessage(error, '退款重试失败，请稍后重试')
      setActionFeedback(message)
      MessagePlugin.error(message)
    },
  })

  const approveAfterSaleMutation = useMutation({
    mutationFn: async ({ orderId, requestId }: { orderId: string; requestId: number }) =>
      approveAdminAfterSaleRequest(orderId, requestId),
    onSuccess: async (order) => handleOrderMutationSuccess(order, '售后申请已同意'),
    onError: (error) => {
      const message = getAdminOrderErrorMessage(error, '售后审批失败，请稍后重试')
      setActionFeedback(message)
      MessagePlugin.error(message)
    },
  })

  const rejectAfterSaleMutation = useMutation({
    mutationFn: async ({
      orderId,
      requestId,
      payload,
    }: {
      orderId: string
      requestId: number
      payload: RejectEditorValue
    }) =>
      rejectAdminAfterSaleRequest(orderId, requestId, {
        rejectReason: payload.rejectReason,
      }),
    onSuccess: async (order) => handleOrderMutationSuccess(order, '售后申请已拒绝'),
    onError: (error) => {
      const message = getAdminOrderErrorMessage(error, '拒绝售后失败，请稍后重试')
      setActionFeedback(message)
      MessagePlugin.error(message)
    },
  })

  const checkInMutation = useMutation({
    mutationFn: async (orderId: string) => checkInAdminOrder(orderId),
    onSuccess: async (order) => handleOrderMutationSuccess(order, '已办理入住'),
    onError: (error) => {
      const message = getAdminOrderErrorMessage(error, '办理入住失败，请稍后重试')
      setActionFeedback(message)
      MessagePlugin.error(message)
    },
  })

  const checkOutMutation = useMutation({
    mutationFn: async (orderId: string) => checkOutAdminOrder(orderId),
    onSuccess: async (order) => handleOrderMutationSuccess(order, '已办理离店'),
    onError: (error) => {
      const message = getAdminOrderErrorMessage(error, '办理离店失败，请稍后重试')
      setActionFeedback(message)
      MessagePlugin.error(message)
    },
  })

  const noShowMutation = useMutation({
    mutationFn: async (orderId: string) => noShowAdminOrder(orderId),
    onSuccess: async (order) => handleOrderMutationSuccess(order, '订单已标记失约'),
    onError: (error) => {
      const message = getAdminOrderErrorMessage(error, '标记失约失败，请稍后重试')
      setActionFeedback(message)
      MessagePlugin.error(message)
    },
  })

  function resetActionState() {
    setRescheduleErrors({})
    setRefundErrors({})
    setRejectErrors({})
    setActionFeedback(null)
  }

  function handleOpenDrawer(order: AdminOrder, mode: DrawerMode = 'detail') {
    setSelectedOrderId(order.id)
    setDrawerMode(mode)
    setRescheduleEditor(createRescheduleEditorValue(order))
    setRefundEditor(createRefundEditorValue())
    setRejectEditor(createRejectEditorValue())
    resetActionState()
  }

  function handleCloseDrawer() {
    if (
      rescheduleMutation.isPending ||
      refundMutation.isPending ||
      retryRefundMutation.isPending ||
      approveAfterSaleMutation.isPending ||
      rejectAfterSaleMutation.isPending ||
      checkInMutation.isPending ||
      checkOutMutation.isPending ||
      noShowMutation.isPending
    ) {
      return
    }

    setSelectedOrderId(null)
    setDrawerMode('detail')
    setRescheduleEditor(createRescheduleEditorValue())
    setRefundEditor(createRefundEditorValue())
    setRejectEditor(createRejectEditorValue())
    resetActionState()
  }

  function updateRescheduleField<K extends RescheduleEditorField>(
    field: K,
    value: RescheduleEditorValue[K],
  ) {
    setRescheduleEditor((current) => ({
      ...current,
      [field]: value,
    }))
    setRescheduleErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: undefined,
      }
    })
  }

  function updateRefundField<K extends RefundEditorField>(field: K, value: RefundEditorValue[K]) {
    setRefundEditor((current) => ({
      ...current,
      [field]: value,
    }))
    setRefundErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: undefined,
      }
    })
  }

  function updateRejectField<K extends RejectEditorField>(field: K, value: RejectEditorValue[K]) {
    setRejectEditor((current) => ({
      ...current,
      [field]: value,
    }))
    setRejectErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: undefined,
      }
    })
  }

  function handleRefresh() {
    void orderOverviewQuery.refetch()
    if (!dateRangeError) {
      void orderListQuery.refetch()
    }
    if (selectedOrderId) {
      void orderDetailQuery.refetch()
    }
  }

  function handleClearFilters() {
    setKeyword('')
    setStatusFilter('ALL')
    setCheckInStartDate('')
    setCheckInEndDate('')
  }

  function handleSubmitReschedule() {
    if (!selectedOrderId || !selectedOrder) {
      return
    }

    const nextErrors = validateRescheduleEditorValue(rescheduleEditor, selectedOrder)
    if (Object.keys(nextErrors).length > 0) {
      setRescheduleErrors(nextErrors)
      setActionFeedback('请先修正改期表单')
      MessagePlugin.error('请先修正改期表单')
      return
    }

    setActionFeedback(null)
    rescheduleMutation.mutate({
      orderId: selectedOrderId,
      payload: rescheduleEditor,
    })
  }

  function handleSubmitRefund() {
    if (!selectedOrderId || !selectedOrder) {
      return
    }

    const nextErrors = validateRefundEditorValue(refundEditor)
    if (Object.keys(nextErrors).length > 0) {
      setRefundErrors(nextErrors)
      setActionFeedback('请先填写退款原因')
      MessagePlugin.error('请先填写退款原因')
      return
    }

    setActionFeedback(null)
    refundMutation.mutate({
      orderId: selectedOrderId,
      payload: refundEditor,
    })
  }

  function handleApproveAfterSale() {
    if (!selectedOrderId || !selectedOrder?.latestAfterSaleRequestId) {
      return
    }

    setActionFeedback(null)
    approveAfterSaleMutation.mutate({
      orderId: selectedOrderId,
      requestId: selectedOrder.latestAfterSaleRequestId,
    })
  }

  function handleRetryRefund() {
    if (!selectedOrderId || !selectedOrder?.latestRefundRecordId) {
      return
    }

    setActionFeedback(null)
    retryRefundMutation.mutate({
      orderId: selectedOrderId,
      refundId: selectedOrder.latestRefundRecordId,
    })
  }

  function handleRejectAfterSale() {
    if (!selectedOrderId || !selectedOrder?.latestAfterSaleRequestId) {
      return
    }

    const nextErrors = validateRejectEditorValue(rejectEditor)
    if (Object.keys(nextErrors).length > 0) {
      setRejectErrors(nextErrors)
      setActionFeedback('请先填写拒绝原因')
      MessagePlugin.error('请先填写拒绝原因')
      return
    }

    setActionFeedback(null)
    rejectAfterSaleMutation.mutate({
      orderId: selectedOrderId,
      requestId: selectedOrder.latestAfterSaleRequestId,
      payload: rejectEditor,
    })
  }

  function handleCheckIn() {
    if (!selectedOrderId) {
      return
    }

    setActionFeedback(null)
    checkInMutation.mutate(selectedOrderId)
  }

  function handleCheckOut() {
    if (!selectedOrderId) {
      return
    }

    setActionFeedback(null)
    checkOutMutation.mutate(selectedOrderId)
  }

  function handleMarkNoShow() {
    if (!selectedOrderId) {
      return
    }

    setActionFeedback(null)
    noShowMutation.mutate(selectedOrderId)
  }

  const orderColumns: TableProps<AdminOrder>['columns'] = [
    {
      colKey: 'order',
      title: '订单信息',
      minWidth: 280,
      cell: ({ row }) => (
        <div className="order-table__primary">
          <div className="order-table__heading">
            <strong>{row.orderNo}</strong>
            <span>{row.roomName}</span>
          </div>
          <div className="order-table__tags">
            <Tag size="small" theme="default" variant="light-outline">
              {resolveSourceLabel(row.source)}
            </Tag>
            <span className="order-table__muted">下单时间 {formatDateTime(row.createdAt)}</span>
          </div>
        </div>
      ),
    },
    {
      colKey: 'guest',
      title: '入住人',
      minWidth: 180,
      cell: ({ row }) => (
        <div className="order-table__meta">
          <strong>{row.guestName}</strong>
          <span>{row.guestPhone}</span>
          <span>抵达时间 {row.arrivalTime || '--'}</span>
        </div>
      ),
    },
    {
      colKey: 'stay',
      title: '入住信息',
      minWidth: 220,
      cell: ({ row }) => (
        <div className="order-table__meta">
          <strong>{row.checkInDate}</strong>
          <span>退房 {row.checkOutDate}</span>
          <span>{row.nights} 晚</span>
        </div>
      ),
    },
    {
      colKey: 'status',
      title: '状态与售后',
      minWidth: 240,
      cell: ({ row }) => (
        <div className="order-table__status">
          <Tag theme={orderStatusThemeMap[row.status]} variant="light-outline">
            {row.statusLabel}
          </Tag>
          <span>
            主状态 {row.bookingStatusLabel} / 支付 {row.paymentStatusLabel}
          </span>
          <span>{resolveAfterSaleSummary(row)}</span>
        </div>
      ),
    },
    {
      colKey: 'amount',
      title: '金额',
      width: 120,
      cell: ({ row }) => <strong className="order-table__amount">{formatCurrency(row.totalAmount)}</strong>,
    },
    {
      colKey: 'actions',
      title: '操作',
      width: 280,
      align: 'right',
      cell: ({ row }) => {
        const isRescheduling =
          rescheduleMutation.isPending && rescheduleMutation.variables?.orderId === row.id
        const isRefunding = refundMutation.isPending && refundMutation.variables?.orderId === row.id
        const isRetryingRefund =
          retryRefundMutation.isPending && retryRefundMutation.variables?.orderId === row.id
        const isCheckingIn = checkInMutation.isPending && checkInMutation.variables === row.id
        const isCheckingOut = checkOutMutation.isPending && checkOutMutation.variables === row.id
        const isNoShowing = noShowMutation.isPending && noShowMutation.variables === row.id

        return (
          <Space align="center" size={12}>
            <Button size="small" theme="primary" variant="outline" onClick={() => handleOpenDrawer(row)}>
              查看详情
            </Button>
            {hasPendingAfterSale(row) ? (
              <Button size="small" theme="primary" variant="outline" onClick={() => handleOpenDrawer(row)}>
                审核申请
              </Button>
            ) : null}
            {canDirectReschedule(row) ? (
              <Button
                size="small"
                theme="primary"
                variant="outline"
                loading={isRescheduling}
                onClick={() => handleOpenDrawer(row, 'reschedule')}
              >
                后台改期
              </Button>
            ) : null}
            {canDirectRefund(row) ? (
              <Button
                size="small"
                theme="danger"
                variant="outline"
                loading={isRefunding}
                onClick={() => handleOpenDrawer(row, 'refund')}
              >
                后台退款
              </Button>
            ) : null}
            {canRetryRefund(row) ? (
              <Button
                size="small"
                theme="warning"
                variant="outline"
                loading={isRetryingRefund}
                onClick={() => handleOpenDrawer(row)}
              >
                重试退款
              </Button>
            ) : null}
            {canCheckIn(row) ? (
              <Button
                size="small"
                theme="success"
                variant="outline"
                loading={isCheckingIn}
                onClick={() => handleOpenDrawer(row)}
              >
                办理入住
              </Button>
            ) : null}
            {canCheckOut(row) ? (
              <Button
                size="small"
                theme="success"
                variant="outline"
                loading={isCheckingOut}
                onClick={() => handleOpenDrawer(row)}
              >
                办理离店
              </Button>
            ) : null}
            {canMarkNoShow(row) ? (
              <Button
                size="small"
                theme="warning"
                variant="outline"
                loading={isNoShowing}
                onClick={() => handleOpenDrawer(row)}
              >
                标记失约
              </Button>
            ) : null}
          </Space>
        )
      },
    },
  ]

  function renderOrderDetail() {
    if (orderDetailQuery.isError && !selectedOrder) {
      return (
        <div className="order-drawer__empty">
          <Tag theme="danger" variant="light-outline">
            详情加载失败
          </Tag>
          <h3>无法获取订单详情</h3>
          <p>{getAdminOrderErrorMessage(orderDetailQuery.error, '请稍后重试')}</p>
          <Button theme="primary" onClick={() => void orderDetailQuery.refetch()}>
            重新加载
          </Button>
        </div>
      )
    }

    if (!selectedOrder) {
      return (
        <div className="order-drawer__empty">
          <h3>订单详情加载中</h3>
          <p>正在同步后台订单详情和售后状态。</p>
        </div>
      )
    }

    const timeline = buildOrderTimeline(selectedOrder)
    const reviewStatus = selectedOrder.latestAfterSaleStatus as AdminOrderAfterSaleStatus
    const canReview = hasPendingAfterSale(selectedOrder)
    const allowDirectReschedule = canDirectReschedule(selectedOrder)
    const allowDirectRefund = canDirectRefund(selectedOrder)
    const allowRetryRefund = canRetryRefund(selectedOrder)
    const allowCheckIn = canCheckIn(selectedOrder)
    const allowCheckOut = canCheckOut(selectedOrder)
    const allowNoShow = canMarkNoShow(selectedOrder)

    return (
      <div className="order-drawer">
        <section className="order-drawer__hero">
          <div className="order-drawer__hero-copy">
            <Space align="center" size={12}>
              <Tag theme={orderStatusThemeMap[selectedOrder.status]} variant="light-outline">
                {selectedOrder.statusLabel}
              </Tag>
              <Tag theme="default" variant="light-outline">
                {selectedOrder.bookingStatusLabel}
              </Tag>
              <Tag theme="default" variant="light-outline">
                {selectedOrder.paymentStatusLabel}
              </Tag>
              <Tag theme="default" variant="light-outline">
                {resolveSourceLabel(selectedOrder.source)}
              </Tag>
            </Space>
            <h3>{selectedOrder.orderNo}</h3>
            <p>{selectedOrder.roomName}</p>
          </div>
          <div className="order-drawer__hero-meta">
            <span>入住 {selectedOrder.checkInDate}</span>
            <span>退房 {selectedOrder.checkOutDate}</span>
            <span>{selectedOrder.nights} 晚</span>
            <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
          </div>
        </section>

        <div className="order-detail-grid">
          <article className="order-detail-card">
            <h4>入住人与联系信息</h4>
            <dl className="order-detail-list">
              <div>
                <dt>入住人</dt>
                <dd>{selectedOrder.guestName}</dd>
              </div>
              <div>
                <dt>手机号</dt>
                <dd>{selectedOrder.guestPhone}</dd>
              </div>
              <div>
                <dt>到店时间</dt>
                <dd>{selectedOrder.arrivalTime || '未填写'}</dd>
              </div>
              <div>
                <dt>用户 ID</dt>
                <dd>{selectedOrder.userId}</dd>
              </div>
            </dl>
          </article>

          <article className="order-detail-card">
            <h4>订单时间线</h4>
            <ul className="order-timeline">
              {timeline.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="order-detail-grid">
          <article className="order-detail-card">
            <h4>支付流水</h4>
            <dl className="order-detail-list">
              <div>
                <dt>支付模式</dt>
                <dd>{selectedOrder.paymentMode || '未发起支付'}</dd>
              </div>
              <div>
                <dt>支付单状态</dt>
                <dd>{selectedOrder.paymentRecordStatus || '无'}</dd>
              </div>
              <div>
                <dt>商户订单号</dt>
                <dd>{selectedOrder.paymentRecordNo || '无'}</dd>
              </div>
              <div>
                <dt>微信流水号</dt>
                <dd>{selectedOrder.transactionId || '无'}</dd>
              </div>
            </dl>
          </article>

          <article className="order-detail-card">
            <h4>退款流水</h4>
            <dl className="order-detail-list">
              <div>
                <dt>最近退款记录</dt>
                <dd>{selectedOrder.latestRefundRecordId ?? '无'}</dd>
              </div>
              <div>
                <dt>退款状态</dt>
                <dd>{selectedOrder.latestRefundStatus || '无'}</dd>
              </div>
              <div>
                <dt>退款金额</dt>
                <dd>{selectedOrder.latestRefundAmount ? formatCurrency(selectedOrder.latestRefundAmount) : '无'}</dd>
              </div>
              <div>
                <dt>失败原因</dt>
                <dd>{selectedOrder.latestRefundFailureMessage || selectedOrder.latestRefundFailureCode || '无'}</dd>
              </div>
            </dl>
          </article>
        </div>

        <div className="order-detail-grid">
          <article className="order-detail-card">
            <h4>订单备注</h4>
            <p>{selectedOrder.remark || '未填写订单备注'}</p>
          </article>

          <article className="order-detail-card">
            <h4>售后记录</h4>
            <p>{resolveAfterSaleSummary(selectedOrder)}</p>
            {selectedOrder.latestAfterSaleType ? (
              <dl className="order-detail-list">
                <div>
                  <dt>最近售后类型</dt>
                  <dd>{selectedOrder.latestAfterSaleType === 'RESCHEDULE' ? '改期' : '退款'}</dd>
                </div>
                <div>
                  <dt>最近售后状态</dt>
                  <dd>{selectedOrder.latestAfterSaleStatusLabel || '未发起'}</dd>
                </div>
                <div>
                  <dt>累计改期次数</dt>
                  <dd>{selectedOrder.rescheduleCount}</dd>
                </div>
                {hasRejectedAfterSale(selectedOrder) && selectedOrder.latestAfterSaleRejectReason ? (
                  <div>
                    <dt>拒绝原因</dt>
                    <dd>{selectedOrder.latestAfterSaleRejectReason}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </article>
        </div>

        <section className="order-detail-card order-action-card">
          <div className="order-action-card__header">
            <div>
              <h4>订单处理</h4>
              <p>
                当前页面按 `主订单状态 + 支付状态 + 售后申请状态` 展示，并区分“用户提交申请”和“后台直接处理”。
              </p>
            </div>
            <Space align="center" size={12}>
              <Button
                size="small"
                theme="primary"
                variant={drawerMode === 'detail' ? 'base' : 'outline'}
                onClick={() => {
                  setDrawerMode('detail')
                  resetActionState()
                }}
              >
                查看详情
              </Button>
              <Button
                size="small"
                theme="primary"
                variant={drawerMode === 'reschedule' ? 'base' : 'outline'}
                disabled={!allowDirectReschedule}
                onClick={() => {
                  setDrawerMode('reschedule')
                  resetActionState()
                }}
              >
                后台改期
              </Button>
              <Button
                size="small"
                theme="danger"
                variant={drawerMode === 'refund' ? 'base' : 'outline'}
                disabled={!allowDirectRefund}
                onClick={() => {
                  setDrawerMode('refund')
                  resetActionState()
                }}
              >
                后台退款
              </Button>
            </Space>
          </div>

          {actionFeedback ? (
            <div className="order-action-feedback">
              <Tag theme="danger" variant="light-outline">
                操作反馈
              </Tag>
              <p>{actionFeedback}</p>
            </div>
          ) : null}

          {drawerMode === 'detail' && canReview ? (
            <div className="order-action-form">
              <div className="order-action-card__notice">
                <Tag theme="warning" variant="light-outline">
                  待审核申请
                </Tag>
                <p>
                  用户已提交
                  {selectedOrder.latestAfterSaleType === 'RESCHEDULE' ? '改期' : '退款'}
                  申请，当前状态为 {selectedOrder.latestAfterSaleStatusLabel}。
                </p>
              </div>
              <label className="room-field">
                <span className="room-field__label">拒绝原因</span>
                <Textarea
                  autosize={{ minRows: 3, maxRows: 5 }}
                  placeholder="请输入拒绝原因，例如：房态已锁满、已过可退款时限"
                  value={rejectEditor.rejectReason}
                  onChange={(value) => updateRejectField('rejectReason', String(value))}
                />
                {rejectErrors.rejectReason ? (
                  <span className="form-error">{rejectErrors.rejectReason}</span>
                ) : null}
              </label>
              <div className="order-action-form__footer">
                <p>
                  申请状态：{reviewStatus ? selectedOrder.latestAfterSaleStatusLabel : '未发起'}，
                  申请编号：{selectedOrder.latestAfterSaleRequestId ?? '--'}
                </p>
                <Space align="center" size={12}>
                  <Button
                    theme="primary"
                    loading={approveAfterSaleMutation.isPending}
                    onClick={handleApproveAfterSale}
                  >
                    同意申请
                  </Button>
                  <Button
                    theme="danger"
                    variant="outline"
                    loading={rejectAfterSaleMutation.isPending}
                    onClick={handleRejectAfterSale}
                  >
                    拒绝申请
                  </Button>
                </Space>
              </div>
            </div>
          ) : null}

          {drawerMode === 'detail' && !canReview ? (
            <div className="order-action-form">
              <div className="order-action-card__notice">
                <Tag theme="default" variant="light-outline">
                  当前处理能力
                </Tag>
                <p>
                  {allowDirectReschedule || allowDirectRefund || allowRetryRefund || allowCheckIn || allowCheckOut || allowNoShow
                    ? '可执行后台改期/退款、重试退款、办理入住/离店或标记失约。'
                    : '当前订单暂无可执行动作，可查看状态与时间线。'}
                </p>
              </div>
              <div className="order-action-form__footer">
                <p>
                  最近售后：{selectedOrder.latestAfterSaleStatusLabel || '无'}，
                  当前支付：{selectedOrder.paymentStatusLabel}
                </p>
                <Space align="center" size={12}>
                  {allowRetryRefund ? (
                    <Button
                      theme="warning"
                      variant="outline"
                      loading={retryRefundMutation.isPending}
                      onClick={handleRetryRefund}
                    >
                      重试退款
                    </Button>
                  ) : null}
                  {allowCheckIn ? (
                    <Button
                      theme="success"
                      variant="outline"
                      loading={checkInMutation.isPending}
                      onClick={handleCheckIn}
                    >
                      办理入住
                    </Button>
                  ) : null}
                  {allowCheckOut ? (
                    <Button
                      theme="success"
                      variant="outline"
                      loading={checkOutMutation.isPending}
                      onClick={handleCheckOut}
                    >
                      办理离店
                    </Button>
                  ) : null}
                  {allowNoShow ? (
                    <Button
                      theme="warning"
                      variant="outline"
                      loading={noShowMutation.isPending}
                      onClick={handleMarkNoShow}
                    >
                      标记失约
                    </Button>
                  ) : null}
                </Space>
              </div>
            </div>
          ) : null}

          {drawerMode === 'reschedule' ? (
            <div className="order-action-form">
              {!allowDirectReschedule ? (
                <div className="order-action-card__notice">
                  <Tag theme="warning" variant="light-outline">
                    当前状态不可后台改期
                  </Tag>
                  <p>仅 `bookingStatus = CONFIRMED` 且 `paymentStatus = PAID`、无进行中售后时允许后台直接改期。</p>
                </div>
              ) : null}
              <div className="order-action-form__grid">
                <label className="room-field">
                  <span className="room-field__label">新的入住日期</span>
                  <DatePicker
                    clearable
                    format="YYYY-MM-DD"
                    placeholder="请选择新的入住日期"
                    value={rescheduleEditor.checkInDate}
                    valueType="YYYY-MM-DD"
                    onChange={(value) => updateRescheduleField('checkInDate', String(value || ''))}
                  />
                  {rescheduleErrors.checkInDate ? (
                    <span className="form-error">{rescheduleErrors.checkInDate}</span>
                  ) : null}
                </label>

                <label className="room-field">
                  <span className="room-field__label">新的退房日期</span>
                  <DatePicker
                    clearable
                    format="YYYY-MM-DD"
                    placeholder="请选择新的退房日期"
                    value={rescheduleEditor.checkOutDate}
                    valueType="YYYY-MM-DD"
                    onChange={(value) => updateRescheduleField('checkOutDate', String(value || ''))}
                  />
                  {rescheduleErrors.checkOutDate ? (
                    <span className="form-error">{rescheduleErrors.checkOutDate}</span>
                  ) : null}
                </label>
              </div>

              <label className="room-field">
                <span className="room-field__label">改期原因</span>
                <Textarea
                  autosize={{ minRows: 3, maxRows: 5 }}
                  placeholder="请输入后台改期原因，例如：客户协调档期、房型升级改约"
                  value={rescheduleEditor.reason}
                  onChange={(value) => updateRescheduleField('reason', String(value))}
                />
                {rescheduleErrors.reason ? <span className="form-error">{rescheduleErrors.reason}</span> : null}
              </label>

              <div className="order-action-form__footer">
                <p>原订单共 {selectedOrder.nights} 晚，改期时需保持相同住晚数。</p>
                <Button
                  theme="primary"
                  disabled={!allowDirectReschedule}
                  loading={rescheduleMutation.isPending}
                  onClick={handleSubmitReschedule}
                >
                  提交改期
                </Button>
              </div>
            </div>
          ) : null}

          {drawerMode === 'refund' ? (
            <div className="order-action-form">
              {!allowDirectRefund ? (
                <div className="order-action-card__notice">
                  <Tag theme="warning" variant="light-outline">
                    当前状态不可后台退款
                  </Tag>
                  <p>仅 `bookingStatus = CONFIRMED` 且 `paymentStatus = PAID`、无进行中售后时允许后台直接退款。</p>
                </div>
              ) : null}
              <label className="room-field">
                <span className="room-field__label">退款原因</span>
                <Textarea
                  autosize={{ minRows: 4, maxRows: 6 }}
                  placeholder="请输入退款原因，例如：客户临时取消、异常天气关闭房态"
                  value={refundEditor.reason}
                  onChange={(value) => updateRefundField('reason', String(value))}
                />
                {refundErrors.reason ? <span className="form-error">{refundErrors.reason}</span> : null}
              </label>

              <div className="order-action-form__footer">
                <p>退款成功后会回补原入住日期的锁定库存，并更新售后原因。</p>
                <Button
                  theme="danger"
                  disabled={!allowDirectRefund}
                  loading={refundMutation.isPending}
                  onClick={handleSubmitRefund}
                >
                  提交退款
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-panel order-hero">
        <div className="hero-panel__copy">
          <Tag theme="success" variant="light-outline">
            订单履约与售后
          </Tag>
          <h3>订单分层状态、售后审批与入住履约</h3>
          <p>
            当前页面展示订单主状态、支付状态、售后申请状态和入住/离店/失约流程，支持在抽屉内完成审批与履约处理。
          </p>
        </div>
        <div className="order-stat-grid">
          {overviewCards.map((item) => (
            <article key={item.title} className="room-stat-card order-stat-card">
              <small>{item.title}</small>
              <strong>{item.value}</strong>
              <span>{item.hint}</span>
            </article>
          ))}
        </div>
      </section>

      {orderOverviewQuery.isError ? (
        <Card className="panel-card room-feedback-card">
          <div className="room-feedback-card__content">
            <Tag theme="warning" variant="light-outline">
              概览加载失败
            </Tag>
            <h3>经营概览暂时不可用</h3>
            <p>{getAdminOrderErrorMessage(orderOverviewQuery.error, '请确认管理端报表接口可用')}</p>
          </div>
        </Card>
      ) : null}

      <Card className="panel-card order-toolbar-card">
        <div className="order-toolbar">
          <Input
            clearable
            placeholder="搜索订单号、房型、入住人或手机号"
            size="large"
            value={keyword}
            onChange={(value) => setKeyword(String(value))}
          />
          <Select
            size="large"
            value={statusFilter}
            options={orderStatusOptions}
            onChange={(value) => setStatusFilter(String(value) as AdminOrderStatusFilter)}
          />
          <DatePicker
            clearable
            format="YYYY-MM-DD"
            placeholder="入住开始日期"
            value={checkInStartDate}
            valueType="YYYY-MM-DD"
            onChange={(value) => setCheckInStartDate(String(value || ''))}
          />
          <DatePicker
            clearable
            format="YYYY-MM-DD"
            placeholder="入住结束日期"
            value={checkInEndDate}
            valueType="YYYY-MM-DD"
            onChange={(value) => setCheckInEndDate(String(value || ''))}
          />
          <Space align="center" size={12}>
            <Button variant="outline" loading={orderListQuery.isFetching || orderOverviewQuery.isFetching} onClick={handleRefresh}>
              刷新列表
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              清空筛选
            </Button>
          </Space>
        </div>
        <div className="order-toolbar__tips">
          <span>支持按订单号、房型名、入住人、手机号模糊搜索</span>
          <span>入住日期筛选匹配订单的 `checkInDate`</span>
        </div>
      </Card>

      {dateRangeError ? (
        <Card className="panel-card room-feedback-card">
          <div className="room-feedback-card__content">
            <Tag theme="warning" variant="light-outline">
              筛选条件无效
            </Tag>
            <h3>请调整入住日期范围</h3>
            <p>{dateRangeError}</p>
          </div>
        </Card>
      ) : orderListQuery.isError ? (
        <Card className="panel-card room-feedback-card">
          <div className="room-feedback-card__content">
            <Tag theme="danger" variant="light-outline">
              列表加载失败
            </Tag>
            <h3>订单列表加载失败</h3>
            <p>{getAdminOrderErrorMessage(orderListQuery.error, '请确认管理端订单接口可用')}</p>
            <Button theme="primary" onClick={() => void orderListQuery.refetch()}>
              重新加载
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="panel-card order-table-card">
          <div className="room-table-card__header">
            <div>
              <h3>订单列表</h3>
              <p>
                当前筛选结果 {orderListQuery.data?.length ?? 0} 条，支持查看详情、售后审批和入住履约处理。
              </p>
            </div>
            <Tag theme="warning" variant="light-outline">
              接口已联通
            </Tag>
          </div>
          <Table
            bordered
            hover
            rowKey="id"
            size="medium"
            stripe
            columns={orderColumns}
            data={orderListQuery.data ?? []}
            loading={orderListQuery.isPending}
            empty={<div className="room-table__empty">当前筛选条件下暂无订单。</div>}
          />
        </Card>
      )}

      <Drawer
        closeBtn
        destroyOnClose
        footer={false}
        header="订单详情与售后"
        size="large"
        visible={isDrawerVisible}
        onClose={handleCloseDrawer}
      >
        {renderOrderDetail()}
      </Drawer>
    </div>
  )
}
