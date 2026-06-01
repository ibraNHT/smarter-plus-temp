import { useEffect } from 'react';

let lockCount = 0;

/** Prevents background page scroll while a modal is open (supports nested modals). */
export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    lockCount += 1;
    document.body.classList.add('agm-modal-open');
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.classList.remove('agm-modal-open');
      }
    };
  }, [locked]);
}
