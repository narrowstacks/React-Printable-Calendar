import { RawEvent, Person, Shift, MergedShift } from '../../types'
import { extractPeopleAndTitle } from '../parsers/nameExtractor'
import { format } from 'date-fns'
import { getShiftColor } from '../color/colorUtils'

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

  return {
    shiftKey,
    shift,
    peopleList,
    displayColor: getShiftColor(shift, colorAssignments),
  }
}
