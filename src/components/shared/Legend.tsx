import { Person } from '../../types'

interface LegendProps {
  people: Person[]
  colorAssignments?: Record<string, string>
}

export default function Legend({ people, colorAssignments = {} }: LegendProps) {
  if (people.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Legend</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {people.map(person => {
          // Prioritize custom color assignment from settings
          const displayColor = colorAssignments[person.name] || person.colorOverride || person.color

          return (
            <div key={person.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: displayColor }}
              ></div>
              <span className="text-sm">{person.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
