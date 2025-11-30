import { Person, Shift } from '../../types'

/**
 * Centralized color resolution for consistent color handling across the app.
 * Priority order: colorAssignments > person.colorOverride > person.color
 */
export function getPersonColor(
  person: Person,
  colorAssignments: Record<string, string> = {}
): string {
  return colorAssignments[person.name] || person.colorOverride || person.color
}

/**
 * Get the display color for a shift based on its people.
 * Returns the first person's color or gray if no people assigned.
 */
export function getShiftColor(
  shift: Shift,
  colorAssignments: Record<string, string> = {}
): string {
  if (shift.people.length === 0) {
    return '#d1d5db' // gray for unassigned
  }

  return getPersonColor(shift.people[0], colorAssignments)
}

/**
 * Get all unique colors for people in a shift (for gradients)
 */
export function getShiftColors(
  shift: Shift,
  colorAssignments: Record<string, string> = {}
): string[] {
  const colors = shift.people.map(person => getPersonColor(person, colorAssignments))
  return Array.from(new Set(colors))
}

/**
 * Determine appropriate text color based on background luminance
 */
export function getContrastTextColor(bgColor: string): string {
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Generate a background style object for a shift.
 * Returns solid color for single person, gradient for multiple.
 */
export function getShiftBackgroundStyle(
  shift: Shift,
  colorAssignments: Record<string, string> = {},
  defaultColor: string
): React.CSSProperties {
  if (shift.people.length <= 1) {
    return { backgroundColor: defaultColor }
  }

  const uniqueColors = getShiftColors(shift, colorAssignments)

  if (uniqueColors.length === 1) {
    return { backgroundColor: uniqueColors[0] }
  }

  const gradientStops = uniqueColors
    .map((color, index) => {
      const percentage = (index / (uniqueColors.length - 1)) * 100
      return `${color} ${percentage}%`
    })
    .join(', ')

  return {
    background: `linear-gradient(135deg, ${gradientStops})`,
  }
}
