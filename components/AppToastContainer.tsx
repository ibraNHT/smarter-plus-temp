import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import {
  AppToastItem,
  AppToastType,
  dismissAppToast,
  subscribeAppToasts,
} from '../services/appToast';

const toastMeta = (type: AppToastType) => {
  switch (type) {
    case 'SUCCESS':
      return {
        title: 'Success',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      };
    case 'ERROR':
      return {
        title: 'Error',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <AlertCircle className="h-6 w-6 text-red-600" />,
      };
    case 'WARNING':
      return {
        title: 'Attention',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
      };
    default:
      return {
        title: 'Info',
        bgColor: 'bg-white',
        borderColor: 'border-gray-200',
        icon: <Info className="h-6 w-6 text-blue-500" />,
      };
  }
};

export const AppToastContainer: React.FC = () => {
  const [visibleToasts, setVisibleToasts] = useState<AppToastItem[]>([]);

  useEffect(() => subscribeAppToasts(setVisibleToasts), []);

  if (visibleToasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:top-auto sm:left-auto sm:bottom-20 sm:right-4 z-[10000] flex flex-col gap-3 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      aria-live="polite"
    >
      {visibleToasts.map((toast) => {
        const meta = toastMeta(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto agm-toast-in flex items-start p-4 rounded-lg shadow-lg border ${meta.bgColor} ${meta.borderColor}`}
          >
            <div className="flex-shrink-0">{meta.icon}</div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">{meta.title}</p>
              <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                onClick={() => dismissAppToast(toast.id)}
                className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
