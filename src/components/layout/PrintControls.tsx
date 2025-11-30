interface PrintControlsProps {
  onPrint: () => void;
  onPrintMonth?: () => void;
  isPrinting: boolean;
  isPrintingMonth: boolean;
  showPrintMonth: boolean;
  printError: string | null;
}

export default function PrintControls({
  onPrint,
  onPrintMonth,
  isPrinting,
  isPrintingMonth,
  showPrintMonth,
  printError,
}: PrintControlsProps) {
  const isDisabled = isPrinting || isPrintingMonth;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrint}
        disabled={isDisabled}
        className={`px-4 py-2 rounded-lg ${
          isDisabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
        } text-white`}
      >
        {isPrinting ? "Generating..." : "Print"}
      </button>
      {showPrintMonth && onPrintMonth && (
        <button
          onClick={onPrintMonth}
          disabled={isDisabled}
          className={`px-4 py-2 rounded-lg ${
            isDisabled
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
  );
}
