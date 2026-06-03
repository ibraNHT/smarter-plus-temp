import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Single shimmer placeholder block.
 * Pass width / height / border-radius via className.
 */
export const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`agm-shimmer ${className}`} aria-hidden="true" />
);

/**
 * Inline spinner — small, used inline next to a label or inside a button.
 */
export const Spinner: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 16 }) => (
  <Loader2
    aria-hidden="true"
    className={`animate-spin text-current ${className}`}
    style={{ width: size, height: size }}
  />
);

/**
 * Centered loading block for sections / cards.
 * Used when content within an existing card is being fetched.
 */
export const SectionLoader: React.FC<{ message?: string; className?: string }> = ({ message, className = '' }) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex flex-col items-center justify-center py-10 text-gray-500 ${className}`}
  >
    <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden="true" />
    {message && <p className="mt-3 text-sm">{message}</p>}
    <span className="sr-only">Loading…</span>
  </div>
);

/**
 * Page-level loader — fills the route below the navbar.
 */
export const PageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div
    role="status"
    aria-live="polite"
    className="app-screen flex flex-col items-center justify-center text-gray-600"
  >
    <Loader2 className="h-10 w-10 animate-spin text-primary-600" aria-hidden="true" />
    {message && <p className="mt-4 text-sm sm:text-base">{message}</p>}
    <span className="sr-only">Loading…</span>
  </div>
);

/**
 * Skeleton list — generic row skeletons for lists (orders, transactions, reviews…).
 * Uses the sweeping shimmer gradient instead of pulse.
 */
export const ListSkeleton: React.FC<{ rows?: number; className?: string }> = ({ rows = 3, className = '' }) => (
  <div className={`space-y-3 ${className}`} aria-hidden="true" role="status">
    <span className="sr-only">Loading…</span>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="bg-white border border-gray-100 rounded-lg shadow-sm p-4"
      >
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

/**
 * Inline button content with spinner — convenience wrapper.
 */
export const ButtonSpinner: React.FC<{ label?: string; size?: number }> = ({ label, size = 16 }) => (
  <span className="inline-flex items-center justify-center gap-2">
    <Spinner size={size} />
    {label && <span>{label}</span>}
  </span>
);
