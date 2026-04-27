import React from 'react';
import { ArrowLeft } from 'lucide-react';

type Props = { onBack: () => void; title: string };

export const ComparePageSkeleton: React.FC<Props> = ({ onBack, title }) => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-32 animate-pulse">
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
    <div className="border border-gray-200 rounded-lg shadow-lg bg-white overflow-hidden">
      <div className="h-12 bg-gray-100 border-b border-gray-200" />
      <div className="grid grid-cols-4 gap-0 divide-x divide-gray-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
      <div className="h-48 bg-gray-50 border-t border-gray-200" />
    </div>
    <p className="text-center text-sm text-gray-500 mt-6">Loading comparison…</p>
  </div>
);
