import React from 'react';
import { Sprout } from 'lucide-react';

/** Shown on auth routes when the global navbar is hidden (mobile). */
export const AuthMobileBrand: React.FC = () => (
  <div className="md:hidden flex flex-col items-center text-center pt-1 pb-4 border-b border-gray-200/80 mb-2">
    <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary-100 text-primary-700 mb-2 shadow-sm">
      <Sprout className="h-6 w-6" aria-hidden />
    </div>
    <p className="text-sm font-semibold tracking-tight text-primary-900">AgriMarket Connect</p>
  </div>
);
