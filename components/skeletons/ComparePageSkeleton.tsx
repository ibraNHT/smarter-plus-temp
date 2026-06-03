import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Shimmer } from '../Loaders';

type Props = { onBack: () => void; title: string };

export const ComparePageSkeleton: React.FC<Props> = ({ onBack, title }) => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-32" aria-hidden="true" role="status">
    <span className="sr-only">Loading comparison…</span>
    <div className="flex items-center justify-between mb-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-primary-600 font-medium"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-400">{title}</h1>
    </div>
    <div className="border border-gray-100 rounded-lg shadow-lg bg-white overflow-hidden">
      <Shimmer className="h-12 border-b border-gray-100" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-gray-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <Shimmer className="h-32 rounded" />
            <Shimmer className="h-4 rounded w-full" />
            <Shimmer className="h-4 rounded w-2/3" />
            <Shimmer className="h-3 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((__, j) => (
              <Shimmer key={j} className="h-5 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);
