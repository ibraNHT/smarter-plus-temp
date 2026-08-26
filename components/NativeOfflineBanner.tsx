import React, { useCallback, useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { useTranslation } from '../services/i18nContext';
import { isNativeApp } from '../services/nativePlatform';

export const NativeOfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(false);

  const apply = useCallback((connected: boolean) => {
    setOffline(!connected);
  }, []);

  useEffect(() => {
    if (!isNativeApp()) return;
    void Network.getStatus().then((status) => apply(status.connected));
    const onNetwork = (event: Event) => {
      const connected = (event as CustomEvent<{ connected?: boolean }>).detail?.connected;
      if (typeof connected === 'boolean') apply(connected);
    };
    window.addEventListener('agm:network', onNetwork);
    return () => window.removeEventListener('agm:network', onNetwork);
  }, [apply]);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-[90] bg-amber-600 text-white text-center text-sm font-medium px-3 py-2"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      {t('offline.banner')}
    </div>
  );
};
