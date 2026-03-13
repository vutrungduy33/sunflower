import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  InputNumber,
  MessagePlugin,
  Select,
  Space,
  Tag,
} from 'tdesign-react'
import {
  fetchAdminRooms,
  getAdminRoomErrorMessage,
  type AdminRoom,
} from '@/features/rooms/admin-room-service'
import {
  fetchRoomCalendar,
  getAdminRoomPricingErrorMessage,
  getRoomCalendarErrorMessage,
  updateAdminRoomInventory,
  updateAdminRoomPrices,
  type AdminRoomInventoryBatchResponse,
  type AdminRoomPriceBatchResponse,
  type AdminRoomPriceSource,
  type RoomCalendarItem,
} from '@/features/rooms/admin-room-pricing-service'
import {
  buildInventoryBatchItems,
  buildPriceBatchItems,
  describeBatchDateRange,
  normalizeDateRange,
  resolveBatchDateRange,
  resolveQuickPresetDates,
  shiftDateText,
  type PricingQuickPreset,
} from '@/features/rooms/pricing-batch-utils'

const ROOM_LIST_QUERY_KEY = ['admin-rooms']
const weekendLabelSet = new Set(['周五', '周六', '周日'])

const roomStatusLabelMap = {
  ACTIVE: '上架中',
  INACTIVE: '已下架',
} as const

const calendarWindowOptions = [
  { label: '7 天视图', value: '7' },
  { label: '14 天视图', value: '14' },
  { label: '30 天视图', value: '30' },
]

const quickPresetOptions: Array<{ label: string; value: PricingQuickPreset }> = [
  { label: '单日调价', value: 'SINGLE_DAY' },
  { label: '未来 3 天', value: 'NEXT_3_DAYS' },
  { label: '未来 7 天', value: 'NEXT_7_DAYS' },
  { label: '周末连住', value: 'WEEKEND' },
]

const priceSourceOptions: Array<{ label: string; value: AdminRoomPriceSource }> = [
  { label: '人工调价', value: 'MANUAL' },
  { label: '工作日策略', value: 'WEEKDAY' },
  { label: '周末策略', value: 'WEEKEND' },
  { label: '节假日策略', value: 'HOLIDAY' },
]

function createTodayDateText() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toPositiveNumber(value: number | string) {
  const nextValue = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : undefined
}

function toNonNegativeNumber(value: number | string) {
  const nextValue = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : undefined
}

function renderRoomStatus(room?: AdminRoom) {
  if (!room) {
    return null
  }

  return (
    <Tag
      theme={room.status === 'ACTIVE' ? 'success' : 'warning'}
      variant="light-outline"
    >
      {roomStatusLabelMap[room.status]}
    </Tag>
  )
}

function describeWindow(calendar: RoomCalendarItem[]) {
  if (!calendar.length) {
    return '当前窗口暂无日期'
  }

  return `${calendar[0].date} 至 ${calendar[calendar.length - 1].date}`
}

function describePriceDelta(basePrice: number, price: number) {
  const delta = price - basePrice
  if (delta === 0) {
    return '与基础价一致'
  }

  return delta > 0 ? `较基础价 +¥${delta}` : `较基础价 -¥${Math.abs(delta)}`
}

export function PricingManagementPage() {
  const queryClient = useQueryClient()
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [calendarStartDate, setCalendarStartDate] = useState(createTodayDateText)
  const [calendarDays, setCalendarDays] = useState(14)
  const [batchStartDate, setBatchStartDate] = useState('')
  const [batchEndDate, setBatchEndDate] = useState('')
  const [rangeAnchorDate, setRangeAnchorDate] = useState('')
  const [draftPrice, setDraftPrice] = useState<number | undefined>()
  const [draftInventory, setDraftInventory] = useState<number | undefined>()
  const [priceSource, setPriceSource] = useState<AdminRoomPriceSource>('MANUAL')
  const [operationError, setOperationError] = useState<string | null>(null)
  const [lastPriceResult, setLastPriceResult] = useState<AdminRoomPriceBatchResponse | null>(null)
  const [lastInventoryResult, setLastInventoryResult] = useState<AdminRoomInventoryBatchResponse | null>(null)

  const roomListQuery = useQuery({
    queryKey: ROOM_LIST_QUERY_KEY,
    queryFn: fetchAdminRooms,
  })

  const rooms = roomListQuery.data ?? []
  const effectiveSelectedRoomId =
    selectedRoomId && rooms.some((room) => room.id === selectedRoomId)
      ? selectedRoomId
      : (rooms[0]?.id ?? '')
  const selectedRoom = rooms.find((room) => room.id === effectiveSelectedRoomId)

  const roomCalendarQuery = useQuery({
    queryKey: ['room-calendar', effectiveSelectedRoomId, calendarStartDate, calendarDays],
    queryFn: () =>
      fetchRoomCalendar(effectiveSelectedRoomId, {
        startDate: calendarStartDate,
        days: calendarDays,
      }),
    enabled: Boolean(effectiveSelectedRoomId),
  })

  const priceMutation = useMutation({
    mutationFn: updateAdminRoomPrices,
    onSuccess: async (result) => {
      setOperationError(null)
      setLastPriceResult(result)
      await queryClient.invalidateQueries({ queryKey: ['room-calendar', result.roomId] })
      MessagePlugin.success(`价格已更新 ${result.updatedCount} 天`)
    },
    onError: (error) => {
      const message = getAdminRoomPricingErrorMessage(error, '价格更新失败，请稍后重试')
      setOperationError(message)
      MessagePlugin.error(message)
    },
  })

  const inventoryMutation = useMutation({
    mutationFn: updateAdminRoomInventory,
    onSuccess: async (result) => {
      setOperationError(null)
      setLastInventoryResult(result)
      await queryClient.invalidateQueries({ queryKey: ['room-calendar', result.roomId] })
      MessagePlugin.success(`库存已更新 ${result.updatedCount} 天`)
    },
    onError: (error) => {
      const message = getAdminRoomPricingErrorMessage(error, '库存更新失败，请稍后重试')
      setOperationError(message)
      MessagePlugin.error(message)
    },
  })

  const calendar = roomCalendarQuery.data ?? []
  const batchDates = resolveBatchDateRange(calendar, batchStartDate, batchEndDate)
  const batchSummary = describeBatchDateRange(batchDates)
  const latestUpdatedCount = lastInventoryResult?.updatedCount ?? lastPriceResult?.updatedCount ?? 0
  const selectedCalendarItems = calendar.filter((item) => batchDates.includes(item.date))
  const selectedAveragePrice = selectedCalendarItems.length
    ? Math.round(
        selectedCalendarItems.reduce((sum, item) => sum + item.price, 0) / selectedCalendarItems.length,
      )
    : 0
  const selectedLowestStock = selectedCalendarItems.length
    ? Math.min(...selectedCalendarItems.map((item) => item.stock))
    : 0
  const selectionHint = rangeAnchorDate
    ? `已选起点 ${rangeAnchorDate}，请再点一个结束日期`
    : '先点开始日期，再点结束日期；也可以直接使用快捷区间'

  function clearFeedback() {
    setLastPriceResult(null)
    setLastInventoryResult(null)
    setOperationError(null)
  }

  function clearSelection() {
    setBatchStartDate('')
    setBatchEndDate('')
    setRangeAnchorDate('')
  }

  function resetInteractiveState() {
    clearSelection()
    clearFeedback()
  }

  function handleRoomChange(roomId: string) {
    setSelectedRoomId(roomId)
    resetInteractiveState()
  }

  function handleCalendarWindowChange(days: number) {
    setCalendarDays(days)
    resetInteractiveState()
  }

  function handleShiftWindow(direction: -1 | 1) {
    setCalendarStartDate((current) => shiftDateText(current, direction * calendarDays))
    resetInteractiveState()
  }

  function handleJumpToToday() {
    setCalendarStartDate(createTodayDateText())
    resetInteractiveState()
  }

  function handleCalendarDayClick(date: string) {
    clearFeedback()

    if (!rangeAnchorDate) {
      setRangeAnchorDate(date)
      setBatchStartDate(date)
      setBatchEndDate(date)
      return
    }

    const [startDate, endDate] = normalizeDateRange(rangeAnchorDate, date)
    setBatchStartDate(startDate)
    setBatchEndDate(endDate)
    setRangeAnchorDate('')
  }

  function handleQuickPreset(preset: PricingQuickPreset) {
    const dates = resolveQuickPresetDates(calendar, preset)
    if (!dates.length) {
      return
    }

    clearFeedback()
    setRangeAnchorDate('')
    setBatchStartDate(dates[0])
    setBatchEndDate(dates[dates.length - 1])
  }

  function handleValidationError(message: string) {
    setOperationError(message)
    MessagePlugin.error(message)
  }

  function handlePriceSubmit() {
    if (!effectiveSelectedRoomId) {
      handleValidationError('请先选择房型')
      return
    }
    if (!batchDates.length) {
      handleValidationError('请先在日历中选择有效日期范围')
      return
    }
    if (typeof draftPrice !== 'number') {
      handleValidationError('请输入大于 0 的价格')
      return
    }

    priceMutation.mutate({
      roomId: effectiveSelectedRoomId,
      items: buildPriceBatchItems(batchDates, draftPrice, priceSource),
    })
  }

  function handleInventorySubmit() {
    if (!effectiveSelectedRoomId) {
      handleValidationError('请先选择房型')
      return
    }
    if (!batchDates.length) {
      handleValidationError('请先在日历中选择有效日期范围')
      return
    }
    if (typeof draftInventory !== 'number') {
      handleValidationError('请输入大于等于 0 的库存')
      return
    }

    inventoryMutation.mutate({
      roomId: effectiveSelectedRoomId,
      items: buildInventoryBatchItems(batchDates, draftInventory),
    })
  }

  if (roomListQuery.isError) {
    return (
      <div className="page-stack">
        <Card className="panel-card room-feedback-card">
          <div className="room-feedback-card__content">
            <Tag theme="danger" variant="light-outline">
              房型加载失败
            </Tag>
            <h3>无法初始化价格库存页面</h3>
            <p>{getAdminRoomErrorMessage(roomListQuery.error, '请确认管理端房型接口可用')}</p>
            <Button theme="primary" onClick={() => void roomListQuery.refetch()}>
              重新加载
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!roomListQuery.isPending && !rooms.length) {
    return (
      <div className="page-stack">
        <Card className="panel-card room-feedback-card">
          <div className="room-feedback-card__content">
            <Tag theme="warning" variant="light-outline">
              暂无房型
            </Tag>
            <h3>请先创建可维护的房型</h3>
            <p>当前管理端还没有房型数据，完成 S11 房型创建后即可在这里批量维护价格与库存。</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-panel pricing-hero">
        <div className="hero-panel__copy">
          <Space align="center" size={12}>
            <Tag theme="success" variant="light-outline">
              S12 价格日历与库存
            </Tag>
            {renderRoomStatus(selectedRoom)}
          </Space>
          <h3>像主流预订网站一样，直接在日历上选范围</h3>
          <p>
            价格库存页已升级为可点击日历卡片、快捷区间和窗口切换交互，运营不再需要先通过下拉框拼出开始/结束日期。
          </p>
        </div>
        <div className="room-stat-grid">
          <article className="room-stat-card">
            <small>当前房型</small>
            <strong>{selectedRoom?.name ?? (roomListQuery.isPending ? '加载中' : '未选择')}</strong>
          </article>
          <article className="room-stat-card">
            <small>可见窗口</small>
            <strong>{calendar.length}</strong>
          </article>
          <article className="room-stat-card">
            <small>最近一次发布</small>
            <strong>{latestUpdatedCount}</strong>
          </article>
        </div>
      </section>

      <Card className="panel-card pricing-toolbar-card">
        <div className="pricing-toolbar">
          <label className="room-field">
            <span className="room-field__label">房型</span>
            <Select
              value={effectiveSelectedRoomId}
              options={rooms.map((room) => ({
                label: `${room.name} · ¥${room.basePrice}`,
                value: room.id,
              }))}
              onChange={(value) => handleRoomChange(String(value))}
            />
          </label>

          <label className="room-field">
            <span className="room-field__label">窗口范围</span>
            <Select
              value={String(calendarDays)}
              options={calendarWindowOptions}
              onChange={(value) => handleCalendarWindowChange(Number(value))}
            />
          </label>

          <article className="pricing-window-panel">
            <small>当前可见窗口</small>
            <strong>{describeWindow(calendar)}</strong>
            <span>{selectionHint}</span>
          </article>

          <div className="pricing-toolbar__actions">
            <Button variant="outline" onClick={() => handleShiftWindow(-1)}>
              上一段
            </Button>
            <Button variant="outline" onClick={handleJumpToToday}>
              回到今天
            </Button>
            <Button variant="outline" onClick={() => handleShiftWindow(1)}>
              下一段
            </Button>
            <Button
              variant="outline"
              loading={roomListQuery.isFetching || roomCalendarQuery.isFetching}
              onClick={() => {
                resetInteractiveState()
                void roomListQuery.refetch()
                if (effectiveSelectedRoomId) {
                  void roomCalendarQuery.refetch()
                }
              }}
            >
              刷新日历
            </Button>
          </div>
        </div>
      </Card>

      {roomCalendarQuery.isError ? (
        <Card className="panel-card room-feedback-card">
          <div className="room-feedback-card__content">
            <Tag theme="danger" variant="light-outline">
              日历加载失败
            </Tag>
            <h3>价格日历加载失败</h3>
            <p>{getRoomCalendarErrorMessage(roomCalendarQuery.error)}</p>
            <Button theme="primary" onClick={() => void roomCalendarQuery.refetch()}>
              重新加载
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="panel-card pricing-calendar-card">
          <div className="room-table-card__header">
            <div>
              <h3>价格库存日历</h3>
              <p>参考热门预订站的区间选择体验，支持点击日期卡片选范围、快速套用常见运营区间。</p>
            </div>
            <Tag theme="warning" variant="light-outline">
              公共日历读取 + S7 批量写入
            </Tag>
          </div>

          <div className="pricing-calendar-card__toolbar">
            <div className="pricing-calendar-card__hint">
              <Tag theme={rangeAnchorDate ? 'primary' : 'success'} variant="light-outline">
                {rangeAnchorDate ? '等待结束日期' : '点击日历即可选范围'}
              </Tag>
              <p>{selectionHint}</p>
            </div>

            <div className="pricing-quick-actions">
              {quickPresetOptions.map((option) => (
                <Button
                  key={option.value}
                  size="small"
                  theme="primary"
                  variant="outline"
                  onClick={() => handleQuickPreset(option.value)}
                >
                  {option.label}
                </Button>
              ))}
              <Button size="small" theme="danger" variant="text" onClick={clearSelection}>
                清空选择
              </Button>
            </div>
          </div>

          {roomCalendarQuery.isPending ? (
            <div className="room-table__empty">价格库存日历加载中。</div>
          ) : calendar.length ? (
            <div className="pricing-calendar-grid">
              {calendar.map((item) => {
                const isSelected = batchDates.includes(item.date)
                const isBoundary = item.date === batchStartDate || item.date === batchEndDate
                const isAnchor = item.date === rangeAnchorDate
                const isWeekend = weekendLabelSet.has(item.weekdayLabel)
                const isLowStock = item.stock <= 1
                const cardClassName = [
                  'pricing-day-card',
                  isSelected ? 'pricing-day-card--selected' : '',
                  isBoundary ? 'pricing-day-card--boundary' : '',
                  isAnchor ? 'pricing-day-card--anchor' : '',
                  isWeekend ? 'pricing-day-card--weekend' : '',
                  isLowStock ? 'pricing-day-card--low-stock' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <button
                    key={item.date}
                    type="button"
                    className={cardClassName}
                    aria-label={`选择 ${item.date} ${item.weekdayLabel}`}
                    onClick={() => handleCalendarDayClick(item.date)}
                  >
                    <div className="pricing-day-card__head">
                      <div>
                        <strong>{item.date.slice(5)}</strong>
                        <span>{item.weekdayLabel}</span>
                      </div>
                      {isBoundary ? (
                        <span className="pricing-day-card__badge">
                          {item.date === batchStartDate ? '开始' : '结束'}
                        </span>
                      ) : isAnchor ? (
                        <span className="pricing-day-card__badge">起点</span>
                      ) : null}
                    </div>

                    <div className="pricing-day-card__price">
                      <strong>¥{item.price}</strong>
                      <span>{describePriceDelta(selectedRoom?.basePrice ?? item.price, item.price)}</span>
                    </div>

                    <div className="pricing-day-card__stock">
                      <span>{item.stock} 间可售</span>
                      <small>{isLowStock ? '库存紧张' : isWeekend ? '周末需求高' : '可正常售卖'}</small>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="room-table__empty">当前窗口内暂无可展示的价格库存数据。</div>
          )}
        </Card>
      )}

      <Card className="panel-card pricing-editor-card">
        <div className="pricing-editor-card__header">
          <div>
            <h3>批量发布</h3>
            <p>{batchSummary}</p>
          </div>
          {selectedRoom ? (
            <Tag theme="success" variant="light-outline">
              基础价 ¥{selectedRoom.basePrice}
            </Tag>
          ) : null}
        </div>

        <div className="pricing-selection-stats">
          <article className="pricing-selection-card">
            <small>已选天数</small>
            <strong>{batchDates.length}</strong>
          </article>
          <article className="pricing-selection-card">
            <small>当前均价</small>
            <strong>{selectedAveragePrice ? `¥${selectedAveragePrice}` : '--'}</strong>
          </article>
          <article className="pricing-selection-card">
            <small>最低库存</small>
            <strong>{selectedCalendarItems.length ? `${selectedLowestStock} 间` : '--'}</strong>
          </article>
        </div>

        <div className="pricing-editor-grid">
          <label className="room-field">
            <span className="room-field__label">批量价格</span>
            <InputNumber
              min={1}
              value={draftPrice}
              placeholder="输入大于 0 的价格"
              onChange={(value) => setDraftPrice(toPositiveNumber(value))}
            />
          </label>

          <label className="room-field">
            <span className="room-field__label">价格来源</span>
            <Select
              value={priceSource}
              options={priceSourceOptions}
              onChange={(value) => setPriceSource(String(value) as AdminRoomPriceSource)}
            />
          </label>

          <label className="room-field">
            <span className="room-field__label">批量总库存</span>
            <InputNumber
              min={0}
              value={draftInventory}
              placeholder="输入大于等于 0 的总库存"
              onChange={(value) => setDraftInventory(toNonNegativeNumber(value))}
            />
          </label>

          <div className="pricing-editor__tips">
            <p>库存接口会自动保留已锁定库存；若目标库存小于锁定库存，后端会返回冲突提示。</p>
            <p>这套交互适合快速圈定节假日、周末或未来 3-7 天等常见运营区间，再统一发布价格和库存。</p>
          </div>
        </div>

        <div className="room-editor__footer">
          <p>日历选择参考热门住宿预订站的“两次点击成范围”模式；发布前请确认上方摘要与选中卡片一致。</p>
          <Space align="center" size={12}>
            <Button
              theme="primary"
              loading={priceMutation.isPending}
              onClick={handlePriceSubmit}
            >
              更新价格
            </Button>
            <Button
              theme="primary"
              variant="outline"
              loading={inventoryMutation.isPending}
              onClick={handleInventorySubmit}
            >
              更新库存
            </Button>
          </Space>
        </div>

        {operationError ? (
          <div className="pricing-feedback pricing-feedback--error">
            <Tag theme="danger" variant="light-outline">
              最近一次操作失败
            </Tag>
            <p>{operationError}</p>
          </div>
        ) : null}
      </Card>

      {lastPriceResult || lastInventoryResult ? (
        <Card className="panel-card pricing-feedback-card">
          <div className="pricing-feedback-card__header">
            <h3>变更反馈</h3>
            <p>展示最近一次价格与库存发布的回写结果，便于运营复核。</p>
          </div>

          <div className="pricing-feedback-grid">
            {lastPriceResult ? (
              <article className="pricing-feedback">
                <Tag theme="success" variant="light-outline">
                  价格已发布
                </Tag>
                <h4>价格更新 {lastPriceResult.updatedCount} 天</h4>
                <ul className="pricing-feedback__list">
                  {lastPriceResult.items.map((item) => (
                    <li key={`price-${item.date}`}>
                      <strong>{item.date}</strong>
                      <span>¥{item.price}</span>
                      <small>{item.source}</small>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {lastInventoryResult ? (
              <article className="pricing-feedback">
                <Tag theme="success" variant="light-outline">
                  库存已发布
                </Tag>
                <h4>库存更新 {lastInventoryResult.updatedCount} 天</h4>
                <ul className="pricing-feedback__list">
                  {lastInventoryResult.items.map((item) => (
                    <li key={`inventory-${item.date}`}>
                      <strong>{item.date}</strong>
                      <span>总 {item.totalStock} / 可售 {item.availableStock}</span>
                      <small>锁定 {item.lockedStock}</small>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
