import html2pdf from "html2pdf.js";
import { useCalendarStore } from "../../store/calendarStore";
import { addMonths, addWeeks, format } from "date-fns";

interface CalendarControlsProps {
  onSettingsClick: () => void;
  printRef?: React.RefObject<HTMLDivElement>;
}

export default function CalendarControls({
  onSettingsClick,
  printRef,
}: CalendarControlsProps) {
  const { settings, currentDate, updateSettings, setCurrentDate } =
    useCalendarStore();

  const handlePrint = async () => {
    if (!printRef?.current) return;

    const element = printRef.current;

    const getPageSize = () => {
      const sizes: Record<string, string> = {
        letter: "letter",
        a4: "a4",
        legal: "legal",
      };
      return sizes[settings.paperSize] || "letter";
    };

    const orientation: "portrait" | "landscape" = settings.orientation === "landscape" ? "landscape" : "portrait";

    const opt = {
      margin: 0.2,
      filename: "calendar.pdf",
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: {
        unit: "in",
        format: getPageSize(),
        orientation: orientation,
        compress: true,
      },
      pagebreak: { mode: ["avoid-all"] },
    };

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Remove legend from PDF
    const legendSection = clonedElement.querySelector(".legend-section");
    if (legendSection) {
      legendSection.remove();
    }

    // Small scale factor to ensure content fits within margins
    const scaleFactor = 0.75;
    clonedElement.style.transform = `scale(${scaleFactor})`;
    clonedElement.style.transformOrigin = "top left";
    clonedElement.style.width = `${100 / scaleFactor}%`;
    clonedElement.style.height = "auto";
    clonedElement.style.margin = "0";
    clonedElement.style.padding = "0";

    // Generate PDF - use toPdf() to ensure single page
    html2pdf()
      .set(opt)
      .from(clonedElement)
      .toPdf()
      .output("bloburi")
      .then((uri: string) => {
        window.open(uri, "_blank");
      });
  };

  const handlePrevious = () => {
    if (settings.view === "monthly") {
      setCurrentDate(addMonths(currentDate, -1));
    } else {
      setCurrentDate(addWeeks(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (settings.view === "monthly") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
      {/* Navigation */}
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
          {settings.view === "monthly"
            ? format(currentDate, "MMMM yyyy")
            : `Week of ${format(currentDate, "MMM d, yyyy")}`}
        </span>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => updateSettings({ view: "monthly" })}
            className={`px-4 py-2 rounded-lg font-medium ${
              settings.view === "monthly"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => updateSettings({ view: "weekly" })}
            className={`px-4 py-2 rounded-lg font-medium ${
              settings.view === "weekly"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Weekly
          </button>
        </div>

        {/* Print & Settings */}
        <button
          onClick={() => handlePrint()}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Print
        </button>
        <button
          onClick={onSettingsClick}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Settings
        </button>
      </div>
    </div>
  );
}
