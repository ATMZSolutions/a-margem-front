import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useState } from "react";

interface YearStepperProps {
  minYear: number;
  maxYear: number;
  initialYear: number;
  onYearChange: (year: number) => void;
}

export function YearStepper({ onYearChange, minYear, maxYear, initialYear }: YearStepperProps) {
  const [currentYear, setCurrentYear] = useState(initialYear);

  const handleYearChange = (newYear: number) => {
    if (newYear >= minYear && newYear <= maxYear) {
      setCurrentYear(newYear);
      onYearChange(newYear);
    }
  };

  const isMinYear = currentYear === minYear;
  const isMaxYear = currentYear === maxYear;

  const buttonClass = "cursor-pointer text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-center gap-4 md:gap-8 my-8 md:my-12">
      <button onClick={() => handleYearChange((currentYear - 2 < minYear) ? minYear : currentYear - 2)} disabled={isMinYear} className={buttonClass}>
        <ChevronsLeft size={32} />
      </button>
      <button onClick={() => handleYearChange(currentYear - 1)} disabled={isMinYear} className={buttonClass}>
        <ChevronLeft size={32} />
      </button>

      <h1
        className="text-3xl md:text-5xl font-sedgwick text-white"
        style={{
          color: 'var(--site-accent)',
          fontWeight: 'normal'
        }}>
        {currentYear}
      </h1>

      <button onClick={() => handleYearChange(currentYear + 1)} disabled={isMaxYear} className={buttonClass}>
        <ChevronRight size={32} />
      </button>
      <button onClick={() => handleYearChange((currentYear + 2 > maxYear) ? maxYear : currentYear + 2)} disabled={isMaxYear} className={buttonClass}>
        <ChevronsRight size={32} />
      </button>
    </div>
  );
}
