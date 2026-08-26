import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

type Variant = 'banner' | 'card';

export function PwaInstallCta({
  t,
  variant = 'banner',
}: {
  t: (key: string) => string;
  variant?: Variant;
}) {
  const { shouldShow, canPrompt, isIos, dismiss, promptInstall } = usePwaInstall();
  const [showIosHint, setShowIosHint] = useState(false);

  if (!shouldShow) return null;

  const handleInstall = async () => {
    if (canPrompt) {
      await promptInstall();
      return;
    }
    // iOS (and only iOS) cannot use beforeinstallprompt — show Add to Home Screen guidance.
    if (isIos) setShowIosHint(true);
  };

  if (variant === 'card') {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">{t('installAppHint')}</p>
        <button
          type="button"
          onClick={handleInstall}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          {t('installApp')}
        </button>
        {showIosHint && isIos && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center flex items-start justify-center gap-1.5">
            <Share className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{t('installAppIosHint')}</span>
          </p>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {t('installAppDismiss')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-600 text-white text-sm px-4 py-2 flex items-center justify-center gap-3 relative">
      <span className="text-center">
        {t('installAppHint')}{' '}
        <button type="button" className="underline font-medium inline-flex items-center gap-1" onClick={handleInstall}>
          <Download className="w-3.5 h-3.5" />
          {t('installApp')}
        </button>
      </span>
      {showIosHint && isIos && (
        <span className="hidden sm:inline text-blue-100 text-xs max-w-md">{t('installAppIosHint')}</span>
      )}
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-blue-500"
        aria-label={t('installAppDismiss')}
      >
        <X className="w-4 h-4" />
      </button>
      {showIosHint && isIos && (
        <p className="sm:hidden absolute left-0 right-0 top-full bg-blue-700 text-blue-50 text-xs px-4 py-2 text-center z-10">
          {t('installAppIosHint')}
        </p>
      )}
    </div>
  );
}
