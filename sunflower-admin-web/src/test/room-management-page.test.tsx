import { type ChangeEvent, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAdminRoom,
  fetchAdminRooms,
  getAdminRoomErrorMessage,
  updateAdminRoom,
  type AdminRoom,
} from '@/features/rooms/admin-room-service'
import { RoomManagementPage } from '@/pages/room-management-page'

vi.mock('@/app/admin-components', () => {
  const MessagePlugin = {
    success: vi.fn(),
    error: vi.fn(),
  }

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

  function Dialog({
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

  function Input({
    onChange,
    placeholder,
    tips,
    type = 'text',
    value,
  }: {
    onChange?: (value: string) => void
    placeholder?: string
    tips?: ReactNode
    type?: string
    value?: string
  }) {
    return (
      <div>
        <input
          placeholder={placeholder}
          type={type}
          value={value ?? ''}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)}
        />
        {tips ? <span>{tips}</span> : null}
      </div>
    )
  }

  function InputNumber({
    onChange,
    tips,
    value,
  }: {
    onChange?: (value: number | string) => void
    tips?: ReactNode
    value?: number | string
  }) {
    return (
      <div>
        <input
          type="number"
          value={value ?? ''}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const nextValue = event.target.value
            onChange?.(nextValue === '' ? '' : Number(nextValue))
          }}
        />
        {tips ? <span>{tips}</span> : null}
      </div>
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
    tips,
    value,
  }: {
    onChange?: (value: string) => void
    placeholder?: string
    tips?: ReactNode
    value?: string
  }) {
    return (
      <div>
        <textarea
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value)}
        />
        {tips ? <span>{tips}</span> : null}
      </div>
    )
  }

  return {
    Button,
    Card,
    Dialog,
    Input,
    InputNumber,
    MessagePlugin,
    Select,
    Space,
    Table,
    Tag,
    Textarea,
  }
})

vi.mock('@/features/rooms/admin-room-service', () => ({
  createAdminRoom: vi.fn(),
  fetchAdminRooms: vi.fn(),
  getAdminRoomErrorMessage: vi.fn((error: unknown, fallback?: string) =>
    error instanceof Error ? error.message : fallback || '房型操作失败，请稍后重试',
  ),
  updateAdminRoom: vi.fn(),
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

function renderRoomManagementPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RoomManagementPage />
    </QueryClientProvider>,
  )
}

async function fillRoomEditorForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('例如：270° 湖景家庭套房'), '云顶湖景套房')
  await user.type(screen.getByPlaceholderText('例如：露台泡池 | 可住 4 人'), '露台泡池 | 可住 4 人')
  await user.type(screen.getByPlaceholderText('/images/rooms/lake-101.png'), '/assets/admin-room-cover.png')
  await user.clear(screen.getAllByRole('spinbutton')[0])
  await user.type(screen.getAllByRole('spinbutton')[0], '4')
  await user.clear(screen.getAllByRole('spinbutton')[1])
  await user.type(screen.getAllByRole('spinbutton')[1], '68')
  await user.type(screen.getByPlaceholderText('例如：1.8m 大床 + 沙发床'), '2m 大床 + 1.2m 沙发床')
  await user.type(screen.getByPlaceholderText('例如：湖景'), '湖景')
  await user.clear(screen.getAllByRole('spinbutton')[2])
  await user.type(screen.getAllByRole('spinbutton')[2], '688')
  await user.type(screen.getByPlaceholderText('例如：含双早'), '含 4 份早餐')
  await user.clear(screen.getAllByRole('spinbutton')[3])
  await user.type(screen.getAllByRole('spinbutton')[3], '24')
  await user.type(screen.getByPlaceholderText('描述房型适合的人群和核心卖点'), '顶层景观套房，适合家庭和小团体入住。')
  await user.type(screen.getByPlaceholderText('支持逗号或换行分隔，例如：湖景房, 家庭出游'), '新上架\n家庭出游')
  await user.type(screen.getByPlaceholderText('支持逗号或换行分隔，例如：投影, 露台浴缸'), '空调\n投影\n露台浴缸')
  await user.type(screen.getByPlaceholderText('支持逗号或换行分隔，例如：14:00 后入住'), '14:00 后入住\n12:00 前退房')
}

describe('room management page', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAdminRooms).mockResolvedValue([])
    vi.mocked(createAdminRoom).mockResolvedValue(buildRoom())
    vi.mocked(updateAdminRoom).mockResolvedValue(buildRoom())
  })

  it('renders room list after loading succeeds', async () => {
    vi.mocked(fetchAdminRooms).mockResolvedValue([buildRoom()])

    renderRoomManagementPage()

    expect(await screen.findByText('270° 湖景大床房')).toBeInTheDocument()
    expect(screen.getAllByText('上架中').length).toBeGreaterThan(0)
  })

  it('shows error feedback when list loading fails', async () => {
    vi.mocked(fetchAdminRooms).mockRejectedValue(new Error('接口暂不可用'))

    renderRoomManagementPage()

    expect(await screen.findByText('房型列表加载失败')).toBeInTheDocument()
    expect(screen.getByText('接口暂不可用')).toBeInTheDocument()
    expect(getAdminRoomErrorMessage).toHaveBeenCalled()
  })

  it('validates required fields before creating a room', async () => {
    const user = userEvent.setup()

    renderRoomManagementPage()
    await waitFor(() => expect(fetchAdminRooms).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: '新建房型' }))
    await user.click(screen.getByRole('button', { name: '保存房型' }))

    expect(await screen.findByText('请输入房型名称')).toBeInTheDocument()
    expect(createAdminRoom).not.toHaveBeenCalled()
  })

  it('creates a room successfully with normalized payload', async () => {
    const user = userEvent.setup()

    renderRoomManagementPage()
    await waitFor(() => expect(fetchAdminRooms).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: '新建房型' }))
    await fillRoomEditorForm(user)
    await user.click(screen.getByRole('button', { name: '保存房型' }))

    await waitFor(() =>
      expect(createAdminRoom).toHaveBeenCalledWith({
        name: '云顶湖景套房',
        subtitle: '露台泡池 | 可住 4 人',
        cover: '/assets/admin-room-cover.png',
        capacity: 4,
        area: 68,
        bedType: '2m 大床 + 1.2m 沙发床',
        scenicType: '湖景',
        tags: ['新上架', '家庭出游'],
        basePrice: 688,
        breakfast: '含 4 份早餐',
        intro: '顶层景观套房，适合家庭和小团体入住。',
        amenities: ['空调', '投影', '露台浴缸'],
        rules: ['14:00 后入住', '12:00 前退房'],
        canCancelBeforeHours: 24,
        status: 'ACTIVE',
      }),
    )
  })

  it('shows save error feedback when updating a room fails', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchAdminRooms).mockResolvedValue([buildRoom()])
    vi.mocked(updateAdminRoom).mockRejectedValue(new Error('保存失败'))

    renderRoomManagementPage()
    expect(await screen.findByText('270° 湖景大床房')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByPlaceholderText('例如：270° 湖景家庭套房'))
    await user.type(screen.getByPlaceholderText('例如：270° 湖景家庭套房'), '云顶湖景家庭套房')
    await user.click(screen.getByRole('button', { name: '保存房型' }))

    await waitFor(() =>
      expect(updateAdminRoom).toHaveBeenCalledWith(
        'room-lake-101',
        expect.objectContaining({
          name: '云顶湖景家庭套房',
        }),
      ),
    )
    expect(getAdminRoomErrorMessage).toHaveBeenCalled()
  })
})
