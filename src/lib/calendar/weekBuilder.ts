import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isWeekend,
  isSameDay,
} from 'date-fns'
import { CalendarDay, Shift, MergedShift } from '../../types'

export function buildWeekCalendar(
  date: Date,
  mergedShifts: MergedShift[]
): CalendarDay[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }) // Sunday = 0
  const weekEnd = endOfWeek(weekStart)

  const days = eachDayOfInterval(
    {
      start: weekStart,
      end: weekEnd,
    },
    { step: 1 }
  )

  return days.map(dayDate => {
    // Get shifts for this day
    const dayShifts = mergedShifts.filter(merged =>
      isSameDay(new Date(merged.shift.start), dayDate)
    )

    return {
      date: dayDate,
      shifts: dayShifts,
      isToday: isToday(dayDate),
      isWeekend: isWeekend(dayDate),
    }
  })
}

/**
 * Generate hourly time slots for the week view
 * @param startHour - Starting hour (e.g., 6 for 6:00 AM)
 * @param endHour - Ending hour (e.g., 23 for 11:00 PM)
 */
export function generateTimeSlots(startHour: number = 6, endHour: number = 23): number[] {
  const slots: number[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(hour)
  }
  return slots
}

export interface ShiftPosition {
  shift: Shift
  displayColor: string  // Color for display (includes custom assignments)
  rowStart: number
  rowEnd: number
  zIndex: number
  indexInGroup: number  // Position in overlap group (0 = bottom, higher = top)
  groupSize: number     // Total shifts in this overlap group
}

/**
 * Calculate position of shifts in the time grid
 * Overlapping shifts are layered on top of each other with dynamic text positioning
 */
export function calculateShiftPositions(
  dayShifts: Shift[],
  startHour: number = 6,
  colorMap: Map<string, string> = new Map()
): ShiftPosition[] {
  const positions: ShiftPosition[] = []

  if (dayShifts.length === 0) return positions

  // Find all overlapping groups
  const groups = findOverlapGroups(dayShifts)

  // Process each group
  groups.forEach(group => {
    // Sort by start time to determine stacking order
    const sorted = [...group].sort((a, b) => a.start.getTime() - b.start.getTime())

    sorted.forEach((shift, idx) => {
      const rowStart = (shift.start.getHours() - startHour) * 60 + shift.start.getMinutes()
      const rowEnd = (shift.end.getHours() - startHour) * 60 + shift.end.getMinutes()

      // Get color from map, or calculate default
      let displayColor = colorMap.get(shift.id)
      if (!displayColor) {
        displayColor = shift.people.length > 0 ? shift.people[0].color : '#d1d5db'
      }

      positions.push({
        shift,
        displayColor,
        rowStart,
        rowEnd,
        zIndex: 10 + idx,
        indexInGroup: idx,
        groupSize: group.length,
      })
    })
  })

  return positions
}

/**
 * Group shifts by whether they overlap with each other
 */
function findOverlapGroups(shifts: Shift[]): Shift[][] {
  const groups: Shift[][] = []
  const used = new Set<number>()

  for (let i = 0; i < shifts.length; i++) {
    if (used.has(i)) continue

    const group = [shifts[i]]
    used.add(i)

    // Find all shifts that overlap with any shift in the group
    let changed = true
    while (changed) {
      changed = false
      for (let j = 0; j < shifts.length; j++) {
        if (used.has(j)) continue

        // Check if this shift overlaps with any in the group
        if (group.some(s => shiftsOverlap(s, shifts[j]))) {
          group.push(shifts[j])
          used.add(j)
          changed = true
        }
      }
    }

    groups.push(group)
  }

  return groups
}

function shiftsOverlap(shift1: Shift, shift2: Shift): boolean {
  return shift1.start < shift2.end && shift1.end > shift2.start
}

/**
 * Detect the earliest and latest times from a collection of days with shifts
 * Returns an object with startHour and endHour, with 1 hour buffer before and after
 */
export function detectTimeRange(days: CalendarDay[]): { startHour: number; endHour: number } {
  let minHour = 23
  let maxHour = 0

  days.forEach(day => {
    day.shifts.forEach(mergedShift => {
      const startHour = mergedShift.shift.start.getHours()
      const endHour = mergedShift.shift.end.getHours()

      minHour = Math.min(minHour, startHour)
      maxHour = Math.max(maxHour, endHour)
    })
  })

  // Add 1 hour buffer before and after for readability
  const startHour = Math.max(0, minHour - 1)
  const endHour = Math.min(24, maxHour + 1)

  return { startHour, endHour }
}
