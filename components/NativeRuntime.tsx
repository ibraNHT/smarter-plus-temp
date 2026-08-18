import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { consumeNativeBack } from '../services/nativeBackStack';
import { isNativeApp } from '../services/nativePlatform';
import { NativeOfflineBanner } from './NativeOfflineBanner';

const ROOT_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/market/producers',
  '/market/ati',
  '/producer/dashboard',
]);

/**
 * Wires Capacitor app/lifecycle plugins. Renders nothing on web.
 */
export function NativeRuntime() {
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    if (!isNativeApp()) return;
    document.documentElement.classList.add('agm-native');

    void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
    void StatusBar.setOverlaysWebView({ overlay: true }).catch(() => undefined);
    void SplashScreen.hide().catch(() => undefined);

    const back = App.addListener('backButton', ({ canGoBack }) => {
      if (consumeNativeBack()) return;
      const path = pathRef.current;
      if (!ROOT_PATHS.has(path) && canGoBack) {
        window.history.back();
        return;
      }
      void App.exitApp();
    });

    const state = App.addListener('appStateChange', ({ isActive }) => {
      window.dispatchEvent(new CustomEvent('agm:app-state', { detail: { isActive } }));
    });

    const net = Network.addListener('networkStatusChange', (status) => {
      window.dispatchEvent(new CustomEvent('agm:network', { detail: status }));
    });

    void Network.getStatus().then((status) => {
      window.dispatchEvent(new CustomEvent('agm:network', { detail: status }));
    });

    const show = Keyboard.addListener('keyboardWillShow', () => {
      document.documentElement.classList.add('agm-keyboard-open');
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      document.documentElement.classList.remove('agm-keyboard-open');
    });

    return () => {
      document.documentElement.classList.remove('agm-native', 'agm-keyboard-open');
      void back.then((h) => h.remove());
      void state.then((h) => h.remove());
      void net.then((h) => h.remove());
      void show.then((h) => h.remove());
      void hide.then((h) => h.remove());
    };
  }, []);

  if (!isNativeApp()) return null;
  return <NativeOfflineBanner />;
}
