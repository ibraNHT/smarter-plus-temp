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
const PWA_INTENT_NUDGED_KEY = 'agrimarket_pwa_intent_nudged';

/** Chrome/Edge/Android: deferred install prompt (not standard DOM type in all TS libs). */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type PwaNudgeSource = 'favorite' | 'cart' | 'return';

export interface PwaInstallContextValue {
  /** Browser handed us a deferred prompt; user can install from our UI. */
  canInstall: boolean;
  /** App is already running as installed PWA / standalone. */
  isInstalled: boolean;
  /** User closed the banner; menu entries still work. */
  bannerDismissed: boolean;
  /** High-intent nudge should surface the banner even after dismiss. */
  intentForced: boolean;
  /** Soft iOS Safari tip (no beforeinstallprompt). */
  showIosTip: boolean;
  intentSource: PwaNudgeSource | null;
  dismissBanner: () => void;
  dismissIosTip: () => void;
  /** Trigger the native install sheet; resolves true if accepted. */
  promptInstall: () => Promise<boolean>;
  /** Soft-prompt install after favorite / cart / return visit. */
  nudgeInstall: (source: PwaNudgeSource) => void;
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)');
  if (mq?.matches) return true;
  return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const chromeIos = /CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && !chromeIos;
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => getIsStandalone());
  const [bannerDismissed, setBannerDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === '1'
  );
  const [intentForced, setIntentForced] = useState(false);
  const [intentSource, setIntentSource] = useState<PwaNudgeSource | null>(null);
  const [iosTipDismissed, setIosTipDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIntentForced(false);
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
    setIntentForced(false);
    setIntentSource(null);
  }, []);

  const dismissIosTip = useCallback(() => {
    setIosTipDismissed(true);
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIntentForced(false);
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }, [deferredPrompt]);

  const nudgeInstall = useCallback((source: PwaNudgeSource) => {
    if (getIsStandalone()) return;
    try {
      const nudged = sessionStorage.getItem(PWA_INTENT_NUDGED_KEY);
      if (nudged) return;
      sessionStorage.setItem(PWA_INTENT_NUDGED_KEY, source);
    } catch {
      /* ignore */
    }
    setIntentSource(source);
    setIntentForced(true);
  }, []);

  const canInstall = Boolean(deferredPrompt) && !isInstalled;
  const showIosTip =
    !isInstalled &&
    !iosTipDismissed &&
    intentForced &&
    !canInstall &&
    isIosSafari();

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canInstall,
      isInstalled,
      bannerDismissed,
      intentForced,
      showIosTip,
      intentSource,
      dismissBanner,
      dismissIosTip,
      promptInstall,
      nudgeInstall,
    }),
    [
      canInstall,
      isInstalled,
      bannerDismissed,
      intentForced,
      showIosTip,
      intentSource,
      dismissBanner,
      dismissIosTip,
      promptInstall,
      nudgeInstall,
    ]
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
