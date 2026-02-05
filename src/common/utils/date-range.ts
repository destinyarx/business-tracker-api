export type TimePeriod = 'today' | 'yesterday' | 'week' | 'month'

export type DateRange = {
  start: Date
  end: Date
}

/**
 * Returns a [start, end] range in local server time.
 * If your DB stores UTC timestamps, consider using UTC versions (see note below).
 */
export function getDateRangeFromPeriod(period?: TimePeriod): DateRange | undefined {
  if (!period) return undefined

  const now = new Date()

  switch (period) {
    case 'today': {
      const start = startOfDay(now)
      const end = endOfDay(now)
      return { start, end }
    }

    case 'yesterday': {
      const d = new Date(now)
      d.setDate(d.getDate() - 1)
      const start = startOfDay(d)
      const end = endOfDay(d)
      return { start, end }
    }

    case 'week': {
      // last 7 days including today (rolling window)
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 6)

      const start = startOfDay(startDate)
      const end = endOfDay(now)
      return { start, end }
    }

    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const end = endOfDay(now)
      return { start, end }
    }
  }
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
