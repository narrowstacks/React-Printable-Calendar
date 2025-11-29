import { useState } from "react";
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

  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  const handlePrint = async () => {
    if (!printRef?.current) return;

    const element = printRef.current;

    const orientation: "portrait" | "landscape" =
      settings.orientation === "landscape" ? "landscape" : "portrait";

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Remove legend from PDF (cleaner output)
    const legendSection = clonedElement.querySelector(".legend-section");
    if (legendSection) {
      legendSection.remove();
    }

    // IMPORTANT: @media print CSS does NOT apply to html2canvas!
    // We must apply print-friendly styles directly to the cloned element

    // Root element styling
    clonedElement.style.padding = "4px";
    clonedElement.style.margin = "0";
    clonedElement.style.backgroundColor = "white";
    clonedElement.style.boxShadow = "none";
    clonedElement.style.borderRadius = "0";

    // Reduce inner container padding (the p-6 class = 24px, way too much)
    const innerContainer = clonedElement.querySelector(":scope > div") as HTMLElement;
    if (innerContainer) {
      innerContainer.style.padding = "4px";
    }

    // Fix all shift blocks - ensure text isn't clipped
    const shiftBlocks = clonedElement.querySelectorAll(".shift-block") as NodeListOf<HTMLElement>;
    shiftBlocks.forEach((block) => {
      block.style.overflow = "visible";
      // Ensure children can overflow too
      const children = block.querySelectorAll("*") as NodeListOf<HTMLElement>;
      children.forEach((child) => {
        child.style.overflow = "visible";
        child.style.lineHeight = "1.3";
      });
    });

    // Compact the header
    const header = clonedElement.querySelector("h2") as HTMLElement;
    if (header) {
      header.style.marginBottom = "4px";
      header.style.marginTop = "0";
      header.style.paddingTop = "0";
    }

    // Remove any margin from week header container
    const headerContainer = clonedElement.querySelector(".mb-6") as HTMLElement;
    if (headerContainer) {
      headerContainer.style.marginBottom = "8px";
    }

    // Simple, minimal configuration
    const opt = {
      margin: 0.3,
      filename: "calendar.pdf",
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
      },
      jsPDF: {
        unit: "in",
        format: settings.paperSize,
        orientation: orientation,
      },
    };

    // Generate PDF with error handling
    setIsPrinting(true);
    setPrintError(null);

    try {
      const uri = await html2pdf()
        .set(opt)
        .from(clonedElement)
        .toPdf()
        .output("bloburi");

      window.open(uri as string, "_blank");
    } catch (error) {
      console.error("PDF generation failed:", error);
      setPrintError(
        "Failed to generate PDF. Please try again or use browser print (Ctrl/Cmd+P)."
      );
    } finally {
      setIsPrinting(false);
    }
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrint()}
            disabled={isPrinting}
            className={`px-4 py-2 rounded-lg ${
              isPrinting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            } text-white`}
          >
            {isPrinting ? "Generating..." : "Print"}
          </button>
          {printError && (
            <span className="text-red-500 text-sm max-w-48">{printError}</span>
          )}
        </div>
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
