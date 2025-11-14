import { useState, useRef } from 'react'
import { useCalendarStore } from './store/calendarStore'
import FileUpload from './components/layout/FileUpload'
import CalendarControls from './components/layout/CalendarControls'
import MonthlyView from './components/monthly/MonthlyView'
import WeeklyView from './components/weekly/WeeklyView'
import SettingsPanel from './components/settings/SettingsPanel'

function App() {
  const { settings } = useCalendarStore()
  const [showSettings, setShowSettings] = useState(false)
  const monthlyPrintRef = useRef<HTMLDivElement>(null)
  const weeklyPrintRef = useRef<HTMLDivElement>(null)

  const currentPrintRef = settings.view === 'monthly' ? monthlyPrintRef : weeklyPrintRef

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Printable Calendar</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload & Controls */}
        <div className="space-y-6">
          <FileUpload />
          <CalendarControls
            onSettingsClick={() => setShowSettings(!showSettings)}
            printRef={currentPrintRef}
          />
        </div>

        {/* Calendar View */}
        <div className="mt-8">
          {settings.view === 'monthly' ? (
            <MonthlyView ref={monthlyPrintRef} />
          ) : (
            <WeeklyView ref={weeklyPrintRef} />
          )}
        </div>
      </main>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
