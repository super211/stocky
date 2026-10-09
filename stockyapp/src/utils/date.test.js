import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatDateLabel,
  isValidDateStr,
  lastDays,
  parseDateStr,
  shiftDate,
  toDateStr,
  todayStr,
} from './date'

describe('toDateStr / parseDateStr', () => {
  it('zero-pads month and day', () => {
    expect(toDateStr(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('round-trips a date string', () => {
    expect(toDateStr(parseDateStr('2026-10-09'))).toBe('2026-10-09')
  })
})

describe('isValidDateStr', () => {
  it('accepts real dates, including leap day', () => {
    expect(isValidDateStr('2026-10-09')).toBe(true)
    expect(isValidDateStr('2024-02-29')).toBe(true)
  })

  it('rejects wrong formats and impossible dates', () => {
    expect(isValidDateStr('2026-13-01')).toBe(false)
    expect(isValidDateStr('2025-02-29')).toBe(false)
    expect(isValidDateStr('2026-1-9')).toBe(false)
    expect(isValidDateStr('not a date')).toBe(false)
    expect(isValidDateStr(undefined)).toBe(false)
    expect(isValidDateStr(20261009)).toBe(false)
  })
})

describe('shiftDate', () => {
  it('moves across month and year boundaries', () => {
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftDate('2024-02-28', 1)).toBe('2024-02-29')
  })

  it('shifts by zero and by many days', () => {
    expect(shiftDate('2026-10-09', 0)).toBe('2026-10-09')
    expect(shiftDate('2026-10-09', 30)).toBe('2026-11-08')
  })
})

describe('lastDays', () => {
  it('returns n days ending at the given date, oldest first', () => {
    expect(lastDays(3, '2026-03-01')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01'])
  })

  it('returns just the end date for n = 1', () => {
    expect(lastDays(1, '2026-10-09')).toEqual(['2026-10-09'])
  })
})

describe('with a fixed clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 9, 23, 30))
  })
  afterEach(() => vi.useRealTimers())

  it('todayStr uses the local date', () => {
    expect(todayStr()).toBe('2026-10-09')
  })

  it('formatDateLabel names today, yesterday and tomorrow', () => {
    expect(formatDateLabel('2026-10-09')).toBe('Today')
    expect(formatDateLabel('2026-10-08')).toBe('Yesterday')
    expect(formatDateLabel('2026-10-10')).toBe('Tomorrow')
  })

  it('formatDateLabel falls back to a readable date otherwise', () => {
    const label = formatDateLabel('2026-10-01')
    expect(label).not.toBe('Today')
    expect(label).toMatch(/1/)
  })

  it('lastDays defaults to ending today', () => {
    const days = lastDays(7)
    expect(days).toHaveLength(7)
    expect(days.at(-1)).toBe('2026-10-09')
    expect(days[0]).toBe('2026-10-03')
  })
})
