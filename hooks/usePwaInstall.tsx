import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeDeferredInstallPrompt,
} from '../pwaInstallCapture';

const DISMISS_KEY = 'smarter-panel-pwa-install-dismissed';

type PwaInstallContextValue = {
  isInstalled: boolean;
  isIos: boolean;
  canPrompt: boolean;
  /** Show CTA when native prompt is available, or on iOS (manual A2HS). */
  shouldShow: boolean;
  dismissed: boolean;
  dismiss: () => void;
  promptInstall: () => Promise<{ outcome: 'accepted' | 'dismissed' | 'unavailable' }>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function detectInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || iosStandalone;
}

function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [canPrompt, setCanPrompt] = useState(() => !!getDeferredInstallPrompt());
  const [isInstalled, setIsInstalled] = useState(detectInstalled);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isIos] = useState(detectIos);

  useEffect(() => {
    const unsub = subscribeDeferredInstallPrompt((evt) => {
      setCanPrompt(!!evt);
    });

    const onInstalled = () => {
      setIsInstalled(true);
      clearDeferredInstallPrompt();
      setCanPrompt(false);
    };
    const onDisplayMode = () => {
      setIsInstalled(detectInstalled());
    };

    window.addEventListener('appinstalled', onInstalled);
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener?.('change', onDisplayMode);
    onDisplayMode();

    return () => {
      unsub();
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener?.('change', onDisplayMode);
    };
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const promptInstall = useCallback(async () => {
    const deferredPrompt = getDeferredInstallPrompt();
    if (!deferredPrompt) {
      return { outcome: 'unavailable' as const };
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    clearDeferredInstallPrompt();
    setCanPrompt(false);
    if (outcome === 'accepted') setIsInstalled(true);
    return { outcome };
  }, []);

  const shouldShow = !isInstalled && !dismissed && (canPrompt || isIos);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      isInstalled,
      isIos,
      canPrompt,
      shouldShow,
      dismissed,
      dismiss,
      promptInstall,
    }),
    [isInstalled, isIos, canPrompt, shouldShow, dismissed, dismiss, promptInstall]
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall(): PwaInstallContextValue {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) {
    throw new Error('usePwaInstall must be used within PwaInstallProvider');
  }
  return ctx;
}
