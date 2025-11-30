import { CalendarView } from "../../types";

interface ViewToggleProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onViewChange("monthly")}
        className={`px-4 py-2 rounded-lg font-medium ${
          currentView === "monthly"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onViewChange("weekly")}
        className={`px-4 py-2 rounded-lg font-medium ${
          currentView === "weekly"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        Weekly
      </button>
    </div>
  );
}
