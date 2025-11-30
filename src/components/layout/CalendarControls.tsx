import { useState } from "react";
import { createRoot } from "react-dom/client";
import html2pdf from "html2pdf.js";
import { useCalendarStore } from "../../store/calendarStore";
import { addMonths, addWeeks, format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { buildWeekCalendar, detectTimeRange } from "../../lib/calendar/weekBuilder";
import { mergeShifts } from "../../lib/grouping/shiftMerger";
import PrintableWeek from "../weekly/PrintableWeek";

interface CalendarControlsProps {
  onSettingsClick: () => void;
  printRef?: React.RefObject<HTMLDivElement>;
}

export default function CalendarControls({
  onSettingsClick,
  printRef,
}: CalendarControlsProps) {
  const { settings, currentDate, updateSettings, setCurrentDate, rawEvents, people } =
    useCalendarStore();

  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingMonth, setIsPrintingMonth] = useState(false);
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

  // Helper to apply print-friendly styles to a week element
  const applyPrintStyles = (element: HTMLElement) => {
    // Root element styling
    element.style.padding = "4px";
    element.style.margin = "0";
    element.style.backgroundColor = "white";
    element.style.boxShadow = "none";
    element.style.borderRadius = "0";

    // Reduce inner container padding
    const innerContainer = element.querySelector(":scope > div") as HTMLElement;
    if (innerContainer) {
      innerContainer.style.padding = "4px";
    }

    // Fix shift blocks
    const shiftBlocks = element.querySelectorAll(".shift-block") as NodeListOf<HTMLElement>;
    shiftBlocks.forEach((block) => {
      block.style.overflow = "visible";
      block.style.paddingTop = "4px";
      const children = block.querySelectorAll("*") as NodeListOf<HTMLElement>;
      children.forEach((child) => {
        child.style.overflow = "visible";
        child.style.lineHeight = "1.3";
      });
    });

    // Style the header
    const header = element.querySelector("h2") as HTMLElement;
    if (header) {
      header.style.fontSize = "24px";
      header.style.fontWeight = "700";
      header.style.marginBottom = "12px";
      header.style.marginTop = "0";
      header.style.paddingTop = "0";
      header.style.textAlign = "center";
    }

    // Remove margin from header container
    const headerContainer = element.querySelector(".mb-6") as HTMLElement;
    if (headerContainer) {
      headerContainer.style.marginBottom = "4px";
    }

    // Scale configuration based on paper size
    const paperScaleConfig: Record<string, { scaleFactor: number; shiftTextSize: string; shiftTimeSize: string }> = {
      letter: { scaleFactor: 0.94, shiftTextSize: "11px", shiftTimeSize: "10px" },
      legal: { scaleFactor: 0.94, shiftTextSize: "11px", shiftTimeSize: "10px" },
      tabloid: { scaleFactor: 1.25, shiftTextSize: "16px", shiftTimeSize: "14px" },
    };
    const config = paperScaleConfig[settings.paperSize] || paperScaleConfig.letter;
    const scaleFactor = config.scaleFactor;
    const originalHourHeight = 50;
    const newHourHeight = originalHourHeight * scaleFactor;

    // Apply text size adjustments
    shiftBlocks.forEach((block) => {
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
    const timeSlots = element.querySelectorAll(".week-grid-container [style*='height: 50px']") as NodeListOf<HTMLElement>;
    timeSlots.forEach((slot) => {
      slot.style.height = `${newHourHeight}px`;
    });

    // Scale day column containers
    const dayColumnGrids = element.querySelectorAll(".day-column > .relative") as NodeListOf<HTMLElement>;
    dayColumnGrids.forEach((grid) => {
      const currentMinHeight = grid.style.minHeight;
      if (currentMinHeight) {
        const value = parseFloat(currentMinHeight);
        grid.style.minHeight = `${value * scaleFactor}px`;
      }
    });

    // Scale hour divider positions
    const hourDividers = element.querySelectorAll(".day-column .absolute.border-b") as NodeListOf<HTMLElement>;
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
    const shiftBlocksForScaling = element.querySelectorAll(".shift-block") as NodeListOf<HTMLElement>;
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
  };

  const handlePrintEntireMonth = async () => {
    if (rawEvents.length === 0) return;

    setIsPrintingMonth(true);
    setPrintError(null);

    try {
      // Get all weeks in the current month
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const weeksInMonth = eachWeekOfInterval(
        { start: startOfWeek(monthStart), end: endOfWeek(monthEnd) },
        { weekStartsOn: 0 }
      );

      // Get merged shifts for the month
      const { mergedShifts } = mergeShifts(rawEvents, people, settings.colorAssignments);

      // Pre-calculate all weeks and find the consistent time range across the entire month
      const allWeeksData = weeksInMonth.map(weekStart => ({
        weekStart,
        days: buildWeekCalendar(weekStart, [], mergedShifts),
      }));

      // Find the min start hour and max end hour across all weeks for consistent scaling
      let monthStartHour = 23;
      let monthEndHour = 0;
      let hasAnyShifts = false;

      allWeeksData.forEach(({ days }) => {
        if (days.some(d => d.shifts.length > 0)) {
          hasAnyShifts = true;
          const { startHour, endHour } = detectTimeRange(days);
          monthStartHour = Math.min(monthStartHour, startHour);
          monthEndHour = Math.max(monthEndHour, endHour);
        }
      });

      // Use consistent time range for all weeks (or default if no shifts)
      const consistentStartHour = hasAnyShifts ? monthStartHour : 6;
      const consistentEndHour = hasAnyShifts ? monthEndHour : 23;

      // Import jsPDF dynamically
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const pdf = new jsPDF({
        unit: "in",
        format: settings.paperSize,
        orientation: "landscape",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate container dimensions to match paper aspect ratio
      // Use 100 pixels per inch for rendering, then scale down for PDF
      const pixelsPerInch = 100;
      const containerWidth = pageWidth * pixelsPerInch;
      const containerHeight = pageHeight * pixelsPerInch;

      for (let i = 0; i < allWeeksData.length; i++) {
        if (i > 0) pdf.addPage();

        const { days } = allWeeksData[i];

        // Create hidden container for React rendering with correct aspect ratio
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = `${containerWidth}px`;
        container.style.height = `${containerHeight}px`;
        container.style.zIndex = "-9999";
        container.style.visibility = "hidden";
        document.body.appendChild(container);

        // Render React component into container using consistent time range for all weeks
        const root = createRoot(container);
        root.render(
          <PrintableWeek
            days={days}
            startHour={consistentStartHour}
            endHour={consistentEndHour}
            timezone={settings.timezone}
            timeFormat={settings.timeFormat}
            colorAssignments={settings.colorAssignments}
          />
        );

        // Wait for React to render
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get the rendered element
        const weekElement = container.firstChild as HTMLElement;

        // Apply print styles
        applyPrintStyles(weekElement);

        // Make visible for capture
        container.style.visibility = "visible";

        // Capture with html2canvas
        const canvas = await html2canvas(weekElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        // Add to PDF
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        const margin = 0.1;
        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          margin,
          pageWidth - margin * 2,
          pageHeight - margin * 2
        );

        // Cleanup
        root.unmount();
        document.body.removeChild(container);
      }

      // Output PDF
      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("PDF generation failed:", error);
      setPrintError("Failed to generate month PDF. Please try again.");
    } finally {
      setIsPrintingMonth(false);
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
            disabled={isPrinting || isPrintingMonth}
            className={`px-4 py-2 rounded-lg ${
              isPrinting || isPrintingMonth
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            } text-white`}
          >
            {isPrinting ? "Generating..." : "Print"}
          </button>
          {settings.view === "weekly" && (
            <button
              onClick={() => handlePrintEntireMonth()}
              disabled={isPrinting || isPrintingMonth}
              className={`px-4 py-2 rounded-lg ${
                isPrinting || isPrintingMonth
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-600"
              } text-white`}
            >
              {isPrintingMonth ? "Generating..." : "Print Entire Month"}
            </button>
          )}
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
