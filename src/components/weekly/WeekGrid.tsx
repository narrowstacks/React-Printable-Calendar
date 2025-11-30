import { CalendarDay, TimeFormat } from "../../types";
import { generateTimeSlots } from "../../lib/calendar/weekBuilder";
import { formatTime } from "../../lib/calendar/timeFormatter";
import { HOUR_HEIGHT } from "../../lib/config/printConfig";
import DayColumn from "./DayColumn";

interface WeekGridProps {
  days: CalendarDay[];
  timezone: string;
  timeFormat: TimeFormat;
  colorAssignments: Record<string, string>;
  startHour: number;
  endHour: number;
}

export default function WeekGrid({
  days,
  timezone,
  timeFormat,
  colorAssignments,
  startHour,
  endHour,
}: WeekGridProps) {
  const timeSlots = generateTimeSlots(startHour, endHour);

  return (
    <div className="week-grid-container overflow-x-auto">
      {/* Main grid container */}
      <div className="flex border border-gray-200 rounded">
        {/* Time axis */}
        <div className="flex-shrink-0 w-16 border-r border-gray-200">
          <div className="h-12 border-b border-gray-200"></div>
          {timeSlots.map((hour) => {
            const hourDate = new Date();
            hourDate.setHours(hour, 0, 0, 0);
            return (
              <div
                key={hour}
                className="border-b border-gray-100 text-xs text-gray-600 p-1 text-right"
                style={{ height: HOUR_HEIGHT }}
              >
                {formatTime(hourDate, timezone, timeFormat).split("-")[0]}
              </div>
            );
          })}
        </div>

        {/* Days columns */}
        <div className="flex flex-1">
          {days.map((day) => (
            <DayColumn
              key={day.date.toISOString()}
              day={day}
              timeSlots={timeSlots}
              hourHeight={HOUR_HEIGHT}
              timezone={timezone}
              timeFormat={timeFormat}
              colorAssignments={colorAssignments}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
