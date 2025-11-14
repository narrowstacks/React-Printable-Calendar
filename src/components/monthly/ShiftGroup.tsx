import { useState } from "react";
import { MergedShift, TimeFormat } from "../../types";
import { formatTimeRange } from "../../lib/calendar/timeFormatter";

interface ShiftGroupProps {
  merged: MergedShift;
  timezone: string;
  timeFormat: TimeFormat;
}

export default function ShiftGroup({
  merged,
  timezone,
  timeFormat,
}: ShiftGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const timeRange = formatTimeRange(
    merged.shift.start,
    merged.shift.end,
    timezone,
    timeFormat
  );

  const isExpandable = merged.shift.people.length > 3;

  return (
    <div
      className="shift-block text-white text-xs"
      style={{ backgroundColor: merged.displayColor }}
    >
      {/* Title and time */}
      <div className="font-semibold">{merged.shift.title}</div>
      <div className="text-xs opacity-90">{timeRange}</div>

      {/* People list
      <div className="mt-1 text-xs">
        {expanded || !isExpandable ? (
          // Show all names
          <div>
            {merged.shift.people.map((person) => (
              <div key={person.id}>{person.name}</div>
            ))}
          </div>
        ) : (
          // Show abbreviated list with expand button
          <div>
            <div>{merged.peopleList}</div>
            <button
              onClick={() => setExpanded(true)}
              className="text-xs underline opacity-75 hover:opacity-100 mt-1"
            >
              Show all
            </button>
          </div>
        )}
      </div> */}

      {/* Collapse button */}
      {expanded && isExpandable && (
        <button
          onClick={() => setExpanded(false)}
          className="text-xs underline opacity-75 hover:opacity-100 mt-1"
        >
          Show less
        </button>
      )}
    </div>
  );
}
