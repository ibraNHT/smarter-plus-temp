import React from 'react';
import { Loader2 } from 'lucide-react';

type SpinnerProps = {
  className?: string;
  label?: string;
};

export const Spinner: React.FC<SpinnerProps> = ({ className = 'h-5 w-5', label }) => (
  <Loader2
    className={`animate-spin text-current ${className}`}
    aria-hidden={!label}
    aria-label={label ?? 'Loading'}
  />
);
