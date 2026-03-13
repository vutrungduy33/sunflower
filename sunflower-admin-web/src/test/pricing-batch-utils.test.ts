import { describe, expect, it } from 'vitest'
import {
  buildInventoryBatchItems,
  buildPriceBatchItems,
  describeBatchDateRange,
  normalizeDateRange,
  resolveBatchDateRange,
  resolveQuickPresetDates,
  shiftDateText,
} from '@/features/rooms/pricing-batch-utils'
import type { RoomCalendarItem } from '@/features/rooms/admin-room-pricing-service'

const calendar: RoomCalendarItem[] = [
  { date: '2026-03-13', weekdayLabel: '周五', price: 488, stock: 3 },
  { date: '2026-03-14', weekdayLabel: '周六', price: 588, stock: 2 },
  { date: '2026-03-15', weekdayLabel: '周日', price: 618, stock: 1 },
]

describe('pricing batch utils', () => {
  it('resolves an inclusive date range from visible calendar rows', () => {
    expect(resolveBatchDateRange(calendar, '2026-03-14', '2026-03-15')).toEqual([
      '2026-03-14',
      '2026-03-15',
    ])
    expect(resolveBatchDateRange(calendar, '2026-03-15', '2026-03-14')).toEqual([])
    expect(normalizeDateRange('2026-03-15', '2026-03-14')).toEqual(['2026-03-14', '2026-03-15'])
  })

  it('builds price and inventory payload items with a readable summary', () => {
    const dates = resolveBatchDateRange(calendar, '2026-03-13', '2026-03-15')

    expect(buildPriceBatchItems(dates, 699, 'WEEKEND')).toEqual([
      { date: '2026-03-13', price: 699, source: 'WEEKEND' },
      { date: '2026-03-14', price: 699, source: 'WEEKEND' },
      { date: '2026-03-15', price: 699, source: 'WEEKEND' },
    ])
    expect(buildInventoryBatchItems(dates, 5)).toEqual([
      { date: '2026-03-13', totalStock: 5 },
      { date: '2026-03-14', totalStock: 5 },
      { date: '2026-03-15', totalStock: 5 },
    ])
    expect(describeBatchDateRange(dates)).toBe('2026-03-13 至 2026-03-15，共 3 天')
  })

  it('supports shifting windows and resolving booking-style quick presets', () => {
    expect(shiftDateText('2026-03-13', 7)).toBe('2026-03-20')
    expect(resolveQuickPresetDates(calendar, 'SINGLE_DAY')).toEqual(['2026-03-13'])
    expect(resolveQuickPresetDates(calendar, 'WEEKEND')).toEqual([
      '2026-03-13',
      '2026-03-14',
      '2026-03-15',
    ])
  })
})
