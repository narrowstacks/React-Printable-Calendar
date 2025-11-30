import { useState } from "react";
import { createRoot } from "react-dom/client";
import html2pdf from "html2pdf.js";
import { useCalendarStore } from "../../store/calendarStore";
import { startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { buildWeekCalendar, detectTimeRange } from "../../lib/calendar/weekBuilder";
import { mergeShifts } from "../../lib/grouping/shiftMerger";
import { applyPrintStyles } from "../../lib/printing/printStyler";
import PrintableWeek from "../weekly/PrintableWeek";
import NavigationControls from "./NavigationControls";
import ViewToggle from "./ViewToggle";
import PrintControls from "./PrintControls";
import { CalendarView } from "../../types";

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

    const clonedElement = element.cloneNode(true) as HTMLElement;

    const legendSection = clonedElement.querySelector(".legend-section");
    if (legendSection) {
      legendSection.remove();
    }

    applyPrintStyles(clonedElement, settings.paperSize);

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

  const handlePrintEntireMonth = async () => {
    if (rawEvents.length === 0) return;

    setIsPrintingMonth(true);
    setPrintError(null);

    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const weeksInMonth = eachWeekOfInterval(
        { start: startOfWeek(monthStart), end: endOfWeek(monthEnd) },
        { weekStartsOn: 0 }
      );

      const { mergedShifts } = mergeShifts(rawEvents, people, settings.colorAssignments);

      const allWeeksData = weeksInMonth.map(weekStart => ({
        weekStart,
        days: buildWeekCalendar(weekStart, [], mergedShifts),
      }));

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

      const consistentStartHour = hasAnyShifts ? monthStartHour : 6;
      const consistentEndHour = hasAnyShifts ? monthEndHour : 23;

      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const pdf = new jsPDF({
        unit: "in",
        format: settings.paperSize,
        orientation: "landscape",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const pixelsPerInch = 100;
      const containerWidth = pageWidth * pixelsPerInch;
      const containerHeight = pageHeight * pixelsPerInch;

      for (let i = 0; i < allWeeksData.length; i++) {
        if (i > 0) pdf.addPage();

        const { days } = allWeeksData[i];

        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = `${containerWidth}px`;
        container.style.height = `${containerHeight}px`;
        container.style.zIndex = "-9999";
        container.style.visibility = "hidden";
        document.body.appendChild(container);

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

        await new Promise(resolve => setTimeout(resolve, 100));

        const weekElement = container.firstChild as HTMLElement;
        applyPrintStyles(weekElement, settings.paperSize);

        container.style.visibility = "visible";

        const canvas = await html2canvas(weekElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

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

        root.unmount();
        document.body.removeChild(container);
      }

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

  const handleViewChange = (view: CalendarView) => {
    updateSettings({ view });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
      <NavigationControls
        currentDate={currentDate}
        view={settings.view}
        onDateChange={setCurrentDate}
      />

      <div className="flex items-center gap-4">
        <ViewToggle
          currentView={settings.view}
          onViewChange={handleViewChange}
        />

        <PrintControls
          onPrint={handlePrint}
          onPrintMonth={handlePrintEntireMonth}
          isPrinting={isPrinting}
          isPrintingMonth={isPrintingMonth}
          showPrintMonth={settings.view === "weekly"}
          printError={printError}
        />

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
