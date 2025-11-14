import { RawEvent, Person, Shift, MergedShift } from '../../types'
import { extractPeopleAndTitle } from '../parsers/nameExtractor'
import { format } from 'date-fns'

export function mergeShifts(
  rawEvents: RawEvent[],
  peopleMap: Map<string, Person>,
  colorAssignments: Record<string, string> = {}
): { shifts: Shift[], mergedShifts: MergedShift[] } {
  // Group events by (start time, end time, title)
  const shiftGroups = new Map<string, RawEvent[]>()

  rawEvents.forEach(event => {
    const key = getShiftKey(event)
    if (!shiftGroups.has(key)) {
      shiftGroups.set(key, [])
    }
    shiftGroups.get(key)!.push(event)
  })

  // Convert grouped events to Shift objects
  const shifts: Shift[] = []
  const mergedShifts: MergedShift[] = []

  shiftGroups.forEach((events, shiftKey) => {
    // Extract people from all events in this group
    const peopleSet = new Set<Person>()

    events.forEach(event => {
      const { names } = extractPeopleAndTitle(event.summary)
      names.forEach(name => {
        const person = peopleMap.get(name)
        if (person) {
          peopleSet.add(person)
        }
      })
    })

    // Use first event as representative for shift details
    const representative = events[0]
    const { title } = extractPeopleAndTitle(representative.summary)

    const shift: Shift = {
      id: shiftKey,
      title,
      start: representative.start,
      end: representative.end,
      location: representative.location,
      description: representative.description,
      people: Array.from(peopleSet),
    }

    shifts.push(shift)

    // Create merged shift display
    const merged = createMergedShift(shift, shiftKey, colorAssignments)
    mergedShifts.push(merged)
  })

  return { shifts, mergedShifts }
}

function getShiftKey(event: RawEvent): string {
  const { title } = extractPeopleAndTitle(event.summary)
  const startStr = format(event.start, 'yyyy-MM-dd HH:mm')
  const endStr = format(event.end, 'yyyy-MM-dd HH:mm')
  return `${startStr}|${endStr}|${title}`
}

function createMergedShift(shift: Shift, shiftKey: string, colorAssignments: Record<string, string> = {}): MergedShift {
  // Create display text for people
  const names = shift.people.map(p => p.name)
  let peopleList: string

  if (names.length === 0) {
    peopleList = 'Unassigned'
  } else if (names.length <= 3) {
    peopleList = names.join(', ')
  } else {
    const first = names.slice(0, 2).join(', ')
    const remaining = names.length - 2
    peopleList = `${first}, +${remaining} more`
  }

  // Pick dominant color from people
  const displayColor = getShiftColor(shift, colorAssignments)

  return {
    shiftKey,
    shift,
    peopleList,
    displayColor,
  }
}

function getShiftColor(shift: Shift, colorAssignments: Record<string, string> = {}): string {
  if (shift.people.length === 0) {
    return '#d1d5db' // gray
  }

  // Use first person's color, preferring custom assignment if available
  const firstPerson = shift.people[0]
  return colorAssignments[firstPerson.name] || firstPerson.color
}

/**
 * Group shifts by day
 */
export function groupShiftsByDay(
  shifts: Shift[]
): Map<string, Shift[]> {
  const grouped = new Map<string, Shift[]>()

  shifts.forEach(shift => {
    const dayKey = format(shift.start, 'yyyy-MM-dd')
    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, [])
    }
    grouped.get(dayKey)!.push(shift)
  })

  return grouped
}

/**
 * Check if two shifts overlap
 */
export function shiftsOverlap(shift1: Shift, shift2: Shift): boolean {
  return shift1.start < shift2.end && shift1.end > shift2.start
}

/**
 * Detect overlapping shifts on same day
 */
export function detectDayOverlaps(dayShifts: Shift[]): Map<string, Shift[]> {
  const overlaps = new Map<string, Shift[]>()

  for (let i = 0; i < dayShifts.length; i++) {
    for (let j = i + 1; j < dayShifts.length; j++) {
      if (shiftsOverlap(dayShifts[i], dayShifts[j])) {
        const key = `${dayShifts[i].title}-${dayShifts[j].title}`
        if (!overlaps.has(key)) {
          overlaps.set(key, [dayShifts[i], dayShifts[j]])
        }
      }
    }
  }

  return overlaps
}
