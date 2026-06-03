import React from 'react';
import { Shimmer } from '../Loaders';

export const PublicProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50" aria-hidden="true" role="status">
    <span className="sr-only">Loading profile…</span>
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Shimmer className="h-8 rounded w-40 mb-8" />
      <div className="bg-white rounded-xl shadow border border-gray-100 p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Shimmer className="h-28 w-28 rounded-full shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <Shimmer className="h-8 rounded w-1/2" />
            <Shimmer className="h-4 rounded w-3/4" />
            <Shimmer className="h-4 rounded w-1/2" />
            <div className="flex gap-2 pt-1">
              <Shimmer className="h-7 w-20 rounded-full" />
              <Shimmer className="h-7 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <div className="mt-8 flex gap-2 border-b border-gray-100 pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-8 w-24 rounded-md" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-100 overflow-hidden">
              <Shimmer className="h-36 w-full" />
              <div className="p-3 space-y-2">
                <Shimmer className="h-4 rounded w-3/4" />
                <Shimmer className="h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
