import { format, toZonedTime } from 'date-fns-tz'
import { TimeFormat } from '../../types'

/**
 * Format a time in the specified timezone and format
 */
export function formatTime(
  date: Date,
  timezone: string,
  timeFormat: TimeFormat
): string {
  try {
    const zonedDate = toZonedTime(date, timezone)

    if (timeFormat === '12h') {
      return format(zonedDate, 'h:mm a', { timeZone: timezone })
    } else {
      return format(zonedDate, 'HH:mm', { timeZone: timezone })
    }
  } catch (error) {
    console.warn(`Error formatting time with timezone ${timezone}:`, error)
    // Fallback to simple formatting
    if (timeFormat === '12h') {
      return format(date, 'h:mm a')
    } else {
      return format(date, 'HH:mm')
    }
  }
}

/**
 * Format a time range (e.g., "9:00-17:00" or "9:00 AM - 5:00 PM")
 */
export function formatTimeRange(
  startDate: Date,
  endDate: Date,
  timezone: string,
  timeFormat: TimeFormat
): string {
  const startTime = formatTime(startDate, timezone, timeFormat)
  const endTime = formatTime(endDate, timezone, timeFormat)
  return `${startTime}-${endTime}`
}

/**
 * Format a date for display
 */
export function formatDate(date: Date, timezone: string): string {
  try {
    const zonedDate = toZonedTime(date, timezone)
    return format(zonedDate, 'd')
  } catch (error) {
    return format(date, 'd')
  }
}

/**
 * Format a day of week
 */
export function formatDayOfWeek(date: Date, timezone: string): string {
  try {
    const zonedDate = toZonedTime(date, timezone)
    return format(zonedDate, 'EEE')
  } catch (error) {
    return format(date, 'EEE')
  }
}
