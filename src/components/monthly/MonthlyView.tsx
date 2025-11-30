import { useMemo, forwardRef } from 'react'
import { useCalendarStore } from '../../store/calendarStore'
import { mergeShifts } from '../../lib/grouping/shiftMerger'
import { buildMonthCalendar } from '../../lib/calendar/monthBuilder'
import MonthGrid from './MonthGrid'
import Legend from '../shared/Legend'

const MonthlyView = forwardRef<HTMLDivElement>((_, printRef) => {
  const { rawEvents, people, currentDate, settings } = useCalendarStore()

  const { weeks } = useMemo(() => {
    if (rawEvents.length === 0) {
      return { weeks: [] }
    }

    const { mergedShifts } = mergeShifts(rawEvents, people, settings.colorAssignments)
    const weeks = buildMonthCalendar(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      mergedShifts
    )

    return { weeks }
  }, [rawEvents, people, currentDate, settings.colorAssignments])

  if (rawEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <p>No calendar data loaded. Please upload an ICS file or provide a URL.</p>
      </div>
    )
  }

  return (
    <div
      ref={printRef}
      className={`
        bg-white rounded-lg shadow calendar-container
        landscape
      `}
    >
      <div className="p-6">
        <MonthGrid weeks={weeks} timezone={settings.timezone} timeFormat={settings.timeFormat} />
        <div className="legend-section mt-8 border-t pt-6">
          <Legend people={Array.from(people.values())} colorAssignments={settings.colorAssignments} />
        </div>
      </div>
    </div>
  )
})

MonthlyView.displayName = 'MonthlyView'

export default MonthlyView
