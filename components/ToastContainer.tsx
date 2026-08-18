
import React, { useState, useLayoutEffect, useRef } from 'react';
import { nativeStorageGet, nativeStorageSet } from '../services/nativeStorage';
import { useStoreOptional } from '../services/storeContext';
import { Notification } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';

const getSeenToastStorageKey = (userId?: string) =>
  userId ? `seen_toast_notifications:${userId}` : null;

/**
 * Window during which a freshly created notification is still considered
 * "live" enough to surface as a popup toast. Notifications older than this
 * are silently marked as seen on first load so the bell badge updates but
 * the screen does not flood with historical popups (the bug we are fixing).
 */
const TOAST_FRESHNESS_WINDOW_MS = 60_000;

const loadSeenToastIds = (userId?: string): Set<string> => {
  if (!userId || typeof window === 'undefined') return new Set();
  const key = getSeenToastStorageKey(userId);
  if (!key) return new Set();
  try {
    const parsed = JSON.parse(nativeStorageGet(key) || '[]');
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
  nativeStorageSet(key, JSON.stringify(bounded));
};

export const ToastContainer: React.FC = () => {
  const { t } = useTranslation();
  const store = useStoreOptional();
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);
  const seenNotifyIdsRef = useRef<Set<string>>(new Set());
  const activeUserIdRef = useRef<string | null>(null);
  // Tracks whether we've completed the initial notification reconciliation
  // for the active user. Until then we *seed* the seen-set instead of
  // toasting, so historical notifications never spam the screen after login
  // or a fresh tab open.
  const initialReconcileDoneRef = useRef<boolean>(false);
  const loginAtRef = useRef<number>(Date.now());

  const notifications = store?.notifications ?? [];
  const user = store?.user ?? null;

  useLayoutEffect(() => {
    if (!store) return;

    // User switched (login, logout, account swap). Reset toast state per-user
    // so notifications from another account never bleed into the new session.
    if (activeUserIdRef.current !== (user?.id ?? null)) {
      activeUserIdRef.current = user?.id ?? null;
      seenNotifyIdsRef.current = user?.id ? loadSeenToastIds(user.id) : new Set();
      initialReconcileDoneRef.current = false;
      loginAtRef.current = Date.now();
      setVisibleToasts([]);
    }
  }, [store, user?.id]);

  useLayoutEffect(() => {
    if (!store || !user?.id) return;
    if (notifications.length === 0) {
      // Nothing to reconcile yet, but consider the initial pass "done" so
      // the first real notification still toasts even if the inbox starts empty.
      initialReconcileDoneRef.current = true;
      return;
    }

    // Always restrict to the active user — defensive guard against stale state.
    const ownNotifs = notifications.filter((n) => n.userId === user.id);

    // === FIRST PASS AFTER LOGIN / RELOAD ============================
    // The user has already seen these notifications in the bell icon and
    // may have read them. Showing them as popup toasts now is noise. We
    // seed the seen-set with everything currently in the inbox so only
    // GENUINELY NEW notifications (arriving via socket / poll AFTER login)
    // will trigger a toast going forward.
    if (!initialReconcileDoneRef.current) {
      ownNotifs.forEach((n) => seenNotifyIdsRef.current.add(n.id));
      persistSeenToastIds(user.id, seenNotifyIdsRef.current);
      initialReconcileDoneRef.current = true;
      return;
    }

    const userToasts = ownNotifs.filter((n) => {
      if (seenNotifyIdsRef.current.has(n.id)) return false;
      // Skip notifications the user already read elsewhere (e.g. on another
      // device or via the bell dropdown) — re-toasting them is annoying.
      if (n.isRead) return false;
      // Skip notifications older than the freshness window. A backfill from
      // the server (after the cache went stale) should not retroactively
      // raise toasts for events that happened hours ago.
      const createdAtMs = new Date(n.createdAt).getTime();
      if (!Number.isFinite(createdAtMs)) return false;
      if (createdAtMs < loginAtRef.current - TOAST_FRESHNESS_WINDOW_MS) return false;
      return true;
    });

    if (userToasts.length === 0) return;

    userToasts.forEach((toast) => seenNotifyIdsRef.current.add(toast.id));
    persistSeenToastIds(user.id, seenNotifyIdsRef.current);
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
    <div className="fixed top-20 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:top-auto sm:left-auto sm:bottom-4 sm:right-4 z-[9999] flex flex-col gap-3 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
         style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
            className={`pointer-events-auto agm-toast-in flex items-start p-4 rounded-lg shadow-lg border ${bgColor} ${borderColor}`}
          >
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">
                {isSuccess ? t('toast.success') : isError ? t('toast.error') : isWarning ? t('toast.attention') : t('toast.info')}
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
                <span className="sr-only">{t('common.close')}</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
