import React from 'react';
import { Shimmer } from '../Loaders';

export const ProductDetailsSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50" aria-hidden="true" role="status">
    <span className="sr-only">Loading product…</span>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Shimmer className="h-6 rounded w-32 mb-8" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
        <Shimmer className="aspect-square max-w-xl mx-auto rounded-xl" />
        <div className="mt-8 lg:mt-0 space-y-4">
          <Shimmer className="h-10 rounded w-4/5" />
          <Shimmer className="h-6 rounded w-1/3" />
          <Shimmer className="h-24 rounded w-full" />
          <Shimmer className="h-12 rounded w-full max-w-xs" />
          <Shimmer className="h-14 rounded w-full" />
          <div className="pt-4 space-y-3">
            <Shimmer className="h-4 rounded w-1/2" />
            <Shimmer className="h-4 rounded w-2/3" />
            <Shimmer className="h-4 rounded w-3/5" />
          </div>
        </div>
      </div>
      <div className="mt-12 space-y-4">
        <Shimmer className="h-6 rounded w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
