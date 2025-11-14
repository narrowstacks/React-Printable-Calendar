# React Printable Calendar

A powerful React application for ingesting ICS (iCalendar) files and generating clean, customizable printable work schedules. Perfect for managing multi-person shift assignments with automatic grouping of people working the same shifts.

## Features

✨ **Multiple Calendar Views**
- **Monthly View**: Compact overview with all shifts visible in each day cell
- **Weekly View**: Time-based grid showing detailed hourly shifts for each day

🔄 **Smart Shift Grouping**
- Automatically merges shifts when multiple people work identical times
- Groups people in the same column instead of creating separate columns
- Displays abbreviated names with expandable lists for 3+ people per shift

📅 **ICS File Handling**
- Parse ICS files via file upload or URL
- Automatic detection of recurring events (RRULE support)
- Extracts person names and shift titles from event summaries
- Flexible name parsing supporting multiple formats:
  - "John Doe - Morning Shift"
  - "Morning Shift: Jane Smith, John Doe"
  - "John, Jane, Mike (Evening)"

🎨 **Color Management**
- Automatic color assignment from configurable palette
- Support for parsing colors from ICS events
- User-overrideable color assignments per person
- High-contrast text for better readability

🖨️ **Print & Export**
- Print-optimized layouts for both views
- Support for multiple paper sizes (Letter, A4, Legal)
- Portrait and landscape orientations
- Browser print dialog integration for PDF export
- Minimal visual clutter for professional output

⚙️ **Built with Modern Tech Stack**
- React 18 with TypeScript for type safety
- Vite for lightning-fast builds
- Tailwind CSS with print-optimized utilities
- Zustand for lightweight state management
- `ical.js` for robust ICS parsing with recurrence rule support
- `date-fns` for reliable date/time operations

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173` by default.

### Usage

1. **Load a Calendar**
   - Upload an ICS file using the file picker
   - Or paste a URL to an ICS file

2. **View Your Schedule**
   - Toggle between Monthly and Weekly views
   - Navigate between time periods with Previous/Next buttons
   - Go to Today to return to current date

3. **Customize**
   - Click Settings to adjust paper size and orientation
   - Override person colors in the settings panel
   - Print directly from the browser

4. **Export**
   - Use the Print button to open browser print dialog
   - Save as PDF from print dialog
   - Layouts are optimized for both screen and print

## Project Structure

```
src/
├── components/
│   ├── layout/              # Header, controls, file upload
│   ├── monthly/             # Monthly view components
│   ├── weekly/              # Weekly view components
│   └── shared/              # Reusable components (Legend, etc)
├── lib/
│   ├── parsers/             # ICS parsing and name extraction
│   ├── grouping/            # Shift merging and grouping logic
│   └── calendar/            # Month/week building helpers
├── store/                   # Zustand state management
├── styles/                  # Tailwind CSS with print styles
├── types/                   # TypeScript interfaces
└── App.tsx                  # Main application component
```

## Data Flow

1. **ICS Parsing** → Raw events extracted from ICS using `ical.js`
2. **Name Extraction** → Person names parsed from event summaries
3. **Shift Grouping** → Events merged by (start time, end time, title)
4. **Calendar Building** → Month/week structure created with date-fns
5. **Rendering** → Calendar views display merged shifts with people grouped
6. **Print** → Tailwind print utilities optimize layout for paper

## ICS Format Support

### Supported Event Properties
- `DTSTART` / `DTEND` - Event timing
- `SUMMARY` - Event title (parsed for names and shift title)
- `LOCATION` - Event location
- `DESCRIPTION` - Event description
- `RRULE` - Recurring event rules
- `COLOR` / `BGCOLOR` - Event color

### Name Parsing Examples

The application intelligently parses person names from event summaries:

```
Input Summary                      → Names                → Title
────────────────────────────────   ──────────────────     ────────────────
John Doe - Morning Shift           John Doe              Morning Shift
Morning Shift: Jane, John          Jane, John            Morning Shift
John, Jane, Mike (Evening)         John, Jane, Mike      Evening
Shift Cover - Alice                Alice                 Shift Cover
```

## Grouping Algorithm

When multiple events have **identical start time, end time, and title**, they are automatically merged into a single "shift" with multiple people listed. This prevents duplicate columns and keeps schedules clean.

Example:
```
ICS Events                     → Merged Result
──────────────────────         ──────────────────
9:00-17:00 Morning: John       9:00-17:00 Morning
9:00-17:00 Morning: Jane       John, Jane
9:00-17:00 Morning: Mike       Mike
```

In the calendar views, this appears as one cell/block with "John, Jane, +1 more" (expandable to show all names).

## Overlapping Shifts

The weekly view automatically detects and displays overlapping shifts from the same day in separate columns, with proper visual positioning based on start/end times.

## Color Palette

Default automatic color assignment uses a 12-color palette:

```
Blue, Red, Green, Amber, Purple, Pink,
Teal, Lime, Rose, Cyan, Lime, Teal
```

Colors are assigned round-robin to new people. Users can override any person's color in settings.

## Print Styles

Print output is optimized via Tailwind CSS `@media print`:

- Removes UI controls and buttons
- Maintains colors with `print-color-adjust: exact`
- Supports multiple paper sizes
- Prevents page breaks within shifts
- Professional, clean appearance

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## Technologies Used

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | ^18.2.0 | UI framework |
| TypeScript | ^5.3.0 | Type safety |
| Vite | ^5.0.0 | Build tool |
| Tailwind CSS | ^3.3.0 | Styling & print |
| Zustand | ^4.4.0 | State management |
| ical.js | ^2.1.0 | ICS parsing |
| date-fns | ^3.0.0 | Date operations |
| react-to-print | ^2.14.15 | Print integration |

## Future Enhancements

- Server-side PDF generation with Puppeteer
- Export to Excel/CSV
- Settings persistence (localStorage)
- Dark mode toggle
- Multi-language support
- Timezone handling
- Conflict highlighting
- Shift templates
- Customizable shift type colors
- Team-based sharing

## License

See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
