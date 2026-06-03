import React from 'react';
import { Shimmer } from '../Loaders';

export const ShoppingCartSkeleton: React.FC = () => (
  <div className="app-screen bg-gray-50" aria-hidden="true" role="status">
    <span className="sr-only">Loading cart…</span>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Back + heading */}
      <div className="flex items-center gap-3">
        <Shimmer className="h-5 w-5 rounded" />
        <Shimmer className="h-7 rounded w-36" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cart items (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex gap-4">
                <Shimmer className="h-20 w-20 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Shimmer className="h-4 rounded w-3/4" />
                  <Shimmer className="h-3 rounded w-1/2" />
                  <Shimmer className="h-3 rounded w-2/3" />
                  <div className="flex items-center justify-between pt-1">
                    <Shimmer className="h-6 rounded w-24" />
                    <Shimmer className="h-8 rounded-lg w-24" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Delivery method */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <Shimmer className="h-5 rounded w-36" />
            <div className="flex gap-3">
              <Shimmer className="h-12 flex-1 rounded-lg" />
              <Shimmer className="h-12 flex-1 rounded-lg" />
            </div>
          </div>

          {/* Pickup / address */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <Shimmer className="h-5 rounded w-44" />
            <Shimmer className="h-10 rounded-lg w-full" />
            <Shimmer className="h-10 rounded-lg w-full" />
          </div>
        </div>

        {/* Order summary (1/3 width) */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <Shimmer className="h-5 rounded w-32" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Shimmer className="h-4 rounded w-24" />
                  <Shimmer className="h-4 rounded w-16" />
                </div>
              ))}
            </div>
            <Shimmer className="h-px w-full rounded" />
            <div className="flex justify-between">
              <Shimmer className="h-5 rounded w-16" />
              <Shimmer className="h-5 rounded w-20" />
            </div>
            <Shimmer className="h-12 rounded-xl w-full" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
            <Shimmer className="h-4 rounded w-3/4" />
            <Shimmer className="h-4 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
