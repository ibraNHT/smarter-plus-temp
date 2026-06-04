export type AppToastType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export type AppToastItem = {
  id: string;
  message: string;
  type: AppToastType;
};

type Listener = (toasts: AppToastItem[]) => void;

let toasts: AppToastItem[] = [];
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((listener) => listener([...toasts]));
};

export function subscribeAppToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => listeners.delete(listener);
}

export function dismissAppToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

/** Themed ephemeral toast (replaces `window.alert` for user feedback). */
export function showAppToast(
  message: string,
  type: AppToastType = 'INFO',
  durationMs = 5000,
) {
  const trimmed = message.trim();
  if (!trimmed) return;

  const toast: AppToastItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    message: trimmed,
    type,
  };

  toasts = [...toasts, toast];
  notify();

  window.setTimeout(() => dismissAppToast(toast.id), durationMs);
}
