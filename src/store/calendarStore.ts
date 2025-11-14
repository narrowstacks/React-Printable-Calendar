import { create } from 'zustand'
import { RawEvent, Person, Shift, MergedShift, AppSettings } from '../types'
import { settingsStorage } from '../lib/storage'

interface CalendarState {
  // Data
  rawEvents: RawEvent[]
  people: Map<string, Person>
  shifts: Shift[]
  mergedShifts: MergedShift[]

  // Settings
  settings: AppSettings
  currentDate: Date

  // Actions
  setRawEvents: (events: RawEvent[]) => void
  setPeople: (people: Map<string, Person>) => void
  setShifts: (shifts: Shift[]) => void
  setMergedShifts: (shifts: MergedShift[]) => void

  updateSettings: (settings: Partial<AppSettings>) => void
  setCurrentDate: (date: Date) => void
  updateColorAssignment: (personName: string, color: string) => void
}

const defaultSettings: AppSettings = {
  view: 'monthly',
  paperSize: 'letter',
  orientation: 'portrait',
  timezone: 'America/Los_Angeles',
  timeFormat: '24h',
  colorAssignments: {},
}

// Get initial settings from localStorage or use defaults
const getInitialSettings = (): AppSettings => {
  const stored = settingsStorage.load()
  return stored ? { ...defaultSettings, ...stored } : defaultSettings
}

export const useCalendarStore = create<CalendarState>((set) => ({
  // Initial state
  rawEvents: [],
  people: new Map(),
  shifts: [],
  mergedShifts: [],
  settings: getInitialSettings(),
  currentDate: new Date(),

  // Actions
  setRawEvents: (events) => set({ rawEvents: events }),
  setPeople: (people) => set({ people }),
  setShifts: (shifts) => set({ shifts }),
  setMergedShifts: (shifts) => set({ mergedShifts: shifts }),

  updateSettings: (newSettings) =>
    set((state) => {
      const updated = { ...state.settings, ...newSettings }
      settingsStorage.save(updated)
      return { settings: updated }
    }),

  setCurrentDate: (date) => set({ currentDate: date }),

  updateColorAssignment: (personName, color) =>
    set((state) => {
      const updated = {
        ...state.settings,
        colorAssignments: {
          ...state.settings.colorAssignments,
          [personName]: color,
        },
      }
      settingsStorage.save(updated)
      return { settings: updated }
    }),
}))
