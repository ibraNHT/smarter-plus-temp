import React from 'react';

type Variant = 'producer' | 'ati';

export const OfferCardSkeleton: React.FC<{ variant?: Variant }> = ({ variant = 'producer' }) => {
  const isAti = variant === 'ati';
  return (
    <div
      className={`relative flex-shrink-0 bg-white overflow-hidden animate-pulse ${
        isAti
          ? 'min-w-[220px] w-[240px] rounded-lg border border-gray-200'
          : 'min-w-[280px] w-[300px] rounded-xl shadow-md border border-gray-100'
      }`}
    >
      <div className={`bg-gray-200 ${isAti ? 'h-36' : 'h-44'}`} />
      <div className={isAti ? 'p-3 space-y-2 flex flex-col' : 'p-4 space-y-3'}>
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className={`h-3 bg-gray-200 rounded ${isAti ? 'w-2/3' : 'w-full'}`} />
        {!isAti && <div className="h-3 bg-gray-200 rounded w-5/6" />}
        {isAti ? (
          <div className="pt-2 border-t border-gray-100 space-y-2 mt-auto">
            <div className="h-5 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-full" />
          </div>
        ) : (
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <div className="h-6 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-16" />
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
