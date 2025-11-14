import { CalendarDay, TimeFormat } from '../../types'
import { calculateShiftPositions } from '../../lib/calendar/weekBuilder'
import { formatDate, formatDayOfWeek } from '../../lib/calendar/timeFormatter'
import ShiftBlock from './ShiftBlock'

interface DayColumnProps {
  day: CalendarDay
  timeSlots: number[]
  hourHeight: number
  timezone: string
  timeFormat: TimeFormat
  colorAssignments: Record<string, string>
}

export default function DayColumn({ day, timeSlots, hourHeight, timezone, timeFormat, colorAssignments }: DayColumnProps) {
  // Merge shifts with identical time ranges into single shift with multiple people
  const mergedShiftsByTime = new Map<string, typeof day.shifts[0]>()

  day.shifts.forEach(mergedShift => {
    const timeKey = `${mergedShift.shift.start.getTime()}-${mergedShift.shift.end.getTime()}`

    if (mergedShiftsByTime.has(timeKey)) {
      // Merge people into the existing shift
      const existing = mergedShiftsByTime.get(timeKey)!
      existing.shift.people.push(...mergedShift.shift.people)
      existing.peopleList = existing.shift.people.map(p => p.name).join(', ')
    } else {
      mergedShiftsByTime.set(timeKey, {
        ...mergedShift,
        shift: {
          ...mergedShift.shift,
          people: [...mergedShift.shift.people], // Copy array to avoid mutations
        },
      })
    }
  })

  const mergedShifts = Array.from(mergedShiftsByTime.values())

  // Build a map of shift ID to display color
  const colorMap = new Map<string, string>()
  mergedShifts.forEach(merged => {
    colorMap.set(merged.shift.id, merged.displayColor)
  })

  const shiftPositions = calculateShiftPositions(
    mergedShifts.map(m => m.shift),
    timeSlots[0],
    timeSlots[timeSlots.length - 1] + 1,
    colorMap
  )

  return (
    <div className={`flex-1 border-r border-gray-200 last:border-r-0 relative ${day.isToday ? 'bg-blue-50' : day.isWeekend ? 'bg-gray-50' : 'bg-white'}`}>
      {/* Day header */}
      <div className="h-12 border-b border-gray-200 p-2 text-center font-semibold text-sm">
        <div className="text-xs text-gray-600">{formatDayOfWeek(day.date, timezone)}</div>
        <div className={day.isToday ? 'text-blue-600' : ''}>{formatDate(day.date, timezone)}</div>
      </div>

      {/* Time grid */}
      <div className="relative" style={{ minHeight: timeSlots.length * hourHeight }}>
        {/* Hour divider lines */}
        {timeSlots.map(hour => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-b border-gray-100"
            style={{
              top: (hour - timeSlots[0]) * hourHeight,
              height: hourHeight,
            }}
          ></div>
        ))}

        {/* Shift blocks */}
        {shiftPositions.map(position => (
          <ShiftBlock
            key={position.shift.id}
            position={position}
            hourHeight={hourHeight}
            timezone={timezone}
            timeFormat={timeFormat}
            colorAssignments={colorAssignments}
          />
        ))}
      </div>
    </div>
  )
}
