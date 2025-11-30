import { ShiftPosition } from "../../lib/calendar/weekBuilder";
import { TimeFormat } from "../../types";
import { formatTimeRange } from "../../lib/calendar/timeFormatter";
import { getShiftBackgroundStyle, getContrastTextColor } from "../../lib/color/colorUtils";

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
  const backgroundStyle = getShiftBackgroundStyle(shift, colorAssignments, position.displayColor);
  const textColor = getContrastTextColor(position.displayColor);

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
      className="absolute shift-block text-white"
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
        overflow: "visible", // Allow text to overflow if needed for print
      }}
    >
      {/* Content wrapper with padding */}
      <div
        className="px-1.5 py-0.5 text-xs"
        style={{
          textAlign: textAlignment as any,
          whiteSpace: "normal",
          wordBreak: "break-word",
        }}
      >
        {/* People names - each on separate line */}
        <div className="font-semibold" style={{ lineHeight: 1.3 }}>
          {shift.people.length <= 3 ? (
            // Show all names for 1-3 people
            shift.people.map((p) => (
              <div key={p.id}>
                {p.name}
              </div>
            ))
          ) : (
            // Show abbreviated for 4+ people
            <>
              {shift.people.slice(0, 2).map((p) => (
                <div key={p.id}>
                  {p.name}
                </div>
              ))}
              <div className="text-xs italic">+{shift.people.length - 2}</div>
            </>
          )}
        </div>

        {/* Time */}
        <div className="text-xs opacity-90" style={{ lineHeight: 1.3, whiteSpace: "nowrap" }}>
          {formatTimeRange(shift.start, shift.end, timezone, timeFormat)}
        </div>
      </div>
    </div>
  );
}
