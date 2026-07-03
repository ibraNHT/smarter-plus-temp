import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  id?: string;
  /** Extra classes for the inner <input>. */
  className?: string;
  ariaLabel?: string;
}

/**
 * A number input flanked by −/+ buttons. Mobile-friendly (native spinners are
 * hidden/absent), with clamping to min/max. Drop-in replacement for the plain
 * `<input type="number">` used across forms (offer creation, booking, etc.).
 */
const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  required,
  id,
  className = '',
  ariaLabel,
}) => {
  const clamp = (n: number): number => {
    if (Number.isNaN(n)) n = min ?? 0;
    if (min != null && n < min) n = min;
    if (max != null && n > max) n = max;
    return n;
  };

  const current = Number(value) || 0;
  const atMin = min != null && current <= min;
  const atMax = max != null && current >= max;

  return (
    <div className="mt-1 flex items-stretch">
      <button
        type="button"
        onClick={() => onChange(clamp(current - step))}
        disabled={atMin}
        aria-label="Decrease"
        className="flex items-center justify-center w-10 flex-shrink-0 border border-gray-300 rounded-l-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        aria-label={ariaLabel}
        required={required}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className={`block w-full min-w-0 border-y border-gray-300 p-2 text-center focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 ${className}`}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(current + step))}
        disabled={atMax}
        aria-label="Increase"
        className="flex items-center justify-center w-10 flex-shrink-0 border border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};

export default NumberStepper;
