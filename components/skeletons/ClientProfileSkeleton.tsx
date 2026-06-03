import React from 'react';
import { Shimmer } from '../Loaders';

export const ClientProfileSkeleton: React.FC = () => (
  <div className="app-screen bg-gray-50" aria-hidden="true" role="status">
    <span className="sr-only">Loading profile…</span>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <Shimmer className="h-20 w-20 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <Shimmer className="h-6 rounded w-44" />
            <Shimmer className="h-4 rounded w-32" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Shimmer className="h-7 w-24 rounded-full" />
              <Shimmer className="h-7 w-20 rounded-full" />
              <Shimmer className="h-7 w-28 rounded-full" />
            </div>
          </div>
          <Shimmer className="h-9 w-28 rounded-lg flex-shrink-0" />
        </div>
      </div>

      {/* Tab strip */}
      <div className="agm-profile-nav">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer key={i} className="h-9 w-24 rounded-lg flex-shrink-0" />
        ))}
      </div>

      {/* Tab content — order list skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <Shimmer className="h-5 rounded w-28" />
          <Shimmer className="h-4 rounded w-16" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3.5">
              <Shimmer className="h-10 w-10 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <Shimmer className="h-3.5 rounded w-2/3" />
                <Shimmer className="h-3 rounded w-1/2" />
                <Shimmer className="h-3 rounded w-1/3" />
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <Shimmer className="h-5 w-20 rounded-full" />
                <Shimmer className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
