import { ShiftPosition } from "../../lib/calendar/weekBuilder";
import { TimeFormat, Shift, Person } from "../../types";
import { formatTimeRange } from "../../lib/calendar/timeFormatter";

interface ShiftBlockProps {
  position: ShiftPosition;
  hourHeight: number;
  timezone: string;
  timeFormat: TimeFormat;
  colorAssignments: Record<string, string>;
}

export default function ShiftBlock({
  position,
  hourHeight,
  timezone,
  timeFormat,
  colorAssignments,
}: ShiftBlockProps) {
  const { shift, rowStart, rowEnd, zIndex, indexInGroup } = position;

  // Calculate dimensions
  const height = rowEnd - rowStart;
  const LAYER_OFFSET = 3; // pixels of offset per layer
  const offsetY = indexInGroup * LAYER_OFFSET;

  // Get background (gradient for multiple people, solid color for single)
  const backgroundStyle = getBackgroundStyle(shift, colorAssignments, position.displayColor);
  const textColor = getTextColor(position.displayColor);

  // Text always at top, alternate alignment for readability when stacked
  const textAlignment =
    indexInGroup % 3 === 0
      ? "left"
      : indexInGroup % 3 === 1
      ? "center"
      : "right";

  const topPx = Math.round((rowStart / 60) * hourHeight + offsetY);
  const heightPx = Math.round((height / 60) * hourHeight);

  return (
    <div
      className="absolute shift-block text-white overflow-hidden"
      style={{
        top: `${topPx}px`,
        bottom: "auto",
        height: `${heightPx}px`,
        left: `0px`,
        right: `0px`,
        ...backgroundStyle,
        color: textColor,
        zIndex,
        opacity: 0.92 - indexInGroup * 0.08, // Slight transparency for stacked layers
        border: `2px solid ${position.displayColor}`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Content wrapper with padding */}
      <div
        className="px-2 py-1 text-xs overflow-hidden"
        style={{
          textAlign: textAlignment as any,
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflow: "hidden",
        }}
      >
        {/* People names - always at top, only shown once */}
        <div className="font-semibold leading-tight">
          {shift.people.length <= 3 ? (
            // Show all names for 1-3 people
            shift.people.map((p) => (
              <div key={p.id} className="break-words">
                {p.name}
              </div>
            ))
          ) : (
            // Show abbreviated for 4+ people
            <>
              {shift.people.slice(0, 2).map((p) => (
                <div key={p.id} className="break-words">
                  {p.name}
                </div>
              ))}
              <div className="text-xs italic">+{shift.people.length - 2}</div>
            </>
          )}
        </div>

        {/* Shift title
        <div className="font-semibold leading-tight mt-1">
          {shift.title}
        </div> */}

        {/* Time - shown only once */}
        <div className="text-xs leading-tight opacity-90 mt-1">
          {formatTimeRange(shift.start, shift.end, timezone, timeFormat)}
        </div>
      </div>
    </div>
  );
}

function getBackgroundStyle(
  shift: Shift,
  colorAssignments: Record<string, string>,
  defaultColor: string
): React.CSSProperties {
  // If single person or no people, use solid color
  if (shift.people.length <= 1) {
    return { backgroundColor: defaultColor };
  }

  // Get unique colors from all people in the shift
  const colors = shift.people.map((person: Person) => {
    return colorAssignments[person.name] || person.color;
  });

  // Remove duplicates
  const uniqueColors = Array.from(new Set(colors));

  // If all people have the same color, use solid color
  if (uniqueColors.length === 1) {
    return { backgroundColor: uniqueColors[0] };
  }

  // Create a gradient from all unique colors
  const gradientStops = uniqueColors
    .map((color, index) => {
      const percentage = (index / (uniqueColors.length - 1)) * 100;
      return `${color} ${percentage}%`;
    })
    .join(", ");

  return {
    background: `linear-gradient(135deg, ${gradientStops})` as any,
  };
}

function getTextColor(bgColor: string): string {
  // Simple luminance calculation
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
}
