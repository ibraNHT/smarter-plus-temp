import { useEffect } from 'react';
import { registerNativeBackHandler } from '../services/nativeBackStack';

/**
 * When `active`, Android hardware back is consumed by `onBack` (which should
 * close the overlay and return true).
 */
export function useNativeBackHandler(active: boolean, onBack: () => boolean): void {
  useEffect(() => {
    if (!active) return;
    return registerNativeBackHandler(onBack);
  }, [active, onBack]);
}
