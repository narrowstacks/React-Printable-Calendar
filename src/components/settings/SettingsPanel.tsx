import { useState } from 'react'
import { useCalendarStore } from '../../store/calendarStore'
import ColorCustomizer from './ColorCustomizer'

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
]

interface SettingsPanelProps {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings } = useCalendarStore()
  const [showColorCustomizer, setShowColorCustomizer] = useState(false)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold">Settings</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6 max-h-96 overflow-y-auto">
          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => updateSettings({ timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Time Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="timeFormat"
                  value="24h"
                  checked={settings.timeFormat === '24h'}
                  onChange={(e) => updateSettings({ timeFormat: e.target.value as '24h' | '12h' })}
                  className="mr-2"
                />
                <span className="text-sm">24-hour (e.g., 14:30)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="timeFormat"
                  value="12h"
                  checked={settings.timeFormat === '12h'}
                  onChange={(e) => updateSettings({ timeFormat: e.target.value as '24h' | '12h' })}
                  className="mr-2"
                />
                <span className="text-sm">12-hour (e.g., 2:30 PM)</span>
              </label>
            </div>
          </div>

          {/* Paper Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paper Size
            </label>
            <select
              value={settings.paperSize}
              onChange={(e) => updateSettings({ paperSize: e.target.value as 'letter' | 'a4' | 'legal' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="letter">US Letter (8.5" x 11")</option>
              <option value="a4">A4 (210mm x 297mm)</option>
              <option value="legal">US Legal (8.5" x 14")</option>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Orientation
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="orientation"
                  value="portrait"
                  checked={settings.orientation === 'portrait'}
                  onChange={(e) => updateSettings({ orientation: e.target.value as 'portrait' | 'landscape' })}
                  className="mr-2"
                />
                <span className="text-sm">Portrait</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="orientation"
                  value="landscape"
                  checked={settings.orientation === 'landscape'}
                  onChange={(e) => updateSettings({ orientation: e.target.value as 'portrait' | 'landscape' })}
                  className="mr-2"
                />
                <span className="text-sm">Landscape</span>
              </label>
            </div>
          </div>

          {/* Color Customization */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowColorCustomizer(!showColorCustomizer)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-between font-medium text-gray-700"
            >
              <span>Customize Person Colors</span>
              <span className="text-sm">{showColorCustomizer ? '▼' : '▶'}</span>
            </button>
            {showColorCustomizer && (
              <div className="mt-3 pl-3 pr-1 max-h-64 overflow-y-auto">
                <ColorCustomizer />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
