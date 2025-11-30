import { useCalendarStore } from '../../store/calendarStore'
import { getPersonColor } from '../../lib/color/colorUtils'

export default function ColorCustomizer() {
  const { people, settings, updateColorAssignment } = useCalendarStore()

  // Convert Map to sorted array for display
  const personList = Array.from(people.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  const handleColorChange = (personName: string, color: string) => {
    updateColorAssignment(personName, color)
  }

  if (personList.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No people loaded. Upload a calendar file to customize colors.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {personList.map((person) => {
        const displayColor = getPersonColor(person, settings.colorAssignments)

        return (
          <div key={person.id} className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 flex-1 truncate">
              {person.name}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={displayColor}
                onChange={(e) => handleColorChange(person.name, e.target.value)}
                className="w-10 h-10 border-2 border-gray-300 rounded cursor-pointer hover:border-gray-400"
                title={`Change color for ${person.name}`}
              />
              <span className="text-xs text-gray-500 font-mono">
                {displayColor.toUpperCase()}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
