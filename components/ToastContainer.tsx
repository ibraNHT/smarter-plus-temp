
import React, { useState, useLayoutEffect, useRef } from 'react';
import { useStoreOptional } from '../services/storeContext';
import { Notification } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const getSeenToastStorageKey = (userId?: string) =>
  userId ? `seen_toast_notifications:${userId}` : null;

const loadSeenToastIds = (userId?: string): Set<string> => {
  if (!userId || typeof window === 'undefined') return new Set();
  const key = getSeenToastStorageKey(userId);
  if (!key) return new Set();
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((id) => String(id)));
  } catch {
    return new Set();
  }
};

const persistSeenToastIds = (userId: string, ids: Set<string>) => {
  if (typeof window === 'undefined') return;
  const key = getSeenToastStorageKey(userId);
  if (!key) return;
  // Keep storage bounded.
  const bounded = Array.from(ids).slice(-500);
  localStorage.setItem(key, JSON.stringify(bounded));
};

export const ToastContainer: React.FC = () => {
  const store = useStoreOptional();
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);
  const seenNotifyIdsRef = useRef<Set<string>>(new Set());
  const activeUserIdRef = useRef<string | null>(null);

  const notifications = store?.notifications ?? [];
  const user = store?.user ?? null;

  useLayoutEffect(() => {
    if (!store || !user?.id) return;

    // Restore per-user seen toast ids after reload.
    if (activeUserIdRef.current !== user.id) {
      activeUserIdRef.current = user.id;
      seenNotifyIdsRef.current = loadSeenToastIds(user.id);
      setVisibleToasts([]);
    }
  }, [store, user?.id]);

  useLayoutEffect(() => {
    if (!store || notifications.length === 0) return;
    const userToasts = notifications.filter(
      (n) => n.userId === user?.id && !seenNotifyIdsRef.current.has(n.id),
    );
    if (userToasts.length === 0) return;

    userToasts.forEach((toast) => seenNotifyIdsRef.current.add(toast.id));
    if (user?.id) {
      persistSeenToastIds(user.id, seenNotifyIdsRef.current);
    }
    setVisibleToasts((prev) => [...userToasts, ...prev]);

    userToasts.forEach((toast) => {
      window.setTimeout(() => {
        removeToast(toast.id);
      }, 5000);
    });
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
