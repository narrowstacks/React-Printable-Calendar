import { useMemo, forwardRef } from "react";
import { format } from "date-fns";
import { useCalendarStore } from "../../store/calendarStore";
import { mergeShifts } from "../../lib/grouping/shiftMerger";
import {
  buildWeekCalendar,
  detectTimeRange,
} from "../../lib/calendar/weekBuilder";
import WeekGrid from "./WeekGrid";
import Legend from "../shared/Legend";

const WeeklyView = forwardRef<HTMLDivElement>((_, printRef) => {
  const { rawEvents, people, currentDate, settings } = useCalendarStore();

  const { days, startHour, endHour } = useMemo(() => {
    if (rawEvents.length === 0) {
      return { days: [], startHour: 6, endHour: 23 };
    }

    const { shifts: _, mergedShifts } = mergeShifts(
      rawEvents,
      people,
      settings.colorAssignments
    );
    const days = buildWeekCalendar(currentDate, [], mergedShifts);
    const { startHour, endHour } = detectTimeRange(days);

    return { days, startHour, endHour };
  }, [rawEvents, people, currentDate, settings.colorAssignments]);

  if (rawEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <p>
          No calendar data loaded. Please upload an ICS file or provide a URL.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={printRef}
      className={`
        bg-white rounded-lg shadow calendar-container
        ${settings.orientation === "landscape" ? "landscape" : "portrait"}
      `}
    >
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
          timezone={settings.timezone}
          timeFormat={settings.timeFormat}
          colorAssignments={settings.colorAssignments}
          startHour={startHour}
          endHour={endHour}
        />
        <div className="legend-section mt-8 border-t pt-6">
          <Legend
            people={Array.from(people.values())}
            colorAssignments={settings.colorAssignments}
          />
        </div>
      </div>
    </div>
  );
});

WeeklyView.displayName = "WeeklyView";

export default WeeklyView;
