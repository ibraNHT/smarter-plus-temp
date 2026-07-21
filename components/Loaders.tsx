import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';

/** Single shimmer placeholder block. */
export const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`agm-shimmer ${className}`} aria-hidden="true" />
);

/** Inline spinner for labels and buttons. */
export const Spinner: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 16 }) => (
  <Loader2 aria-hidden="true" className={`animate-spin text-current ${className}`} style={{ width: size, height: size }} />
);

export const SectionLoader: React.FC<{ message?: string; className?: string }> = ({ message, className = '' }) => {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center py-10 text-gray-500 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden="true" />
      {message && <p className="mt-3 text-sm">{message}</p>}
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
};

export const PageLoader: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="app-screen flex flex-col items-center justify-center text-gray-600">
      <Loader2 className="h-10 w-10 animate-spin text-primary-600" aria-hidden="true" />
      {message && <p className="mt-4 text-sm sm:text-base">{message}</p>}
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
};

export const ListSkeleton: React.FC<{ rows?: number; className?: string }> = ({ rows = 3, className = '' }) => {
  const { t } = useTranslation();
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true" role="status">
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
          <div className="flex items-start gap-3">
            <Shimmer className="h-10 w-10 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Shimmer className="h-3.5 rounded w-2/3" />
              <Shimmer className="h-3 rounded w-1/2" />
            </div>
            <Shimmer className="h-6 w-16 rounded-full flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ServiceSlotsSkeleton: React.FC<{ count?: number; label?: string; className?: string }> = ({ count = 6, label, className = '' }) => {
  const { t } = useTranslation();
  return (
    <div className={`col-span-3 grid grid-cols-3 gap-2 ${className}`} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label ?? t('common.loadingAvailableSlots')}</span>
      {Array.from({ length: count }).map((_, i) => <Shimmer key={i} className="h-9 rounded border border-gray-100/80" />)}
    </div>
  );
};

export const ButtonSpinner: React.FC<{ label?: string; size?: number }> = ({ label, size = 16 }) => (
  <span className="inline-flex items-center justify-center gap-2">
    <Spinner size={size} />
    {label && <span>{label}</span>}
  </span>
);
