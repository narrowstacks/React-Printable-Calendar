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
import { CalendarDay, CalendarWeek, MergedShift } from '../../types'

export function buildMonthCalendar(
  year: number,
  month: number,
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
      // Get shifts for this day, sorted by start time then alphabetically by name
      const dayShifts = mergedShifts
        .filter(merged => isSameDay(new Date(merged.shift.start), date))
        .sort((a, b) => {
          // First sort by start time
          const startA = new Date(a.shift.start).getTime()
          const startB = new Date(b.shift.start).getTime()
          if (startA !== startB) return startA - startB

          // If start times are equal, sort by end time
          const endA = new Date(a.shift.end).getTime()
          const endB = new Date(b.shift.end).getTime()
          if (endA !== endB) return endA - endB

          // If both start and end times are equal, sort alphabetically by name
          return a.peopleList.localeCompare(b.peopleList)
        })

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
