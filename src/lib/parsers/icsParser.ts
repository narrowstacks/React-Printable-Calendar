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

    // Phase 1: Separate events into recurring masters, exceptions, and single events
    const recurringByUid = new Map<string, ICAL.Component>()
    const exceptionsByUid = new Map<string, ICAL.Component[]>()
    const singleEvents: ICAL.Component[] = []

    events.forEach((event) => {
      const uid = event.getFirstPropertyValue('uid') as string
      const recurrenceIdProp = event.getFirstPropertyValue('recurrence-id')
      const rruleProp = event.getFirstProperty('rrule')

      if (recurrenceIdProp) {
        // This is a RECURRENCE-ID exception (modified instance)
        if (!exceptionsByUid.has(uid)) {
          exceptionsByUid.set(uid, [])
        }
        exceptionsByUid.get(uid)!.push(event)
      } else if (rruleProp) {
        // This is a recurring event master
        recurringByUid.set(uid, event)
      } else {
        // Single event
        singleEvents.push(event)
      }
    })

    // Phase 2: Process recurring events with their exceptions
    recurringByUid.forEach((event, uid) => {
      const startProp = event.getFirstPropertyValue('dtstart')
      const endProp = event.getFirstPropertyValue('dtend')

      if (!startProp || !endProp) return

      const startDate = startProp instanceof ICAL.Time ? startProp.toJSDate() : new Date(String(startProp))
      const endDate = endProp instanceof ICAL.Time ? endProp.toJSDate() : new Date(String(endProp))

      const rruleProp = event.getFirstProperty('rrule')
      const rruleValue = rruleProp?.getFirstValue()

      if (rruleValue instanceof ICAL.Recur) {
        const exceptions = exceptionsByUid.get(uid) || []
        const expanded = expandRecurringWithExceptions(
          event,
          startDate,
          endDate,
          rruleValue,
          exceptions,
          now
        )
        rawEvents.push(...expanded)
      } else {
        rawEvents.push(createRawEvent(event, startDate, endDate))
      }
    })

    // Phase 3: Process single events
    singleEvents.forEach((event) => {
      const startProp = event.getFirstPropertyValue('dtstart')
      const endProp = event.getFirstPropertyValue('dtend')

      if (!startProp || !endProp) return

      const startDate = startProp instanceof ICAL.Time ? startProp.toJSDate() : new Date(String(startProp))
      const endDate = endProp instanceof ICAL.Time ? endProp.toJSDate() : new Date(String(endProp))

      rawEvents.push(createRawEvent(event, startDate, endDate))
    })

    return rawEvents
  } catch (error) {
    console.error('Error parsing ICS:', error)
    throw new Error(`Failed to parse ICS: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Expands a recurring event while properly handling RECURRENCE-ID exceptions
 * Exceptions replace the original occurrence for that date
 */
function expandRecurringWithExceptions(
  masterEvent: ICAL.Component,
  startDate: Date,
  endDate: Date,
  rrule: ICAL.Recur,
  exceptions: ICAL.Component[],
  afterDate: Date
): RawEvent[] {
  const results: RawEvent[] = []
  const duration = endDate.getTime() - startDate.getTime()

  try {
    // Build map of exceptions by their recurrence-id timestamp
    const exceptionMap = new Map<number, ICAL.Component>()
    exceptions.forEach(exc => {
      const recIdProp = exc.getFirstPropertyValue('recurrence-id')
      if (recIdProp) {
        const recIdDate = recIdProp instanceof ICAL.Time
          ? recIdProp.toJSDate()
          : new Date(String(recIdProp))
        if (!isNaN(recIdDate.getTime())) {
          exceptionMap.set(recIdDate.getTime(), exc)
        }
      }
    })

    // Parse excluded dates (EXDATE) from the event
    const excludedDates = parseExcludedDates(masterEvent)

    // Generate occurrences for the next 2 years (extended from 12 months)
    const endRange = new Date(afterDate.getFullYear() + 2, afterDate.getMonth(), afterDate.getDate())
    const startICAL = ICAL.Time.fromJSDate(startDate)

    const iterator = rrule.iterator(startICAL)
    let occurrence = iterator.next()

    while (occurrence && occurrence.toJSDate() < endRange) {
      const occStart = occurrence.toJSDate()
      const occTimestamp = occStart.getTime()

      // Skip if excluded via EXDATE
      if (isOccurrenceExcluded(occStart, excludedDates)) {
        occurrence = iterator.next()
        continue
      }

      // Check if there's an exception for this occurrence
      if (exceptionMap.has(occTimestamp)) {
        // Use the exception instead of the master
        const excEvent = exceptionMap.get(occTimestamp)!
        const excStartProp = excEvent.getFirstPropertyValue('dtstart')
        const excEndProp = excEvent.getFirstPropertyValue('dtend')

        if (excStartProp && excEndProp) {
          const excStartDate = excStartProp instanceof ICAL.Time
            ? excStartProp.toJSDate()
            : new Date(String(excStartProp))
          const excEndDate = excEndProp instanceof ICAL.Time
            ? excEndProp.toJSDate()
            : new Date(String(excEndProp))

          results.push(createRawEvent(excEvent, excStartDate, excEndDate, { isException: true }))
        }
      } else {
        // Use the master event data for this occurrence
        const occEnd = new Date(occStart.getTime() + duration)
        results.push(createRawEvent(masterEvent, occStart, occEnd))
      }

      occurrence = iterator.next()
    }
  } catch (error) {
    console.warn('Error expanding recurring event:', error)
    // Fallback: just use the original event
    results.push(createRawEvent(masterEvent, startDate, endDate))
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
 * @returns Set of date timestamps (at midnight UTC) that should be excluded from recurrence
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

          // Store midnight UTC of each excluded date for accurate comparison
          // Use Date.UTC to ensure consistent timezone handling
          const dateKey = Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
          )
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
 * @param excludedDates Set of excluded date timestamps (at midnight UTC)
 * @returns true if the occurrence should be excluded
 */
function isOccurrenceExcluded(occurrenceDate: Date, excludedDates: Set<number>): boolean {
  // Use Date.UTC consistently with parseExcludedDates
  const dateKey = Date.UTC(
    occurrenceDate.getUTCFullYear(),
    occurrenceDate.getUTCMonth(),
    occurrenceDate.getUTCDate()
  )
  return excludedDates.has(dateKey)
}
