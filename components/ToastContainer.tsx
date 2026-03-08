
import React, { useState, useEffect, useRef } from 'react';
import { useStoreOptional } from '../services/storeContext';
import { Notification } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const store = useStoreOptional();
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);
  const lastNotifyIdRef = useRef<string | null>(null);

  const notifications = store?.notifications ?? [];
  const user = store?.user ?? null;

  useEffect(() => {
    if (!store || notifications.length === 0) return;
    {
      // Get the most recent notification
      const latest = notifications[0];

      // Check if it belongs to current user (or is system wide) and hasn't been shown yet
      if (latest.userId === user?.id && latest.id !== lastNotifyIdRef.current) {
        lastNotifyIdRef.current = latest.id;

        // Add to visible toasts
        setVisibleToasts(prev => [latest, ...prev]);

        // Auto remove after 5 seconds
        setTimeout(() => {
          removeToast(latest.id);
        }, 5000);
      }
    }
  }, [store, notifications, user]);

  const removeToast = (id: string) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== id));
  };

  if (!store || visibleToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {visibleToasts.map((toast) => {
        const isSuccess = toast.type === 'SUCCESS';
        const isError = toast.type === 'ERROR';
        const isWarning = toast.type === 'WARNING';

        let bgColor = 'bg-white';
        let borderColor = 'border-gray-200';
        let icon = <Info className="h-6 w-6 text-blue-500" />;

        if (isSuccess) {
          bgColor = 'bg-green-50';
          borderColor = 'border-green-200';
          icon = <CheckCircle className="h-6 w-6 text-green-600" />;
        } else if (isError) {
          bgColor = 'bg-red-50';
          borderColor = 'border-red-200';
          icon = <AlertCircle className="h-6 w-6 text-red-600" />;
        } else if (isWarning) {
          bgColor = 'bg-yellow-50';
          borderColor = 'border-yellow-200';
          icon = <AlertTriangle className="h-6 w-6 text-yellow-600" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto transform transition-all duration-300 ease-in-out translate-y-0 opacity-100
                        flex items-start p-4 rounded-lg shadow-lg border ${bgColor} ${borderColor}`}
          >
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">
                {isSuccess ? 'Success' : isError ? 'Error' : isWarning ? 'Attention' : 'Info'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {toast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => removeToast(toast.id)}
                className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
