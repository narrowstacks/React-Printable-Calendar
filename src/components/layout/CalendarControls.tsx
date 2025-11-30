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

    const orientation = "landscape" as const;

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
    const innerContainer = clonedElement.querySelector(
      ":scope > div"
    ) as HTMLElement;
    if (innerContainer) {
      innerContainer.style.padding = "4px";
    }

    // Fix all shift blocks - ensure text isn't clipped and reduce top padding
    const shiftBlocks = clonedElement.querySelectorAll(
      ".shift-block"
    ) as NodeListOf<HTMLElement>;
    shiftBlocks.forEach((block) => {
      block.style.overflow = "visible";
      block.style.paddingTop = "4px";
      // Ensure children can overflow too
      const children = block.querySelectorAll("*") as NodeListOf<HTMLElement>;
      children.forEach((child) => {
        child.style.overflow = "visible";
        child.style.lineHeight = "1.3";
      });
    });

    // Style the header - make it larger like a page title, centered with spacing
    const header = clonedElement.querySelector("h2") as HTMLElement;
    if (header) {
      header.style.fontSize = "24px";
      header.style.fontWeight = "700";
      header.style.marginBottom = "12px";
      header.style.marginTop = "0";
      header.style.paddingTop = "0";
      header.style.textAlign = "center";
    }

    // Remove any margin from week header container
    const headerContainer = clonedElement.querySelector(".mb-6") as HTMLElement;
    if (headerContainer) {
      headerContainer.style.marginBottom = "4px";
    }

    // Adjust scale factor and text sizes based on paper size
    // 8.5" tall papers (letter, legal) use 0.94, larger papers scale up
    const paperScaleConfig: Record<string, { scaleFactor: number; shiftTextSize: string; shiftTimeSize: string }> = {
      letter: { scaleFactor: 0.94, shiftTextSize: "11px", shiftTimeSize: "10px" },
      legal: { scaleFactor: 0.94, shiftTextSize: "11px", shiftTimeSize: "10px" },
      tabloid: { scaleFactor: 1.25, shiftTextSize: "16px", shiftTimeSize: "14px" },
    };
    const config = paperScaleConfig[settings.paperSize] || paperScaleConfig.letter;
    const scaleFactor = config.scaleFactor;
    const originalHourHeight = 50;
    const newHourHeight = originalHourHeight * scaleFactor;

    // Apply text size adjustments to shift blocks
    shiftBlocks.forEach((block) => {
      // Find the name/time text elements and adjust size
      const textElements = block.querySelectorAll("div, span") as NodeListOf<HTMLElement>;
      textElements.forEach((el) => {
        if (el.classList.contains("font-semibold") || el.classList.contains("font-medium")) {
          el.style.fontSize = config.shiftTextSize;
        } else if (el.classList.contains("text-xs") || el.classList.contains("text-sm")) {
          el.style.fontSize = config.shiftTimeSize;
        }
      });
    });

    // Scale time axis rows
    const timeSlots = clonedElement.querySelectorAll(
      ".week-grid-container [style*='height: 50px']"
    ) as NodeListOf<HTMLElement>;
    timeSlots.forEach((slot) => {
      slot.style.height = `${newHourHeight}px`;
    });

    // Scale day column containers (minHeight)
    const dayColumnGrids = clonedElement.querySelectorAll(
      ".day-column > .relative"
    ) as NodeListOf<HTMLElement>;
    dayColumnGrids.forEach((grid) => {
      const currentMinHeight = grid.style.minHeight;
      if (currentMinHeight) {
        const value = parseFloat(currentMinHeight);
        grid.style.minHeight = `${value * scaleFactor}px`;
      }
    });

    // Scale hour divider positions and heights in day columns
    const hourDividers = clonedElement.querySelectorAll(
      ".day-column .absolute.border-b"
    ) as NodeListOf<HTMLElement>;
    hourDividers.forEach((divider) => {
      const currentTop = divider.style.top;
      const currentHeight = divider.style.height;
      if (currentTop) {
        const topValue = parseFloat(currentTop);
        divider.style.top = `${topValue * scaleFactor}px`;
      }
      if (currentHeight) {
        const heightValue = parseFloat(currentHeight);
        divider.style.height = `${heightValue * scaleFactor}px`;
      }
    });

    // Scale shift block positions
    const shiftBlocksForScaling = clonedElement.querySelectorAll(
      ".shift-block"
    ) as NodeListOf<HTMLElement>;
    shiftBlocksForScaling.forEach((block) => {
      const currentTop = block.style.top;
      const currentHeight = block.style.height;
      if (currentTop) {
        const topValue = parseFloat(currentTop);
        block.style.top = `${topValue * scaleFactor}px`;
      }
      if (currentHeight) {
        const heightValue = parseFloat(currentHeight);
        block.style.height = `${heightValue * scaleFactor}px`;
      }
    });

    // Simple, minimal configuration
    const opt = {
      margin: 0.1,
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
