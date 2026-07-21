import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';

type SpinnerProps = {
  className?: string;
  label?: string;
};

export const Spinner: React.FC<SpinnerProps> = ({ className = 'h-5 w-5', label }) => {
  const { t } = useTranslation();
  return <Loader2
    className={`animate-spin text-current ${className}`}
    aria-hidden={!label}
    aria-label={label ?? t('common.loading')}
  />;
};
