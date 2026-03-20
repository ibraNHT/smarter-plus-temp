import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const PWA_INSTALL_DISMISSED_KEY = 'agrimarket_pwa_install_banner_dismissed';

/** Chrome/Edge/Android: deferred install prompt (not standard DOM type in all TS libs). */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export interface PwaInstallContextValue {
  /** Browser handed us a deferred prompt; user can install from our UI. */
  canInstall: boolean;
  /** App is already running as installed PWA / standalone. */
  isInstalled: boolean;
  /** User closed the banner; menu entries still work. */
  bannerDismissed: boolean;
  dismissBanner: () => void;
  /** Trigger the native install sheet; resolves true if accepted. */
  promptInstall: () => Promise<boolean>;
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)');
  if (mq?.matches) return true;
  return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => getIsStandalone());
  const [bannerDismissed, setBannerDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === '1'
  );

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    setIsInstalled(getIsStandalone());

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    try {
      localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
    setBannerDismissed(true);
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }, [deferredPrompt]);

  const canInstall = Boolean(deferredPrompt) && !isInstalled;

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canInstall,
      isInstalled,
      bannerDismissed,
      dismissBanner,
      promptInstall,
    }),
    [canInstall, isInstalled, bannerDismissed, dismissBanner, promptInstall]
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
