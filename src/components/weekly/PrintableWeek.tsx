import { format } from "date-fns";
import { CalendarDay, TimeFormat } from "../../types";
import WeekGrid from "./WeekGrid";

interface PrintableWeekProps {
  days: CalendarDay[];
  startHour: number;
  endHour: number;
  timezone: string;
  timeFormat: TimeFormat;
  colorAssignments: Record<string, string>;
}

export default function PrintableWeek({
  days,
  startHour,
  endHour,
  timezone,
  timeFormat,
  colorAssignments,
}: PrintableWeekProps) {
  return (
    <div className="bg-white rounded-lg shadow calendar-container landscape">
      <div className="p-6">
        {days.length > 0 && (
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-gray-700">
              Week of {format(days[0].date, "MMMM d")} -{" "}
              {format(days[days.length - 1].date, "MMMM d")},{" "}
              {format(days[0].date, "yyyy")}
            </h2>
          </div>
        )}
        <WeekGrid
          days={days}
          timezone={timezone}
          timeFormat={timeFormat}
          colorAssignments={colorAssignments}
          startHour={startHour}
          endHour={endHour}
        />
      </div>
    </div>
  );
}
