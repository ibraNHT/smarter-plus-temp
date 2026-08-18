import { Share } from '@capacitor/share';
import { isNativeApp } from './nativePlatform';

export async function nativeShareOrCopy(data: {
  title: string;
  text: string;
  url: string;
}): Promise<'shared' | 'copied' | 'dismissed'> {
  try {
    if (isNativeApp()) {
      await Share.share({
        title: data.title,
        text: data.text,
        url: data.url,
        dialogTitle: data.title,
      });
      return 'shared';
    }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share(data);
      return 'shared';
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
      return 'copied';
    }
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'AbortError' || name === 'ShareCanceled') return 'dismissed';
  }
  return 'dismissed';
}
