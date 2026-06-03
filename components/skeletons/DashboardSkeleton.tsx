import React from 'react';
import { Shimmer } from '../Loaders';

export const DashboardSkeleton: React.FC = () => (
  <div className="app-screen bg-gray-50" aria-hidden="true" role="status">
    <span className="sr-only">Loading dashboard…</span>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shimmer className="h-7 rounded w-48" />
          <Shimmer className="h-4 rounded w-64" />
        </div>
        <Shimmer className="h-9 w-32 rounded-lg" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
            <Shimmer className="h-4 rounded w-3/4" />
            <Shimmer className="h-8 rounded w-1/2" />
            <Shimmer className="h-3 rounded w-2/3" />
          </div>
        ))}
      </div>

      {/* Two-column layout for orders + catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending orders */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <Shimmer className="h-5 rounded w-36" />
            <Shimmer className="h-6 w-16 rounded-full" />
          </div>
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                <Shimmer className="h-10 w-10 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <Shimmer className="h-3.5 rounded w-3/4" />
                  <Shimmer className="h-3 rounded w-1/2" />
                </div>
                <div className="flex gap-2">
                  <Shimmer className="h-8 w-20 rounded-lg" />
                  <Shimmer className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My offers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <Shimmer className="h-5 rounded w-28" />
            <Shimmer className="h-8 w-24 rounded-lg" />
          </div>
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                <Shimmer className="h-12 w-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <Shimmer className="h-3.5 rounded w-2/3" />
                  <Shimmer className="h-3 rounded w-1/3" />
                </div>
                <Shimmer className="h-6 w-16 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completed orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Shimmer className="h-5 rounded w-40" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-3">
              <Shimmer className="h-9 w-9 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <Shimmer className="h-3.5 rounded w-1/2" />
                <Shimmer className="h-3 rounded w-1/3" />
              </div>
              <Shimmer className="h-5 w-24 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
