import React from 'react';
import { Smartphone, X } from 'lucide-react';
import { usePwaInstall } from '../contexts/PwaInstallContext';
import { useTranslation } from '../services/i18nContext';

/** Small bottom banner when the browser fires `beforeinstallprompt` (mainly Chrome/Android). */
export const InstallAppBanner: React.FC = () => {
  const { canInstall, bannerDismissed, dismissBanner, promptInstall } = usePwaInstall();
  const { t } = useTranslation();

  if (!canInstall || bannerDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pt-2 pb-3 md:pb-4 pointer-events-none [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-2xl mx-auto pointer-events-auto flex items-center gap-3 rounded-xl border border-primary-200 bg-white shadow-lg px-3 py-2 sm:px-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-primary-50 text-primary-700">
          <Smartphone className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t('pwa.bannerTitle')}</p>
          <p className="text-xs text-gray-600 hidden sm:block">{t('pwa.bannerBody')}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="text-sm font-semibold whitespace-nowrap rounded-lg bg-primary-600 text-white px-3 py-2 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {t('pwa.installButton')}
          </button>
          <button
            type="button"
            onClick={dismissBanner}
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
