import React from 'react';
import { Smartphone, X } from 'lucide-react';
import { usePwaInstall } from '../contexts/PwaInstallContext';
import { useTranslation } from '../services/i18nContext';
import { useStoreOptional } from '../services/storeContext';
import { isNativeApp } from '../services/nativePlatform';

/** Bottom banner for Chrome install prompt + high-intent / iOS tips. */
export const InstallAppBanner: React.FC = () => {
  const {
    canInstall,
    bannerDismissed,
    intentForced,
    showIosTip,
    intentSource,
    dismissBanner,
    dismissIosTip,
    promptInstall,
  } = usePwaInstall();
  const { t } = useTranslation();
  const store = useStoreOptional();
  const compareCount = store?.compareList?.length ?? 0;
  if (isNativeApp()) return null;

  const showChromeBanner = canInstall && (!bannerDismissed || intentForced);
  const visible = showChromeBanner || showIosTip;
  if (!visible) return null;

  const bottomOffset = compareCount > 0
    ? 'calc(var(--agm-tabbar, 0px) + max(0.75rem, env(safe-area-inset-bottom)) + 5rem)'
    : 'calc(var(--agm-tabbar, 0px) + max(0.75rem, env(safe-area-inset-bottom)))';

  const intentBody =
    intentSource === 'favorite'
      ? t('pwa.intentFavorite')
      : intentSource === 'cart'
        ? t('pwa.intentCart')
        : intentSource === 'return'
          ? t('pwa.intentReturn')
          : t('pwa.bannerBody');

  return (
    <div
      className="fixed left-0 right-0 z-40 px-3 pointer-events-none"
      style={{ bottom: bottomOffset }}
    >
      <div className="max-w-2xl mx-auto pointer-events-auto flex items-center gap-3 rounded-xl border border-primary-200 bg-white shadow-lg px-3 py-2 sm:px-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-primary-50 text-primary-700">
          <Smartphone className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {showIosTip ? t('pwa.iosTipTitle') : t('pwa.bannerTitle')}
          </p>
          <p className="text-xs text-gray-600">
            {showIosTip ? t('pwa.iosTipBody') : intentForced ? intentBody : t('pwa.bannerBody')}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {showChromeBanner && (
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="text-sm font-semibold whitespace-nowrap rounded-lg bg-primary-600 text-white px-3 py-2 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {t('pwa.installButton')}
            </button>
          )}
          <button
            type="button"
            onClick={showIosTip ? dismissIosTip : dismissBanner}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label={t('pwa.dismiss')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
