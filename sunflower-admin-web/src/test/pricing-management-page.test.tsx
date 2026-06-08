import { type ChangeEvent, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchAdminRooms,
  type AdminRoom,
} from '@/features/rooms/admin-room-service'
import {
  fetchRoomCalendar,
  updateAdminRoomInventory,
  updateAdminRoomPrices,
  type RoomCalendarItem,
} from '@/features/rooms/admin-room-pricing-service'
import { PricingManagementPage } from '@/pages/pricing-management-page'

const RealDate = Date
const { messageSuccess, messageError } = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageError: vi.fn(),
}))

vi.mock('@/app/admin-components', () => {
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

  function InputNumber({
    onChange,
    placeholder,
    value,
  }: {
    onChange?: (value: number | string) => void
    placeholder?: string
    value?: number | string
  }) {
    return (
      <input
        placeholder={placeholder}
        type="number"
        value={value ?? ''}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const nextValue = event.target.value
          onChange?.(nextValue === '' ? '' : Number(nextValue))
        }}
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
            <tr key={String(row.id ?? row.date ?? rowIndex)}>
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

  return {
    Button,
    Card,
    Input,
    InputNumber,
    MessagePlugin: {
      success: messageSuccess,
      error: messageError,
    },
    Select,
    Space,
    Table,
    Tag,
  }
})

vi.mock('@/features/rooms/admin-room-service', () => ({
  fetchAdminRooms: vi.fn(),
  getAdminRoomErrorMessage: vi.fn((error: unknown, fallback?: string) =>
    error instanceof Error ? error.message : fallback || '房型操作失败，请稍后重试',
  ),
}))

vi.mock('@/features/rooms/admin-room-pricing-service', () => ({
  fetchRoomCalendar: vi.fn(),
  getAdminRoomPricingErrorMessage: vi.fn((error: unknown, fallback?: string) =>
    error instanceof Error ? error.message : fallback || '价格库存操作失败，请稍后重试',
  ),
  getRoomCalendarErrorMessage: vi.fn((error: unknown, fallback?: string) =>
    error instanceof Error ? error.message : fallback || '价格日历加载失败，请稍后重试',
  ),
  updateAdminRoomInventory: vi.fn(),
  updateAdminRoomPrices: vi.fn(),
}))

function buildRoom(overrides: Partial<AdminRoom> = {}): AdminRoom {
  return {
    id: 'room-lake-101',
    name: '270° 湖景大床房',
    subtitle: '落地窗 + 湖景露台',
    cover: '/images/rooms/lake-101.png',
    capacity: 2,
    area: 46,
    bedType: '1.8m 大床',
    scenicType: '湖景',
    tags: ['爆款', '含早餐'],
    basePrice: 488,
    breakfast: '含双早',
    intro: '适合情侣和闺蜜度假，带湖景露台。',
    amenities: ['空调', '投影'],
    rules: ['14:00 后入住'],
    canCancelBeforeHours: 24,
    status: 'ACTIVE',
    ...overrides,
  }
}

function buildCalendar(): RoomCalendarItem[] {
  return [
    { date: '2026-03-13', weekdayLabel: '周五', price: 488, stock: 3 },
    { date: '2026-03-14', weekdayLabel: '周六', price: 588, stock: 2 },
    { date: '2026-03-15', weekdayLabel: '周日', price: 618, stock: 1 },
  ]
}

function buildNextMonthCalendar(): RoomCalendarItem[] {
  return [
    { date: '2026-04-03', weekdayLabel: '周五', price: 518, stock: 4 },
    { date: '2026-04-04', weekdayLabel: '周六', price: 618, stock: 2 },
    { date: '2026-04-05', weekdayLabel: '周日', price: 638, stock: 1 },
  ]
}

function renderPricingManagementPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <PricingManagementPage />
    </QueryClientProvider>,
  )
}

describe('pricing management page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    cleanup()
  })

  beforeEach(() => {
    class MockDate extends RealDate {
      constructor(value?: string | number | Date) {
        if (value === undefined) {
          super('2026-03-13T08:00:00Z')
          return
        }

        super(value)
      }

      static now() {
        return new RealDate('2026-03-13T08:00:00Z').getTime()
      }

      static parse = RealDate.parse
      static UTC = RealDate.UTC
    }

    vi.stubGlobal('Date', MockDate)
    vi.clearAllMocks()
    vi.mocked(fetchAdminRooms).mockResolvedValue([buildRoom()])
    vi.mocked(fetchRoomCalendar).mockImplementation(async (_roomId, request) => {
      if (request.startDate === '2026-04-01') {
        return buildNextMonthCalendar()
      }

      return buildCalendar()
    })
    vi.mocked(updateAdminRoomPrices).mockResolvedValue({
      roomId: 'room-lake-101',
      updatedCount: 2,
      items: [
        { date: '2026-03-14', price: 699, source: 'MANUAL' },
        { date: '2026-03-15', price: 699, source: 'MANUAL' },
      ],
    })
    vi.mocked(updateAdminRoomInventory).mockResolvedValue({
      roomId: 'room-lake-101',
      updatedCount: 1,
      items: [
        { date: '2026-03-13', totalStock: 5, availableStock: 4, lockedStock: 1 },
      ],
    })
  })

  it('supports booking-style range selection and publishing updates from the pricing page', async () => {
    const user = userEvent.setup()

    renderPricingManagementPage()

    expect(await screen.findByText('价格库存日历')).toBeInTheDocument()
    await waitFor(() =>
      expect(fetchRoomCalendar).toHaveBeenCalledWith('room-lake-101', {
        startDate: '2026-03-01',
        days: 31,
      }),
    )
    expect(await screen.findByText('周一')).toBeInTheDocument()
    expect(screen.getByText('周日')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: '选择 2026-03-14 周六' }))
    await user.click(screen.getByRole('button', { name: '选择 2026-03-15 周日' }))

    expect(screen.getByText('2026-03-14 至 2026-03-15，共 2 天')).toBeInTheDocument()

    const [priceInput, inventoryInput] = screen.getAllByRole('spinbutton')
    await user.clear(priceInput)
    await user.type(priceInput, '699')
    await user.click(screen.getByRole('button', { name: '更新价格' }))

    await waitFor(() =>
      expect(updateAdminRoomPrices).toHaveBeenCalledWith({
        roomId: 'room-lake-101',
        items: [
          { date: '2026-03-14', price: 699, source: 'MANUAL' },
          { date: '2026-03-15', price: 699, source: 'MANUAL' },
        ],
      }, expect.objectContaining({ client: expect.any(Object) })),
    )
    expect(await screen.findByText('价格更新 2 天')).toBeInTheDocument()
    expect(messageSuccess).toHaveBeenCalledWith('价格已更新 2 天')

    await user.click(screen.getByRole('button', { name: '单日调价' }))
    expect(screen.getByText('2026-03-13，共 1 天')).toBeInTheDocument()
    await user.clear(inventoryInput)
    await user.type(inventoryInput, '5')
    await user.click(screen.getByRole('button', { name: '更新库存' }))

    await waitFor(() =>
      expect(updateAdminRoomInventory).toHaveBeenCalledWith({
        roomId: 'room-lake-101',
        items: [
          { date: '2026-03-13', totalStock: 5 },
        ],
      }, expect.objectContaining({ client: expect.any(Object) })),
    )
    expect(await screen.findByText('库存更新 1 天')).toBeInTheDocument()
    expect(screen.getByText('总 5 / 可售 4')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '下个月' }))
    await waitFor(() =>
      expect(fetchRoomCalendar).toHaveBeenLastCalledWith('room-lake-101', {
        startDate: '2026-04-01',
        days: 30,
      }),
    )
    expect(await screen.findByRole('button', { name: '选择 2026-04-03 周五' })).toBeInTheDocument()
  })
})
