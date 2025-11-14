import { AppSettings } from '../types'

const SETTINGS_KEY = 'calendar_settings'
const ICS_CACHE_KEY = 'calendar_ics_cache'
const ICS_TIMESTAMP_KEY = 'calendar_ics_timestamp'

export interface ICSCache {
  content: string
  sourceUrl?: string
  timestamp: number
}

/**
 * Settings Storage - persists user preferences to localStorage
 */
export const settingsStorage = {
  save: (settings: AppSettings) => {
    try {
      // Convert Map to object for serialization
      const serializable = {
        ...settings,
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(serializable))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  },

  load: (): AppSettings | null => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (!stored) return null
      return JSON.parse(stored) as AppSettings
    } catch (error) {
      console.error('Failed to load settings:', error)
      return null
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(SETTINGS_KEY)
    } catch (error) {
      console.error('Failed to clear settings:', error)
    }
  },
}

/**
 * ICS Cache Storage - persists loaded ICS file content to localStorage
 */
export const icsStorage = {
  save: (content: string, sourceUrl?: string) => {
    try {
      const cache: ICSCache = {
        content,
        sourceUrl,
        timestamp: Date.now(),
      }
      localStorage.setItem(ICS_CACHE_KEY, JSON.stringify(cache))
      localStorage.setItem(ICS_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.error('Failed to save ICS cache:', error)
    }
  },

  load: (): ICSCache | null => {
    try {
      const stored = localStorage.getItem(ICS_CACHE_KEY)
      if (!stored) return null
      return JSON.parse(stored) as ICSCache
    } catch (error) {
      console.error('Failed to load ICS cache:', error)
      return null
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(ICS_CACHE_KEY)
      localStorage.removeItem(ICS_TIMESTAMP_KEY)
    } catch (error) {
      console.error('Failed to clear ICS cache:', error)
    }
  },

  getTimestamp: (): number | null => {
    try {
      const timestamp = localStorage.getItem(ICS_TIMESTAMP_KEY)
      return timestamp ? parseInt(timestamp, 10) : null
    } catch (error) {
      console.error('Failed to get ICS cache timestamp:', error)
      return null
    }
  },

  /**
   * Get a human-readable timestamp of when the cache was last updated
   */
  getLastUpdateTime: (): string | null => {
    const timestamp = icsStorage.getTimestamp()
    if (!timestamp) return null
    return new Date(timestamp).toLocaleString()
  },
}

/**
 * Combined storage utility - clear all cached data
 */
export const storageManager = {
  clearAll: () => {
    settingsStorage.clear()
    icsStorage.clear()
  },

  clearSettings: () => {
    settingsStorage.clear()
  },

  clearICS: () => {
    icsStorage.clear()
  },
}
