# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development**: `npm run dev` - Starts Vite dev server
- **Build**: `npm run build` - TypeScript check + Vite production build
- **Preview**: `npm run preview` - Preview production build locally

## Architecture

This is a React + TypeScript calendar app for importing ICS files and generating printable PDF calendars with shift/person grouping.

### Data Flow

1. **ICS Parsing** (`src/lib/parsers/icsParser.ts`): Parses ICS files using ical.js, handles recurring events (RRULE), exceptions (RECURRENCE-ID), and exclusions (EXDATE). Expands recurring events for 2 years.

2. **Name Extraction** (`src/lib/parsers/nameExtractor.ts`): Extracts person names and shift titles from event summaries using pattern matching (e.g., "John Doe - Morning Shift" → name: "John Doe", title: "Morning Shift").

3. **Shift Merging** (`src/lib/grouping/shiftMerger.ts`): Groups events by (start time, end time, title) into shifts with multiple people. Creates `MergedShift` objects with display color based on assigned people.

4. **Store** (`src/store/calendarStore.ts`): Zustand store holds `rawEvents`, `people` (Map), `shifts`, `mergedShifts`, `settings`, and `currentDate`. Settings persist to localStorage.

### Key Types (`src/types/index.ts`)

- `RawEvent`: Parsed ICS event with recurrence metadata
- `Person`: Name + assigned color
- `Shift`: Time slot with multiple people
- `MergedShift`: Display-ready shift with blended color and people list
- `AppSettings`: View (monthly/weekly), paper size, timezone, time format, color assignments

### Component Structure

- `MonthlyView`/`WeeklyView`: Main calendar views with print refs
- `CalendarControls`: Navigation, view toggle, print buttons
- `FileUpload`: ICS file/URL import with localStorage caching
- `SettingsPanel`/`ColorCustomizer`: Settings UI

### Print System

- Uses html2pdf.js for PDF generation
- `printStyler.ts`: Applies inline styles for PDF (html2canvas doesn't use @media print)
- `printConfig.ts`: Paper size scale factors (letter/legal/a4/tabloid)
- Scaling applied to hour heights, shift block positions, and text sizes

### Styling

- Tailwind CSS with custom print classes
- Print-specific scaling handled programmatically, not via CSS media queries
