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
  const timeRange = formatTimeRange(
    merged.shift.start,
    merged.shift.end,
    timezone,
    timeFormat
  );

  return (
    <div
      className="shift-block text-white text-xs"
      style={{ backgroundColor: merged.displayColor }}
    >
      <div className="font-semibold">{merged.shift.title}</div>
      <div className="text-xs opacity-90">{timeRange}</div>
    </div>
  );
}
