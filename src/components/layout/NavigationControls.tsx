import { addMonths, addWeeks, format } from "date-fns";
import { CalendarView } from "../../types";

interface NavigationControlsProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
}

export default function NavigationControls({
  currentDate,
  view,
  onDateChange,
}: NavigationControlsProps) {
  const handlePrevious = () => {
    if (view === "monthly") {
      onDateChange(addMonths(currentDate, -1));
    } else {
      onDateChange(addWeeks(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === "monthly") {
      onDateChange(addMonths(currentDate, 1));
    } else {
      onDateChange(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const dateLabel =
    view === "monthly"
      ? format(currentDate, "MMMM yyyy")
      : `Week of ${format(currentDate, "MMM d, yyyy")}`;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePrevious}
        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        ← Previous
      </button>
      <button
        onClick={handleToday}
        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Today
      </button>
      <button
        onClick={handleNext}
        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Next →
      </button>
      <span className="text-lg font-semibold text-gray-700 min-w-48">
        {dateLabel}
      </span>
    </div>
  );
}
