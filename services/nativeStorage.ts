import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from './nativePlatform';

const memory = new Map<string, string>();
let hydrated = false;

const MIGRATE_KEYS = [
  'authToken',
  'refreshToken',
  'token',
  'accessToken',
  'currentUser',
  'cart',
  'guestEmail',
  'supportSessionId',
  'agm_language',
  'agm.preferredCurrency',
  'agm_support_fab_pos',
  'agm_new_offer_draft_v1',
  'agrimarket_pwa_install_banner_dismissed',
];

const MIGRATED_FLAG = 'agm_prefs_migrated';

async function persist(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value });
}

export async function hydrateNativeStorage(): Promise<void> {
  if (hydrated) return;
  if (!isNativeApp()) {
    hydrated = true;
    return;
  }

  const { keys } = await Preferences.keys();
  await Promise.all(
    keys.map(async (key) => {
      const { value } = await Preferences.get({ key });
      if (value != null) memory.set(key, value);
    }),
  );

  if (memory.get(MIGRATED_FLAG) !== '1' && typeof localStorage !== 'undefined') {
    const keysToCopy = new Set(MIGRATE_KEYS);
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key) keysToCopy.add(key);
      }
    } catch {
      /* ignore */
    }
    for (const key of keysToCopy) {
      try {
        const existing = localStorage.getItem(key);
        if (existing != null && !memory.has(key)) {
          memory.set(key, existing);
          await persist(key, existing);
        }
      } catch {
        /* ignore */
      }
    }
    memory.set(MIGRATED_FLAG, '1');
    await persist(MIGRATED_FLAG, '1');
  }

  hydrated = true;
}

export function nativeStorageGet(key: string): string | null {
  if (!isNativeApp()) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return memory.has(key) ? memory.get(key)! : null;
}

export function nativeStorageSet(key: string, value: string): void {
  if (!isNativeApp()) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  memory.set(key, value);
  void persist(key, value);
}

export function nativeStorageRemove(key: string): void {
  if (!isNativeApp()) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  memory.delete(key);
  void Preferences.remove({ key });
}