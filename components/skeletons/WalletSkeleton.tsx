import React from 'react';
import { Shimmer } from '../Loaders';

export const WalletSkeleton: React.FC = () => (
  <div className="app-screen bg-gray-50" aria-hidden="true" role="status">
    <span className="sr-only">Loading wallet…</span>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Back link */}
      <Shimmer className="h-5 w-24 rounded" />

      {/* Balance hero card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3">
            <Shimmer className="h-4 rounded w-28" />
            <Shimmer className="h-10 rounded w-48" />
            <Shimmer className="h-3 rounded w-36" />
          </div>
          <div className="flex gap-3">
            <Shimmer className="h-10 w-28 rounded-lg" />
            <Shimmer className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
            <Shimmer className="h-4 rounded w-3/4" />
            <Shimmer className="h-7 rounded w-1/2" />
          </div>
        ))}
      </div>

      {/* Transactions section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <Shimmer className="h-5 rounded w-32" />
          <Shimmer className="h-4 rounded w-16" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Shimmer className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <Shimmer className="h-3.5 rounded w-2/3" />
                <Shimmer className="h-3 rounded w-1/3" />
              </div>
              <Shimmer className="h-5 rounded w-20 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal requests section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Shimmer className="h-5 rounded w-44" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 space-y-1.5 min-w-0">
                <Shimmer className="h-3.5 rounded w-1/2" />
                <Shimmer className="h-3 rounded w-1/3" />
              </div>
              <Shimmer className="h-6 rounded-full w-20 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
