import React from 'react';
import { Shimmer } from '../Loaders';

type Variant = 'producer' | 'ati';

export const OfferCardSkeleton: React.FC<{ variant?: Variant }> = ({ variant = 'producer' }) => {
  const isAti = variant === 'ati';
  return (
    <div
      aria-hidden="true"
      className={`relative flex-shrink-0 bg-white overflow-hidden ${
        isAti
          ? 'min-w-[220px] w-[240px] rounded-lg border border-gray-100'
          : 'min-w-[280px] w-[300px] rounded-xl shadow-md border border-gray-100'
      }`}
    >
      <Shimmer className={`w-full ${isAti ? 'h-36' : 'h-44'}`} />
      <div className={isAti ? 'p-3 space-y-2 flex flex-col' : 'p-4 space-y-3'}>
        <Shimmer className="h-4 rounded w-3/4" />
        <Shimmer className={`h-3 rounded ${isAti ? 'w-2/3' : 'w-full'}`} />
        {!isAti && <Shimmer className="h-3 rounded w-5/6" />}
        {isAti ? (
          <div className="pt-2 border-t border-gray-100 space-y-2 mt-auto">
            <Shimmer className="h-5 rounded w-24" />
            <Shimmer className="h-8 rounded w-full" />
          </div>
        ) : (
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <Shimmer className="h-6 rounded w-24" />
            <Shimmer className="h-4 rounded w-16" />
          </div>
        )}
      </div>
    </div>
  );
};

/** Horizontal offer carousel skeleton — contained so flex layouts do not overflow right. */
export const OfferRowSkeleton: React.FC<{ count?: number; variant?: Variant }> = ({
  count = 6,
  variant = 'producer',
}) => {
  const isAti = variant === 'ati';
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div
        className={`flex w-full min-w-0 overflow-x-auto pb-4 pt-2 gap-5 scrollbar-thin px-1 ${
          isAti
            ? 'scrollbar-thumb-blue-200 scrollbar-track-gray-50'
            : 'scrollbar-thumb-gray-300 scrollbar-track-transparent'
        }`}
      >
        {Array.from({ length: count }).map((_, i) => (
          <OfferCardSkeleton key={i} variant={variant} />
        ))}
      </div>
    </div>
  );
};
