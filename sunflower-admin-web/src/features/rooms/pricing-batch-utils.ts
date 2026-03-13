import type { AdminRoomPriceSource, RoomCalendarItem } from '@/features/rooms/admin-room-pricing-service'

const weekendLabelSet = new Set(['周五', '周六', '周日'])

export type PricingQuickPreset = 'NEXT_3_DAYS' | 'NEXT_7_DAYS' | 'WEEKEND' | 'SINGLE_DAY'

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
