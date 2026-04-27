import React from 'react';

type Variant = 'producer' | 'ati';

export const OfferCardSkeleton: React.FC<{ variant?: Variant }> = ({ variant = 'producer' }) => {
  const isAti = variant === 'ati';
  return (
    <div
      className={`relative flex-shrink-0 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-pulse ${
        isAti ? 'min-w-[220px] w-[240px]' : 'min-w-[280px] w-[300px]'
      }`}
    >
      <div className={`bg-gray-200 ${isAti ? 'h-36' : 'h-44'}`} />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
};

export const OfferRowSkeleton: React.FC<{ count?: number; variant?: Variant }> = ({
  count = 6,
  variant = 'producer',
}) => (
  <div className="flex overflow-x-auto pb-8 pt-2 space-x-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-1">
    {Array.from({ length: count }).map((_, i) => (
      <OfferCardSkeleton key={i} variant={variant} />
    ))}
  </div>
);
