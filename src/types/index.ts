export interface Person {
  id: string;
  name: string;
  color: string;           // Hex color
  colorOverride?: string;  // User-assigned override
}

export interface RawEvent {
  id: string;
  summary: string;          // e.g., "John Doe - Morning Shift"
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  color?: string;           // From ICS if available
  rrule?: string;           // Recurrence rule
  uid?: string;             // Original UID for tracking recurring event
  recurrenceId?: Date;      // RECURRENCE-ID: identifies specific instance of recurring event
  isException?: boolean;    // True if this is a modified instance (has RECURRENCE-ID)
  isDeleted?: boolean;      // True if occurrence is excluded via EXDATE
}

export interface Shift {
  id: string;
  title: string;            // e.g., "Morning Shift"
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  people: Person[];         // All people working this shift
}

export interface MergedShift {
  shiftKey: string;         // Hash: `${start}-${end}-${title}`
  shift: Shift;
  peopleList: string;       // "John, Jane, Mike"
  displayColor: string;     // Blended or dominant color
}

export interface CalendarDay {
  date: Date;
  shifts: MergedShift[];
  isToday: boolean;
  isWeekend: boolean;
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

export type CalendarView = 'monthly' | 'weekly';
export type TimeFormat = '12h' | '24h';

export interface AppSettings {
  view: CalendarView;
  paperSize: 'letter' | 'a4' | 'legal';
  orientation: 'portrait' | 'landscape';
  timezone: string; // IANA timezone (e.g., 'America/Los_Angeles')
  timeFormat: TimeFormat; // '12h' or '24h'
  colorAssignments: Record<string, string>; // person name -> hex color
}
