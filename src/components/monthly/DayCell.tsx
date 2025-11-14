import { CalendarDay, TimeFormat } from '../../types'
import { formatDate } from '../../lib/calendar/timeFormatter'
import ShiftGroup from './ShiftGroup'

interface DayCellProps {
  day: CalendarDay
  timezone: string
  timeFormat: TimeFormat
}

export default function DayCell({ day, timezone, timeFormat }: DayCellProps) {
  return (
    <div
      className={`
        border-r border-gray-200 last:border-r-0 p-3 min-h-32
        ${day.isToday ? 'bg-blue-50' : day.isWeekend ? 'bg-gray-50' : 'bg-white'}
      `}
    >
      {/* Date header */}
      <div className={`
        text-sm font-semibold mb-2
        ${day.isToday ? 'text-blue-600' : 'text-gray-700'}
      `}>
        {formatDate(day.date, timezone)}
      </div>

      {/* Shifts */}
      <div className="space-y-1">
        {day.shifts.map(merged => (
          <ShiftGroup key={merged.shiftKey} merged={merged} timezone={timezone} timeFormat={timeFormat} />
        ))}
      </div>
    </div>
  )
}
