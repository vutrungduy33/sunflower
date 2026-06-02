import { type ChangeEvent, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
} from '@/features/orders/admin-order-service'
import { OrderManagementPage } from '@/pages/order-management-page'

const { messageSuccess, messageError } = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageError: vi.fn(),
}))

vi.mock('tdesign-react', () => {
  function Button({
    children,
    disabled,
    loading,
    onClick,
    type,
  }: {
    children?: ReactNode
    disabled?: boolean
    loading?: boolean
    onClick?: () => void
    type?: 'button' | 'submit' | 'reset'
  }) {
    return (
      <button
        disabled={disabled || loading}
        onClick={onClick}
        type={type === 'submit' ? 'submit' : 'button'}
      >
        {children}
      </button>
    )
  }

  function Card({
    children,
    className,
    title,
  }: {
    children?: ReactNode
    className?: string
    title?: ReactNode
  }) {
    return (
      <section className={className}>
        {title ? <h3>{title}</h3> : null}
        {children}
      </section>
    )
  }

  function Drawer({
    children,
    header,
    visible,
  }: {
    children?: ReactNode
    header?: ReactNode
    visible?: boolean
  }) {
    if (!visible) {
      return null
    }

    return (
      <div role="dialog">
        {header ? <h2>{header}</h2> : null}
        {children}
      </div>
    )
  }

  function DatePicker({
    onChange,
    placeholder,
    value,
  }: {
    onChange?: (value: string) => void
    placeholder?: string
    value?: string
  }) {
    return (
      <input
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)}
      />
    )
  }

  function Input({
    onChange,
    placeholder,
    type = 'text',
    value,
  }: {
    onChange?: (value: string) => void
    placeholder?: string
    type?: string
    value?: string
  }) {
    return (
      <input
        placeholder={placeholder}
        type={type}
        value={value ?? ''}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)}
      />
    )
  }

  function Select({
    onChange,
    options,
    value,
  }: {
    onChange?: (value: string) => void
    options?: Array<{ label: string; value: string }>
    value?: string
  }) {
    return (
      <select value={value} onChange={(event) => onChange?.(event.target.value)}>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  function Space({ children }: { children?: ReactNode }) {
    return <div>{children}</div>
  }

  function Table<T extends Record<string, unknown>>({
    columns = [],
    data = [],
    empty,
    loading,
  }: {
    columns?: Array<{
      colKey?: string
      title?: ReactNode
      cell?: string | ((params: { row: T; rowIndex: number }) => ReactNode)
    }>
    data?: T[]
    empty?: ReactNode
    loading?: boolean
  }) {
    if (loading) {
      return <div>加载中</div>
    }

    if (!data.length) {
      return <>{empty}</>
    }

    return (
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.colKey)}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={String(row.id ?? rowIndex)}>
              {columns.map((column) => {
                const key = String(column.colKey)
                let cellContent: ReactNode = key && key in row ? String(row[key]) : null

                if (typeof column.cell === 'string') {
                  cellContent = String(row[column.cell] ?? '')
                }
                if (typeof column.cell === 'function') {
                  cellContent = column.cell({ row, rowIndex })
                }

                return <td key={key}>{cellContent}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  function Tag({ children }: { children?: ReactNode }) {
    return <span>{children}</span>
  }

  function Textarea({
    onChange,
    placeholder,
    value,
  }: {
    onChange?: (value: string) => void
    placeholder?: string
    value?: string
  }) {
    return (
      <textarea
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value)}
      />
    )
  }

  return {
    Button,
    Card,
    DatePicker,
    Drawer,
    Input,
    MessagePlugin: {
      success: messageSuccess,
      error: messageError,
    },
    Select,
    Space,
    Table,
    Tag,
    Textarea,
  }
})

vi.mock('@/features/orders/admin-order-service', () => ({
  approveAdminAfterSaleRequest: vi.fn(),
  checkInAdminOrder: vi.fn(),
  checkOutAdminOrder: vi.fn(),
  fetchAdminOrderDetail: vi.fn(),
  fetchAdminOrderOverview: vi.fn(),
  fetchAdminOrders: vi.fn(),
  getAdminOrderErrorMessage: vi.fn((error: unknown, fallback?: string) =>
    error instanceof Error ? error.message : fallback || '订单操作失败，请稍后重试',
  ),
  noShowAdminOrder: vi.fn(),
  rejectAdminAfterSaleRequest: vi.fn(),
  refundAdminOrder: vi.fn(),
  rescheduleAdminOrder: vi.fn(),
  retryAdminRefund: vi.fn(),
}))

function buildOverview(overrides: Partial<AdminOrderOverview> = {}): AdminOrderOverview {
  return {
    orderCount: 3,
    pendingCheckInCount: 2,
    refundedOrderCount: 1,
    revenueAmount: 976,
    ...overrides,
  }
}

function buildOrder(overrides: Partial<AdminOrder> = {}): AdminOrder {
  return {
    id: 'order-1',
    orderNo: 'SF2026031110301234',
    userId: 'user_demo_1001',
    source: 'direct',
    roomId: 'room-lake-101',
    roomName: '270° 湖景大床房',
    checkInDate: '2026-02-15',
    checkOutDate: '2026-02-16',
    nights: 1,
    guestName: '后台售后住客A',
    guestPhone: '13800000011',
    arrivalTime: '18:00',
    remark: '后台改期单',
    totalAmount: 488,
    status: 'CONFIRMED',
    statusLabel: '待入住',
    bookingStatus: 'CONFIRMED',
    bookingStatusLabel: '待入住',
    paymentStatus: 'PAID',
    paymentStatusLabel: '已支付',
    paymentMode: 'WECHAT_MINIAPP',
    paymentRecordStatus: 'SUCCESS',
    paymentRecordNo: 'SFP2026031110301234A1B2C3',
    transactionId: '4200000000000000001',
    latestRefundRecordId: null,
    latestRefundStatus: '',
    latestRefundFailureCode: '',
    latestRefundFailureMessage: '',
    latestRefundAmount: 0,
    latestAfterSaleRequestId: null,
    latestAfterSaleType: '',
    latestAfterSaleStatus: '',
    latestAfterSaleStatusLabel: '',
    latestAfterSaleRejectReason: '',
    rescheduleCount: 0,
    createdAt: '2026-03-11T10:30:12+08:00',
    paidAt: '2026-03-11T10:31:00+08:00',
    cancelledAt: '',
    checkedInAt: '',
    checkedOutAt: '',
    noShowAt: '',
    rescheduledAt: '',
    refundedAt: '',
    afterSaleReason: '',
    ...overrides,
  }
}

function renderOrderManagementPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <OrderManagementPage />
    </QueryClientProvider>,
  )
}

describe('OrderManagementPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    messageSuccess.mockReset()
    messageError.mockReset()
    vi.mocked(fetchAdminOrderOverview).mockReset()
    vi.mocked(fetchAdminOrders).mockReset()
    vi.mocked(fetchAdminOrderDetail).mockReset()
    vi.mocked(approveAdminAfterSaleRequest).mockReset()
    vi.mocked(checkInAdminOrder).mockReset()
    vi.mocked(checkOutAdminOrder).mockReset()
    vi.mocked(noShowAdminOrder).mockReset()
    vi.mocked(rejectAdminAfterSaleRequest).mockReset()
    vi.mocked(rescheduleAdminOrder).mockReset()
    vi.mocked(refundAdminOrder).mockReset()
    vi.mocked(retryAdminRefund).mockReset()
    vi.mocked(getAdminOrderErrorMessage).mockClear()

    vi.mocked(fetchAdminOrderOverview).mockResolvedValue(buildOverview())
    vi.mocked(fetchAdminOrders).mockResolvedValue([buildOrder()])
    vi.mocked(fetchAdminOrderDetail).mockImplementation(async (orderId: string) =>
      buildOrder({ id: orderId }),
    )
    vi.mocked(approveAdminAfterSaleRequest).mockImplementation(async (orderId: string) =>
      buildOrder({
        id: orderId,
        status: 'REFUNDED',
        statusLabel: '已退款',
        bookingStatus: 'CANCELLED',
        bookingStatusLabel: '已取消',
        paymentStatus: 'REFUNDED',
        paymentStatusLabel: '已退款',
        latestAfterSaleRequestId: 11,
        latestAfterSaleType: 'REFUND',
        latestAfterSaleStatus: 'APPROVED',
        latestAfterSaleStatusLabel: '已同意',
        refundedAt: '2026-03-13T11:35:00+08:00',
        afterSaleReason: '用户申请退款',
      }),
    )
    vi.mocked(checkInAdminOrder).mockImplementation(async (orderId: string) =>
      buildOrder({
        id: orderId,
        status: 'CHECKED_IN',
        statusLabel: '已入住',
        bookingStatus: 'CHECKED_IN',
        bookingStatusLabel: '已入住',
        checkedInAt: '2026-03-13T15:00:00+08:00',
      }),
    )
    vi.mocked(checkOutAdminOrder).mockImplementation(async (orderId: string) =>
      buildOrder({
        id: orderId,
        status: 'COMPLETED',
        statusLabel: '已完成',
        bookingStatus: 'CHECKED_OUT',
        bookingStatusLabel: '已离店',
        checkedInAt: '2026-03-13T15:00:00+08:00',
        checkedOutAt: '2026-03-14T12:00:00+08:00',
      }),
    )
    vi.mocked(noShowAdminOrder).mockImplementation(async (orderId: string) =>
      buildOrder({
        id: orderId,
        status: 'NO_SHOW',
        statusLabel: '已失约',
        bookingStatus: 'NO_SHOW',
        bookingStatusLabel: '已失约',
        noShowAt: '2026-03-13T20:00:00+08:00',
      }),
    )
    vi.mocked(rejectAdminAfterSaleRequest).mockImplementation(async (orderId: string, _requestId: number, payload: { rejectReason?: string }) =>
      buildOrder({
        id: orderId,
        latestAfterSaleRequestId: 11,
        latestAfterSaleType: 'REFUND',
        latestAfterSaleStatus: 'REJECTED',
        latestAfterSaleStatusLabel: '已拒绝',
        latestAfterSaleRejectReason: payload.rejectReason ?? '',
        afterSaleReason: '用户申请退款',
      }),
    )
    vi.mocked(rescheduleAdminOrder).mockImplementation(
      async (orderId: string, payload: { checkInDate: string; checkOutDate: string; reason?: string }) =>
        buildOrder({
          id: orderId,
          checkInDate: payload.checkInDate,
          checkOutDate: payload.checkOutDate,
          status: 'RESCHEDULED',
          statusLabel: '已改期',
          bookingStatus: 'CONFIRMED',
          bookingStatusLabel: '待入住',
          paymentStatus: 'PAID',
          paymentStatusLabel: '已支付',
          latestAfterSaleRequestId: 8,
          latestAfterSaleType: 'RESCHEDULE',
          latestAfterSaleStatus: 'APPROVED',
          latestAfterSaleStatusLabel: '已同意',
          rescheduleCount: 1,
          rescheduledAt: '2026-03-13T11:20:00+08:00',
          afterSaleReason: payload.reason ?? '',
        }),
    )
    vi.mocked(refundAdminOrder).mockImplementation(
      async (orderId: string, payload: { reason?: string }) =>
        buildOrder({
          id: orderId,
          status: 'REFUNDED',
          statusLabel: '已退款',
          bookingStatus: 'CANCELLED',
          bookingStatusLabel: '已取消',
          paymentStatus: 'REFUNDED',
          paymentStatusLabel: '已退款',
          latestAfterSaleRequestId: 9,
          latestAfterSaleType: 'REFUND',
          latestAfterSaleStatus: 'APPROVED',
          latestAfterSaleStatusLabel: '已同意',
          refundedAt: '2026-03-13T11:40:00+08:00',
          afterSaleReason: payload.reason ?? '',
        }),
    )
    vi.mocked(retryAdminRefund).mockImplementation(async (orderId: string, refundId: number) =>
      buildOrder({
        id: orderId,
        status: 'CONFIRMED',
        statusLabel: '待入住',
        bookingStatus: 'CONFIRMED',
        bookingStatusLabel: '待入住',
        paymentStatus: 'REFUND_PENDING',
        paymentStatusLabel: '退款中',
        latestRefundRecordId: refundId,
        latestRefundStatus: 'PROCESSING',
        latestRefundFailureCode: '',
        latestRefundFailureMessage: '',
        latestRefundAmount: 488,
      }),
    )
  })

  it('filters the order list by status, keyword and check-in date range', async () => {
    const user = userEvent.setup()

    renderOrderManagementPage()

    expect(await screen.findByText('SF2026031110301234')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('搜索订单号、房型、入住人或手机号'), '住客A')
    await user.selectOptions(screen.getByRole('combobox'), 'CONFIRMED')
    await user.type(screen.getByPlaceholderText('入住开始日期'), '2026-02-15')
    await user.type(screen.getByPlaceholderText('入住结束日期'), '2026-02-16')

    await waitFor(() => {
      expect(fetchAdminOrders).toHaveBeenLastCalledWith({
        status: 'CONFIRMED',
        keyword: '住客A',
        checkInStartDate: '2026-02-15',
        checkInEndDate: '2026-02-16',
      })
    })
  })

  it('blocks order list reload when the check-in date range is invalid', async () => {
    const user = userEvent.setup()

    renderOrderManagementPage()

    expect(await screen.findByText('SF2026031110301234')).toBeInTheDocument()
    expect(fetchAdminOrders).toHaveBeenCalledTimes(1)

    await user.type(screen.getByPlaceholderText('入住开始日期'), '2026-02-18')
    await waitFor(() => {
      expect(fetchAdminOrders).toHaveBeenLastCalledWith({
        status: undefined,
        keyword: '',
        checkInStartDate: '2026-02-18',
        checkInEndDate: '',
      })
    })
    const validStartDateCallCount = vi.mocked(fetchAdminOrders).mock.calls.length

    await user.type(screen.getByPlaceholderText('入住结束日期'), '2026-02-16')

    expect(await screen.findByText('入住开始日期不能晚于结束日期')).toBeInTheDocument()
    expect(fetchAdminOrders).toHaveBeenCalledTimes(validStartDateCallCount)
  })

  it('submits a direct reschedule action successfully from the drawer', async () => {
    const user = userEvent.setup()

    renderOrderManagementPage()

    expect(await screen.findByText('后台售后住客A')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '后台改期' })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('新的入住日期'))
    await user.type(screen.getByLabelText('新的入住日期'), '2026-02-18')
    await user.clear(screen.getByLabelText('新的退房日期'))
    await user.type(screen.getByLabelText('新的退房日期'), '2026-02-19')
    await user.type(screen.getByPlaceholderText('请输入后台改期原因，例如：客户协调档期、房型升级改约'), '客户协调档期')
    await user.click(screen.getByRole('button', { name: '提交改期' }))

    await waitFor(() => {
      expect(rescheduleAdminOrder).toHaveBeenCalledWith('order-1', {
        checkInDate: '2026-02-18',
        checkOutDate: '2026-02-19',
        reason: '客户协调档期',
      })
    })
    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('订单已改期')
    })
  })

  it('approves a pending after-sale request from the drawer', async () => {
    const user = userEvent.setup()

    vi.mocked(fetchAdminOrders).mockResolvedValue([
      buildOrder({
        latestAfterSaleRequestId: 11,
        latestAfterSaleType: 'REFUND',
        latestAfterSaleStatus: 'REQUESTED',
        latestAfterSaleStatusLabel: '处理中',
        afterSaleReason: '用户申请退款',
      }),
    ])
    vi.mocked(fetchAdminOrderDetail).mockResolvedValue(
      buildOrder({
        latestAfterSaleRequestId: 11,
        latestAfterSaleType: 'REFUND',
        latestAfterSaleStatus: 'REQUESTED',
        latestAfterSaleStatusLabel: '处理中',
        afterSaleReason: '用户申请退款',
      }),
    )

    renderOrderManagementPage()

    expect(await screen.findByText('后台售后住客A')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '审核申请' })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '同意申请' }))

    await waitFor(() => {
      expect(approveAdminAfterSaleRequest).toHaveBeenCalledWith('order-1', 11)
    })
    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('售后申请已同意')
    })
  })

  it('rejects a pending after-sale request with an operator reason', async () => {
    const user = userEvent.setup()

    vi.mocked(fetchAdminOrders).mockResolvedValue([
      buildOrder({
        latestAfterSaleRequestId: 11,
        latestAfterSaleType: 'REFUND',
        latestAfterSaleStatus: 'REQUESTED',
        latestAfterSaleStatusLabel: '处理中',
        afterSaleReason: '用户申请退款',
      }),
    ])
    vi.mocked(fetchAdminOrderDetail).mockResolvedValue(
      buildOrder({
        latestAfterSaleRequestId: 11,
        latestAfterSaleType: 'REFUND',
        latestAfterSaleStatus: 'REQUESTED',
        latestAfterSaleStatusLabel: '处理中',
        afterSaleReason: '用户申请退款',
      }),
    )

    renderOrderManagementPage()

    expect(await screen.findByText('后台售后住客A')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '审核申请' })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('请输入拒绝原因，例如：房态已锁满、已过可退款时限'), '房态已锁满')
    await user.click(screen.getByRole('button', { name: '拒绝申请' }))

    await waitFor(() => {
      expect(rejectAdminAfterSaleRequest).toHaveBeenCalledWith('order-1', 11, {
        rejectReason: '房态已锁满',
      })
    })
    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('售后申请已拒绝')
    })
  })

  it('handles check-in, check-out and no-show actions from the detail drawer', async () => {
    const user = userEvent.setup()

    renderOrderManagementPage()

    expect(await screen.findByText('后台售后住客A')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '办理入住' })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '办理入住' }).at(-1) as HTMLElement)

    await waitFor(() => {
      expect(checkInAdminOrder).toHaveBeenCalledWith('order-1')
    })
    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('已办理入住')
    })

    vi.mocked(fetchAdminOrders).mockResolvedValue([
      buildOrder({
        status: 'CHECKED_IN',
        statusLabel: '已入住',
        bookingStatus: 'CHECKED_IN',
        bookingStatusLabel: '已入住',
        checkedInAt: '2026-03-13T15:00:00+08:00',
      }),
    ])
    vi.mocked(fetchAdminOrderDetail).mockResolvedValue(
      buildOrder({
        status: 'CHECKED_IN',
        statusLabel: '已入住',
        bookingStatus: 'CHECKED_IN',
        bookingStatusLabel: '已入住',
        checkedInAt: '2026-03-13T15:00:00+08:00',
      }),
    )

    cleanup()
    renderOrderManagementPage()

    expect(await screen.findByText('后台售后住客A')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '办理离店' })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '办理离店' }).at(-1) as HTMLElement)

    await waitFor(() => {
      expect(checkOutAdminOrder).toHaveBeenCalledWith('order-1')
    })
    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('已办理离店')
    })

    vi.mocked(fetchAdminOrders).mockResolvedValue([
      buildOrder({
        latestAfterSaleRequestId: null,
        latestAfterSaleStatus: '',
      }),
    ])
    vi.mocked(fetchAdminOrderDetail).mockResolvedValue(
      buildOrder({
        latestAfterSaleRequestId: null,
        latestAfterSaleStatus: '',
      }),
    )

    cleanup()
    renderOrderManagementPage()

    expect(await screen.findByText('后台售后住客A')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '标记失约' })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '标记失约' }).at(-1) as HTMLElement)

    await waitFor(() => {
      expect(noShowAdminOrder).toHaveBeenCalledWith('order-1')
    })
    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('订单已标记失约')
    })
  })

  it('retries a failed refund from the detail drawer', async () => {
    const user = userEvent.setup()

    const failedRefundOrder = buildOrder({
      latestRefundRecordId: 27,
      latestRefundStatus: 'FAILED',
      latestRefundFailureCode: 'SYSTEM_ERROR',
      latestRefundFailureMessage: '微信侧临时失败',
      latestRefundAmount: 488,
    })
    vi.mocked(fetchAdminOrders).mockResolvedValue([failedRefundOrder])
    vi.mocked(fetchAdminOrderDetail).mockResolvedValue(failedRefundOrder)

    renderOrderManagementPage()

    expect(await screen.findByText('后台售后住客A')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '重试退款' })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '重试退款' }).at(-1) as HTMLElement)

    await waitFor(() => {
      expect(retryAdminRefund).toHaveBeenCalledWith('order-1', 27)
    })
    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('退款已重新发起')
    })
  })

  it('shows backend feedback when direct refund fails', async () => {
    const user = userEvent.setup()

    vi.mocked(refundAdminOrder).mockRejectedValueOnce(new Error('当前订单状态不可退款'))

    renderOrderManagementPage()

    expect(await screen.findByText('后台售后住客A')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '后台退款' })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('请输入退款原因，例如：客户临时取消、异常天气关闭房态'), '客户临时取消')
    await user.click(screen.getByRole('button', { name: '提交退款' }))

    expect(await screen.findByText('当前订单状态不可退款')).toBeInTheDocument()
    await waitFor(() => {
      expect(messageError).toHaveBeenCalledWith('当前订单状态不可退款')
    })
  })
})
