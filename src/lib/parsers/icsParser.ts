import ICAL from 'ical.js'
import { RawEvent } from '../../types'

export async function parseICSFile(file: File): Promise<RawEvent[]> {
  const text = await file.text()
  return parseICSString(text)
}

export async function parseICSURL(url: string): Promise<RawEvent[]> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const text = await response.text()
    return parseICSString(text)
  } catch (error) {
    console.error('Error fetching ICS URL:', error)
    throw new Error(`Failed to fetch ICS from URL: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function parseICSString(icsString: string): RawEvent[] {
  try {
    const jcal = ICAL.parse(icsString)
    const comp = new ICAL.Component(jcal)
    const events = comp.getAllSubcomponents('vevent')

    const rawEvents: RawEvent[] = []
    const now = new Date()

    events.forEach((event) => {
      const startProp = event.getFirstPropertyValue('dtstart')
      const endProp = event.getFirstPropertyValue('dtend')

      if (!startProp || !endProp) return

      const startDate = startProp instanceof ICAL.Time ? startProp.toJSDate() : new Date(String(startProp))
      const endDate = endProp instanceof ICAL.Time ? endProp.toJSDate() : new Date(String(endProp))

      // Check if this is a RECURRENCE-ID exception (modified instance of a recurring event)
      const recurrenceIdProp = event.getFirstPropertyValue('recurrence-id')
      const isException = !!recurrenceIdProp

      if (isException) {
        // This is a modified instance of a recurring event
        try {
          const recurrenceId = recurrenceIdProp instanceof ICAL.Time
            ? recurrenceIdProp.toJSDate()
            : new Date(String(recurrenceIdProp))

          if (isNaN(recurrenceId.getTime())) {
            console.warn('Invalid RECURRENCE-ID date:', recurrenceIdProp)
            rawEvents.push(createRawEvent(event, startDate, endDate, { isException: true }))
          } else {
            rawEvents.push(createRawEvent(event, startDate, endDate, { isException: true, recurrenceId }))
          }
        } catch (error) {
          console.warn('Error parsing RECURRENCE-ID:', error)
          // Fallback: treat as exception without specific recurrence ID
          rawEvents.push(createRawEvent(event, startDate, endDate, { isException: true }))
        }
      } else {
        // Get RRULE for recurring events
        const rruleProp = event.getFirstProperty('rrule')

        if (rruleProp) {
          const rruleValue = rruleProp.getFirstValue()
          if (rruleValue instanceof ICAL.Recur) {
            // Expand recurring event using the Recur object directly
            const expanded = expandRecurringEventDirect(
              event,
              startDate,
              endDate,
              rruleValue,
              now
            )
            rawEvents.push(...expanded)
          } else {
            // Single event
            rawEvents.push(createRawEvent(event, startDate, endDate))
          }
        } else {
          // Single event
          rawEvents.push(createRawEvent(event, startDate, endDate))
        }
      }
    })

    return rawEvents
  } catch (error) {
    console.error('Error parsing ICS:', error)
    throw new Error(`Failed to parse ICS: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function expandRecurringEventDirect(
  event: ICAL.Component,
  startDate: Date,
  endDate: Date,
  rrule: ICAL.Recur,
  afterDate: Date
): RawEvent[] {
  const results: RawEvent[] = []
  const duration = endDate.getTime() - startDate.getTime()

  try {
    // Parse excluded dates (EXDATE) from the event
    const excludedDates = parseExcludedDates(event)

    // Generate occurrences for the next 12 months
    const endRange = new Date(afterDate.getFullYear() + 1, afterDate.getMonth(), afterDate.getDate())
    const startICAL = ICAL.Time.fromJSDate(startDate)

    const iterator = rrule.iterator(startICAL)
    let occurrence = iterator.next()

    while (occurrence && occurrence.toJSDate() < endRange) {
      const occStart = occurrence.toJSDate()

      // Skip this occurrence if it's in the EXDATE list
      if (isOccurrenceExcluded(occStart, excludedDates)) {
        occurrence = iterator.next()
        continue
      }

      const occEnd = new Date(occStart.getTime() + duration)
      results.push(createRawEvent(event, occStart, occEnd))
      occurrence = iterator.next()
    }
  } catch (error) {
    console.warn('Error expanding recurring event:', error)
    // Fallback: just use the original event
    results.push(createRawEvent(event, startDate, endDate))
  }

  return results
}

function createRawEvent(event: ICAL.Component, startDate: Date, endDate: Date, options?: { isException?: boolean; recurrenceId?: Date }): RawEvent {
  const uid = event.getFirstPropertyValue('uid') as string || Math.random().toString()
  const summary = event.getFirstPropertyValue('summary') as string || 'Untitled'
  const location = event.getFirstPropertyValue('location') as string || undefined
  const description = event.getFirstPropertyValue('description') as string || undefined
  const color = event.getFirstPropertyValue('color') as string || undefined

  return {
    id: uid + '_' + startDate.getTime(),
    summary,
    start: startDate,
    end: endDate,
    location,
    description,
    color,
    uid,
    recurrenceId: options?.recurrenceId,
    isException: options?.isException,
    isDeleted: false,
  }
}

/**
 * Parses EXDATE (excluded dates) from an ICS event component
 * @returns Set of date timestamps (at midnight) that should be excluded from recurrence
 */
function parseExcludedDates(event: ICAL.Component): Set<number> {
  const excludedDates = new Set<number>()

  try {
    const exdateProps = event.getAllProperties('exdate')

    exdateProps.forEach((prop) => {
      const values = prop.getValues()

      // getValues() can return single value or array
      const dateValues = Array.isArray(values) ? values : [values]

      dateValues.forEach((val) => {
        try {
          let date: Date

          if (val instanceof ICAL.Time) {
            date = val.toJSDate()
          } else if (typeof val === 'string') {
            date = new Date(val)
          } else {
            throw new Error(`Unexpected EXDATE value type: ${typeof val}`)
          }

          // Validate the parsed date
          if (isNaN(date.getTime())) {
            console.warn('Invalid EXDATE value (not a valid date):', val)
            return
          }

          // Store midnight of each excluded date for accurate comparison
          const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
          excludedDates.add(dateKey)
        } catch (e) {
          console.warn('Error parsing EXDATE value:', val, e instanceof Error ? e.message : String(e))
        }
      })
    })
  } catch (error) {
    console.warn('Error parsing EXDATE property:', error instanceof Error ? error.message : String(error))
  }

  return excludedDates
}

/**
 * Checks if an occurrence date is in the excluded dates set
 * @param occurrenceDate The occurrence date to check
 * @param excludedDates Set of excluded date timestamps (at midnight)
 * @returns true if the occurrence should be excluded
 */
function isOccurrenceExcluded(occurrenceDate: Date, excludedDates: Set<number>): boolean {
  // Normalize to midnight UTC for comparison
  const dateKey = new Date(occurrenceDate.getUTCFullYear(), occurrenceDate.getUTCMonth(), occurrenceDate.getUTCDate()).getTime()
  return excludedDates.has(dateKey)
}
