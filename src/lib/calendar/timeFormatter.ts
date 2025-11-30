import { format, toZonedTime } from 'date-fns-tz'
import { TimeFormat } from '../../types'

/**
 * Safely format a date with timezone support, falling back to local time on error
 */
function safeFormat(
  date: Date,
  formatString: string,
  timezone: string
): string {
  try {
    const zonedDate = toZonedTime(date, timezone)
    return format(zonedDate, formatString, { timeZone: timezone })
  } catch {
    return format(date, formatString)
  }
}

/**
 * Format a time in the specified timezone and format
 */
export function formatTime(
  date: Date,
  timezone: string,
  timeFormat: TimeFormat
): string {
  const formatString = timeFormat === '12h' ? 'h:mm a' : 'HH:mm'
  return safeFormat(date, formatString, timezone)
}

/**
 * Format a compact time (e.g., "9am" or "9:30am")
 * Omits minutes when on the hour
 */
function formatCompactTime(date: Date, timezone: string): string {
  try {
    const zonedDate = toZonedTime(date, timezone)
    const formatString = zonedDate.getMinutes() === 0 ? 'ha' : 'h:mma'
    return format(zonedDate, formatString, { timeZone: timezone }).toLowerCase()
  } catch {
    const formatString = date.getMinutes() === 0 ? 'ha' : 'h:mma'
    return format(date, formatString).toLowerCase()
  }
}

/**
 * Format a time range (e.g., "9:00-17:00" or "9am-5pm")
 * Uses compact format for 12h to save space
 */
export function formatTimeRange(
  startDate: Date,
  endDate: Date,
  timezone: string,
  timeFormat: TimeFormat
): string {
  if (timeFormat === '12h') {
    return `${formatCompactTime(startDate, timezone)}-${formatCompactTime(endDate, timezone)}`
  }

  return `${formatTime(startDate, timezone, timeFormat)}-${formatTime(endDate, timezone, timeFormat)}`
}

/**
 * Format a date for display (day of month)
 */
export function formatDate(date: Date, timezone: string): string {
  return safeFormat(date, 'd', timezone)
}

/**
 * Format a day of week (e.g., "Mon", "Tue")
 */
export function formatDayOfWeek(date: Date, timezone: string): string {
  return safeFormat(date, 'EEE', timezone)
}
