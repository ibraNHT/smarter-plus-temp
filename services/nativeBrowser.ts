import { Browser } from '@capacitor/browser';
import { isNativeApp } from './nativePlatform';

/** Open an external URL in Safari View Controller / Chrome Custom Tabs on native. */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;
  if (isNativeApp()) {
    await Browser.open({ url, presentationStyle: 'popover' });
    return;
  }
  window.location.href = url;
}
