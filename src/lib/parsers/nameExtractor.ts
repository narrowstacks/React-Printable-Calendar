/**
 * Extract person names from event summary/title
 * Supports common patterns like:
 * - "John Doe - Morning Shift"
 * - "Morning Shift: Jane Smith, John Doe"
 * - "John, Jane, Mike (Evening)"
 * - "John Doe (8:00-17:00)"
 */

export interface ExtractedData {
  names: string[]
  title: string
}

export function extractPeopleAndTitle(summary: string): ExtractedData {
  // Try different patterns
  const patterns = [
    // Pattern 1: "Name - Shift" or "Name - Title"
    /^([^-\n]+)\s*-\s*(.+)$/,
    // Pattern 2: "Title: Name1, Name2, ..."
    /^(.+?):\s*(.+)$/,
    // Pattern 3: "Name1, Name2, Name3 (Title/Time)"
    /^(.+?)\s*\((.+?)\)$/,
  ]

  let names: string[] = []
  let title = summary

  for (const pattern of patterns) {
    const match = summary.match(pattern)
    if (match) {
      const [, part1, part2] = match

      // Check if part1 looks like a name or title
      if (looksLikeName(part1)) {
        // part1 is name(s), part2 is title
        names = parseNames(part1)
        title = part2
        break
      } else if (looksLikeName(part2)) {
        // part1 is title, part2 is name(s)
        title = part1
        names = parseNames(part2)
        break
      } else {
        // part1 might be names separated by commas
        const parsed = parseNames(part1)
        if (parsed.length > 0) {
          names = parsed
          title = part2
          break
        }
      }
    }
  }

  // If no pattern matched, try to extract names as comma-separated values
  if (names.length === 0) {
    names = parseNames(summary)
    if (names.length === 0) {
      // Fallback: use the whole summary as title
      title = summary
      names = []
    }
  }

  // Clean up title
  title = title.trim()
  if (title.startsWith('-')) title = title.slice(1).trim()
  if (title.endsWith('-')) title = title.slice(0, -1).trim()

  return { names, title }
}

function looksLikeName(text: string): boolean {
  // Check if text contains capital letters and doesn't look like a common title pattern
  const titleKeywords = [
    'shift',
    'break',
    'lunch',
    'meeting',
    'standby',
    'on-call',
    'training',
    'holiday',
    'vacation',
    'sick',
    'personal',
    'day',
    'night',
    'evening',
    'morning',
    'afternoon',
  ]

  const lowerText = text.toLowerCase()

  // If it contains title keywords, it's probably a title
  if (titleKeywords.some(keyword => lowerText.includes(keyword))) {
    return false
  }

  // If it has commas, it's likely names
  if (text.includes(',')) {
    return true
  }

  // If it starts with capital letter and has at least one space
  if (/^[A-Z]/.test(text) && /\s+/.test(text)) {
    return true
  }

  return false
}

function parseNames(text: string): string[] {
  if (!text) return []

  // Split by common delimiters
  const names = text
    .split(/[,&;/]|and\s+/)
    .map(name => name.trim())
    .filter(name => {
      // Keep names that look valid
      return name.length > 0 &&
             !name.toLowerCase().includes('shift') &&
             !name.toLowerCase().includes('break') &&
             !/^\(.*\)$/.test(name) // Remove parenthetical content
    })
    .map(name => {
      // Clean up names
      // Remove time patterns like "(8:00-17:00)" or "8:00 AM"
      name = name.replace(/\s*\([^)]*\)\s*/, ' ')
      name = name.replace(/\b\d{1,2}:\d{2}\b.*$/i, '')
      return name.trim()
    })
    .filter(name => name.length > 0 && name.length < 100) // Sanity check

  return names
}

/**
 * Generate a unique ID for a person based on their name
 */
export function generatePersonId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
}
