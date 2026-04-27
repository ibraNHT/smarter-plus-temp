import React from 'react';

export const PublicProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="h-8 bg-gray-200 rounded w-40 mb-8" />
      <div className="bg-white rounded-xl shadow border border-gray-100 p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="h-28 w-28 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg border border-gray-200" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
