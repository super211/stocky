const pad = (n) => String(n).padStart(2, '0')

// Dates are handled as local "YYYY-MM-DD" strings (see spec section 5).
export function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayStr() {
  return toDateStr(new Date())
}

export function isValidDateStr(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return toDateStr(parseDateStr(s)) === s
}

export function parseDateStr(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function shiftDate(s, days) {
  const d = parseDateStr(s)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

export function formatDateLabel(s) {
  const today = todayStr()
  if (s === today) return 'Today'
  if (s === shiftDate(today, -1)) return 'Yesterday'
  if (s === shiftDate(today, 1)) return 'Tomorrow'
  return parseDateStr(s).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatWeekday(s) {
  return parseDateStr(s).toLocaleDateString(undefined, { weekday: 'short' })
}

// The last `n` days ending at `end`, oldest first.
export function lastDays(n, end = todayStr()) {
  return Array.from({ length: n }, (_, i) => shiftDate(end, i - (n - 1)))
}
