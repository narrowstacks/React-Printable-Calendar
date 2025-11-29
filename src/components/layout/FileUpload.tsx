import { useRef, useState, useEffect } from 'react'
import { useCalendarStore } from '../../store/calendarStore'
import { parseICSFile, parseICSString } from '../../lib/parsers/icsParser'
import { extractPeopleAndTitle, generatePersonId } from '../../lib/parsers/nameExtractor'
import { Person, RawEvent } from '../../types'
import { icsStorage, storageManager } from '../../lib/storage'

export default function FileUpload() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [cachedICS, setCachedICS] = useState<string | null>(null)
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setRawEvents, setPeople } = useCalendarStore()

  // Load cache info on component mount
  useEffect(() => {
    const cache = icsStorage.load()
    if (cache) {
      setCachedICS(cache.content)
      setCacheTimestamp(icsStorage.getLastUpdateTime())
    }
  }, [])

  const handleFileSelect = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const fileContent = await file.text()
      const events = await parseICSFile(file)

      // Cache the ICS content
      icsStorage.save(fileContent, file.name)
      setCachedICS(fileContent)
      setCacheTimestamp(icsStorage.getLastUpdateTime())

      await processEvents(events)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleURLSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      let icsContent: string | null = null
      let lastError: Error | null = null

      // Try direct fetch first
      try {
        const response = await fetch(urlInput)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        icsContent = await response.text()
      } catch (directErr) {
        lastError = directErr instanceof Error ? directErr : new Error(String(directErr))

        // If direct fetch fails (likely CORS), try with CORS proxy
        if (lastError.message.includes('Failed to fetch')) {
          try {
            const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlInput)}`
            const proxyResponse = await fetch(corsProxyUrl)
            if (!proxyResponse.ok) {
              throw new Error(`Proxy error! status: ${proxyResponse.status}`)
            }
            icsContent = await proxyResponse.text()
          } catch (proxyErr) {
            // If proxy also fails, use the original error
            throw lastError
          }
        } else {
          throw lastError
        }
      }

      if (!icsContent) {
        throw new Error('Failed to retrieve calendar data')
      }

      // Cache the ICS content
      icsStorage.save(icsContent, urlInput)
      setCachedICS(icsContent)
      setCacheTimestamp(icsStorage.getLastUpdateTime())

      // Parse the ICS content
      const events = parseICSString(icsContent)

      await processEvents(events)
      setUrlInput('')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to load calendar: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadFromCache = async () => {
    if (!cachedICS) return

    setIsLoading(true)
    setError(null)

    try {
      // Parse the cached ICS content directly
      const events = await parseICSFile(new File([cachedICS], 'cached.ics', { type: 'text/calendar' }))
      await processEvents(events)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load from cache')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear the cached calendar? This will not affect your settings.')) {
      storageManager.clearICS()
      setCachedICS(null)
      setCacheTimestamp(null)
      setError(null)
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear both the cached calendar AND all your settings? This action cannot be undone.')) {
      storageManager.clearAll()
      setCachedICS(null)
      setCacheTimestamp(null)
      setError(null)
    }
  }

  const processEvents = (events: RawEvent[]) => {
    // Extract people from events
    const peopleMap = new Map<string, Person>()
    const defaultColors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
      '#06b6d4', '#84cc16', '#f43f5e', '#0d9488'
    ]

    let colorIndex = 0

    events.forEach(event => {
      const { names } = extractPeopleAndTitle(event.summary)

      names.forEach(name => {
        if (!peopleMap.has(name)) {
          const color = defaultColors[colorIndex % defaultColors.length]
          peopleMap.set(name, {
            id: generatePersonId(name),
            name,
            color,
            colorOverride: undefined,
          })
          colorIndex++
        }
      })
    })

    setRawEvents(events)
    setPeople(peopleMap)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Import Calendar</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload ICS File
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ics"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0]
            if (file) handleFileSelect(file)
          }}
          disabled={isLoading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50"
        />
      </div>

      {/* URL Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Paste ICS URL
        </label>
        <form onSubmit={handleURLSubmit} className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/calendar.ics"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Loading...' : 'Load'}
          </button>
        </form>
      </div>

      {/* Cached Calendar Section */}
      {cachedICS && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Cached Calendar</h3>
          <p className="text-sm text-blue-800 mb-3">
            Last updated: {cacheTimestamp || 'Unknown'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleLoadFromCache}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 text-sm font-medium"
            >
              {isLoading ? 'Loading...' : 'Load from Cache'}
            </button>
            <button
              onClick={handleClearCache}
              disabled={isLoading}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Clear All Button */}
      <div className="text-center pt-4 border-t border-gray-200">
        <button
          onClick={handleClearAll}
          disabled={isLoading}
          className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:text-gray-400"
        >
          Clear All Data (Cache + Settings)
        </button>
      </div>

      {isLoading && (
        <div className="mt-4 text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          Processing calendar...
        </div>
      )}
    </div>
  )
}
