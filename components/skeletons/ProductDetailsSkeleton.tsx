import React from 'react';

export const ProductDetailsSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-6 bg-gray-200 rounded w-32 mb-8" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
        <div className="aspect-square max-w-xl mx-auto bg-gray-200 rounded-xl" />
        <div className="mt-8 lg:mt-0 space-y-4">
          <div className="h-10 bg-gray-200 rounded w-4/5" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-200 rounded w-full" />
          <div className="h-12 bg-gray-200 rounded w-full max-w-xs" />
          <div className="h-14 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  </div>
);
