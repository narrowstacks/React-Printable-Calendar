import {
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isToday,
  isWeekend,
  isSameDay,
} from 'date-fns'
import { CalendarDay, CalendarWeek, Shift, MergedShift } from '../../types'

export function buildMonthCalendar(
  year: number,
  month: number,
  _shifts: Shift[],
  mergedShifts: MergedShift[]
): CalendarWeek[] {
  const firstDay = startOfMonth(new Date(year, month))
  const lastDay = endOfMonth(firstDay)

  // Get all weeks in the month
  const weeks = eachWeekOfInterval(
    {
      start: startOfWeek(firstDay),
      end: endOfWeek(lastDay),
    },
    { weekStartsOn: 0 } // Sunday = 0
  )

  const weekCalendars: CalendarWeek[] = []

  weeks.forEach((weekStart, weekIndex) => {
    const days = eachDayOfInterval(
      {
        start: weekStart,
        end: endOfWeek(weekStart),
      },
      { step: 1 }
    )

    const calendarDays: CalendarDay[] = days.map(date => {
      // Get shifts for this day
      const dayShifts = mergedShifts.filter(merged =>
        isSameDay(new Date(merged.shift.start), date)
      )

      return {
        date,
        shifts: dayShifts,
        isToday: isToday(date),
        isWeekend: isWeekend(date),
      }
    })

    weekCalendars.push({
      weekNumber: weekIndex + 1,
      days: calendarDays,
    })
  })

  return weekCalendars
}

export function getMonthShiftsForDay(
  date: Date,
  shifts: Shift[]
): Shift[] {
  return shifts.filter(shift => isSameDay(new Date(shift.start), date))
}
