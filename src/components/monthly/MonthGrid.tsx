import { CalendarWeek, TimeFormat } from '../../types'
import DayCell from './DayCell'

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface MonthGridProps {
  weeks: CalendarWeek[]
  timezone: string
  timeFormat: TimeFormat
}

export default function MonthGrid({ weeks, timezone, timeFormat }: MonthGridProps) {
  return (
    <div>
      {/* Header with weekday names */}
      <div className="grid grid-cols-7 gap-0 border border-gray-200 mb-0">
        {WEEKDAY_NAMES.map(day => (
          <div
            key={day}
            className="bg-gray-100 border-r border-b border-gray-200 p-3 text-center font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar weeks */}
      <div className="border border-t-0 border-gray-200">
        {weeks.map(week => (
          <div key={week.weekNumber} className="grid grid-cols-7 gap-0 border-b border-gray-200 last:border-b-0">
            {week.days.map(day => (
              <DayCell key={day.date.toISOString()} day={day} timezone={timezone} timeFormat={timeFormat} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
