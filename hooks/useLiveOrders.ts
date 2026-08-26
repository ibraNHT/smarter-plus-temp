import { useEffect, useRef } from 'react';
import { useStore } from '../services/storeContext';

/**
 * Keeps the order list current while the user is actually looking at it.
 *
 * Order status is driven by the *other* party (a seller marking IN_TRANSIT, a
 * retail admin verifying payment), so a buyer or producer watching a tracking
 * screen has no local event to react to. The store's background tick runs every
 * 60s across the whole app, which is fine for badge counts but too slow to feel
 * live on a page whose entire purpose is the current status — that gap is why
 * the status only appeared after a manual page refresh.
 *
 * Deliberately cheap:
 *  - only runs while the component using it is mounted (i.e. on an orders view)
 *  - pauses when the tab is hidden, and fires once immediately on becoming
 *    visible again, so switching back to the tab is instantly up to date
 *  - never touches any loading flag, so the refresh is silent — no skeleton
 *    flash or spinner on a list that is already on screen
 */
export function useLiveOrders(intervalMs = 25_000): void {
  const { user, refreshOrders } = useStore();
  // The store value is rebuilt every render, so refreshOrders has a new identity
  // each time; depending on it directly would tear down and recreate the
  // interval on every render and it would never actually fire.
  const refreshRef = useRef(refreshOrders);
  refreshRef.current = refreshOrders;

  useEffect(() => {
    if (!user?.id) return undefined;

    const isVisible = () =>
      typeof document === 'undefined' || document.visibilityState === 'visible';

    let inFlight = false;
    const tick = async () => {
      if (!isVisible() || inFlight) return;
      inFlight = true;
      try {
        // force: a poll that wants the current status is exactly the case the
        // stale-cache window would otherwise swallow.
        await refreshRef.current({ force: true });
      } catch {
        // Background refresh — a failure just means the next tick tries again.
      } finally {
        inFlight = false;
      }
    };

    const interval = setInterval(tick, intervalMs);
    const onVisibility = () => { if (isVisible()) void tick(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.id, intervalMs]);
}
