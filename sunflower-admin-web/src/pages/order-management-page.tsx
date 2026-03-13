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
} from 'tdesign-react'
import {
  fetchAdminOrderDetail,
  fetchAdminOrderOverview,
  fetchAdminOrders,
  getAdminOrderErrorMessage,
  refundAdminOrder,
  rescheduleAdminOrder,
  type AdminOrder,
  type AdminOrderOverview,
  type AdminOrderStatus,
  type AdminOrderStatusFilter,
} from '@/features/orders/admin-order-service'

const ORDER_LIST_QUERY_KEY = ['admin-orders']
const ORDER_OVERVIEW_QUERY_KEY = ['admin-order-overview']
const ORDER_ACTIONABLE_STATUSES = new Set<AdminOrderStatus>(['CONFIRMED', 'RESCHEDULED'])

type DrawerMode = 'detail' | 'reschedule' | 'refund'
type RescheduleEditorField = 'checkInDate' | 'checkOutDate' | 'reason'
type RefundEditorField = 'reason'

type RescheduleEditorErrors = Partial<Record<RescheduleEditorField, string>>
type RefundEditorErrors = Partial<Record<RefundEditorField, string>>

interface RescheduleEditorValue {
  checkInDate: string
  checkOutDate: string
  reason: string
}

interface RefundEditorValue {
  reason: string
}

const orderStatusOptions: Array<{ label: string; value: AdminOrderStatusFilter }> = [
  { label: '全部状态', value: 'ALL' },
  { label: '待支付', value: 'PENDING_PAYMENT' },
  { label: '待入住', value: 'CONFIRMED' },
  { label: '已改期', value: 'RESCHEDULED' },
  { label: '已退款', value: 'REFUNDED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
]

const orderStatusThemeMap: Record<AdminOrderStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  PENDING_PAYMENT: 'warning',
  CONFIRMED: 'primary',
  RESCHEDULED: 'success',
  REFUNDED: 'danger',
  COMPLETED: 'success',
  CANCELLED: 'default',
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
      hint: '待入住 / 已改期状态',
    },
    {
      title: '已退款',
      value: overview?.refundedOrderCount ?? '--',
      hint: '售后已完成退款单',
    },
    {
      title: '成交额',
      value: overview ? formatCurrency(overview.revenueAmount) : '--',
      hint: '已确认、已改期、已完成订单汇总',
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

function canHandleAfterSale(order: AdminOrder) {
  return ORDER_ACTIONABLE_STATUSES.has(order.status)
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

function buildOrderTimeline(order: AdminOrder) {
  return [
    { label: '创建时间', value: formatDateTime(order.createdAt) },
    { label: '支付时间', value: formatDateTime(order.paidAt) },
    { label: '改期时间', value: formatDateTime(order.rescheduledAt) },
    { label: '退款时间', value: formatDateTime(order.refundedAt) },
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
  const [rescheduleErrors, setRescheduleErrors] = useState<RescheduleEditorErrors>({})
  const [refundErrors, setRefundErrors] = useState<RefundEditorErrors>({})
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const deferredKeyword = useDeferredValue(keyword.trim())
  const dateRangeError =
    checkInStartDate && checkInEndDate && checkInStartDate > checkInEndDate
      ? '入住开始日期不能晚于结束日期'
      : ''

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
    onSuccess: async (order) => {
      setActionFeedback(null)
      setRescheduleErrors({})
      setRefundErrors({})
      setDrawerMode('detail')
      setRescheduleEditor(createRescheduleEditorValue(order))
      setRefundEditor(createRefundEditorValue())
      queryClient.setQueryData(['admin-order-detail', order.id], order)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDER_LIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORDER_OVERVIEW_QUERY_KEY }),
      ])
      MessagePlugin.success('订单已改期')
    },
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
    onSuccess: async (order) => {
      setActionFeedback(null)
      setRescheduleErrors({})
      setRefundErrors({})
      setDrawerMode('detail')
      setRescheduleEditor(createRescheduleEditorValue(order))
      setRefundEditor(createRefundEditorValue())
      queryClient.setQueryData(['admin-order-detail', order.id], order)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDER_LIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORDER_OVERVIEW_QUERY_KEY }),
      ])
      MessagePlugin.success('订单已退款')
    },
    onError: (error) => {
      const message = getAdminOrderErrorMessage(error, '订单退款失败，请稍后重试')
      setActionFeedback(message)
      MessagePlugin.error(message)
    },
  })

  function resetActionState() {
    setRescheduleErrors({})
    setRefundErrors({})
    setActionFeedback(null)
  }

  function handleOpenDrawer(order: AdminOrder, mode: DrawerMode = 'detail') {
    setSelectedOrderId(order.id)
    setDrawerMode(mode)
    setRescheduleEditor(createRescheduleEditorValue(order))
    setRefundEditor(createRefundEditorValue())
    resetActionState()
  }

  function handleCloseDrawer() {
    if (rescheduleMutation.isPending || refundMutation.isPending) {
      return
    }

    setSelectedOrderId(null)
    setDrawerMode('detail')
    setRescheduleEditor(createRescheduleEditorValue())
    setRefundEditor(createRefundEditorValue())
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
          <span>{row.afterSaleReason || '未记录售后原因'}</span>
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
        const canOperate = canHandleAfterSale(row)

        return (
          <Space align="center" size={12}>
            <Button size="small" theme="primary" variant="outline" onClick={() => handleOpenDrawer(row)}>
              查看详情
            </Button>
            <Button
              size="small"
              theme="primary"
              variant="outline"
              disabled={!canOperate}
              loading={isRescheduling}
              onClick={() => handleOpenDrawer(row, 'reschedule')}
            >
              改期
            </Button>
            <Button
              size="small"
              theme="danger"
              variant="outline"
              disabled={!canOperate}
              loading={isRefunding}
              onClick={() => handleOpenDrawer(row, 'refund')}
            >
              退款
            </Button>
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

    const canOperate = canHandleAfterSale(selectedOrder)
    const timeline = buildOrderTimeline(selectedOrder)

    return (
      <div className="order-drawer">
        <section className="order-drawer__hero">
          <div className="order-drawer__hero-copy">
            <Space align="center" size={12}>
              <Tag theme={orderStatusThemeMap[selectedOrder.status]} variant="light-outline">
                {selectedOrder.statusLabel}
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
            <h4>订单备注</h4>
            <p>{selectedOrder.remark || '未填写订单备注'}</p>
          </article>

          <article className="order-detail-card">
            <h4>售后记录</h4>
            <p>{selectedOrder.afterSaleReason || '当前还没有售后处理记录'}</p>
          </article>
        </div>

        <section className="order-detail-card order-action-card">
          <div className="order-action-card__header">
            <div>
              <h4>售后处理</h4>
              <p>
                当前只允许对 `待入住 / 已改期` 订单执行改期或退款，失败原因直接透传后端返回文案。
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
                disabled={!canOperate}
                onClick={() => {
                  setDrawerMode('reschedule')
                  resetActionState()
                }}
              >
                改期处理
              </Button>
              <Button
                size="small"
                theme="danger"
                variant={drawerMode === 'refund' ? 'base' : 'outline'}
                disabled={!canOperate}
                onClick={() => {
                  setDrawerMode('refund')
                  resetActionState()
                }}
              >
                退款处理
              </Button>
            </Space>
          </div>

          {!canOperate ? (
            <div className="order-action-card__notice">
              <Tag theme="warning" variant="light-outline">
                当前状态不可售后
              </Tag>
              <p>只有待入住和已改期订单允许在后台继续改期或退款。</p>
            </div>
          ) : null}

          {actionFeedback ? (
            <div className="order-action-feedback">
              <Tag theme="danger" variant="light-outline">
                操作反馈
              </Tag>
              <p>{actionFeedback}</p>
            </div>
          ) : null}

          {drawerMode === 'reschedule' ? (
            <div className="order-action-form">
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
            S13 订单与售后页面
          </Tag>
          <h3>订单筛选、详情抽屉与售后闭环</h3>
          <p>
            当前页面已接入 S8 管理端订单列表、详情、经营概览和改期/退款接口，支持按状态、关键词、入住日期筛选并在抽屉内完成售后处理。
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
                当前筛选结果 {orderListQuery.data?.length ?? 0} 条，支持查看详情、改期和退款处理。
              </p>
            </div>
            <Tag theme="warning" variant="light-outline">
              S8 API 已接入
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
