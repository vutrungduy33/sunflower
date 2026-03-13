import type { AdminRoomPriceSource, RoomCalendarItem } from '@/features/rooms/admin-room-pricing-service'

const weekendLabelSet = new Set(['周五', '周六', '周日'])

export type PricingQuickPreset = 'NEXT_3_DAYS' | 'NEXT_7_DAYS' | 'WEEKEND' | 'SINGLE_DAY'
export const weekdayHeaders = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export function resolveVisibleDateOptions(calendar: RoomCalendarItem[]) {
  return calendar.map((item) => ({
    label: `${item.date} ${item.weekdayLabel}`,
    value: item.date,
  }))
}

export function shiftDateText(dateText: string, offsetDays: number) {
  const [year, month, day] = dateText.split('-').map((item) => Number(item))
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + offsetDays)

  return date.toISOString().slice(0, 10)
}

export function shiftMonthText(monthText: string, offsetMonths: number) {
  const [year, month] = monthText.split('-').map((item) => Number(item))
  const date = new Date(Date.UTC(year, month - 1, 1))
  date.setUTCMonth(date.getUTCMonth() + offsetMonths)

  return date.toISOString().slice(0, 7)
}

export function resolveMonthRequest(monthText: string) {
  const [year, month] = monthText.split('-').map((item) => Number(item))
  const startDate = `${monthText}-01`
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()

  return {
    startDate,
    days,
  }
}

export function formatMonthLabel(monthText: string) {
  const [year, month] = monthText.split('-')
  return `${year} 年 ${month} 月`
}

export function buildMonthGrid(calendar: RoomCalendarItem[], monthText?: string) {
  const effectiveMonth = monthText ?? calendar[0]?.date.slice(0, 7)
  if (!effectiveMonth) {
    return []
  }

  const [year, month] = effectiveMonth.split('-').map((item) => Number(item))
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const itemMap = new Map(calendar.map((item) => [item.date, item]))
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const mondayFirstOffset = firstDay.getUTCDay() === 0 ? 6 : firstDay.getUTCDay() - 1
  const cells: Array<RoomCalendarItem | null> = Array.from({ length: mondayFirstOffset }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateText = `${effectiveMonth}-${String(day).padStart(2, '0')}`
    cells.push(itemMap.get(dateText) ?? null)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export function normalizeDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return ['', ''] as const
  }

  return startDate <= endDate ? [startDate, endDate] as const : [endDate, startDate] as const
}

export function resolveBatchDateRange(
  calendar: RoomCalendarItem[],
  startDate: string,
  endDate: string,
) {
  if (!startDate || !endDate) {
    return []
  }

  const startIndex = calendar.findIndex((item) => item.date === startDate)
  const endIndex = calendar.findIndex((item) => item.date === endDate)

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return []
  }

  return calendar.slice(startIndex, endIndex + 1).map((item) => item.date)
}

export function resolveQuickPresetDates(calendar: RoomCalendarItem[], preset: PricingQuickPreset) {
  if (!calendar.length) {
    return []
  }

  if (preset === 'SINGLE_DAY') {
    return [calendar[0].date]
  }

  if (preset === 'NEXT_3_DAYS') {
    return calendar.slice(0, 3).map((item) => item.date)
  }

  if (preset === 'NEXT_7_DAYS') {
    return calendar.slice(0, 7).map((item) => item.date)
  }

  const weekendDates: string[] = []
  let foundWeekend = false

  for (const item of calendar) {
    if (weekendLabelSet.has(item.weekdayLabel)) {
      weekendDates.push(item.date)
      foundWeekend = true
      continue
    }

    if (foundWeekend) {
      break
    }
  }

  if (weekendDates.length) {
    return weekendDates
  }

  return calendar.slice(0, 2).map((item) => item.date)
}

export function buildPriceBatchItems(
  dates: string[],
  price: number,
  source: AdminRoomPriceSource,
) {
  return dates.map((date) => ({
    date,
    price,
    source,
  }))
}

export function buildInventoryBatchItems(dates: string[], totalStock: number) {
  return dates.map((date) => ({
    date,
    totalStock,
  }))
}

export function describeBatchDateRange(dates: string[]) {
  if (!dates.length) {
    return '请选择有效的生效日期区间'
  }

  if (dates.length === 1) {
    return `${dates[0]}，共 1 天`
  }

  return `${dates[0]} 至 ${dates[dates.length - 1]}，共 ${dates.length} 天`
}
