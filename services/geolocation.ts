import { Geolocation } from '@capacitor/geolocation';
import { isNativeApp } from './nativePlatform';

/** Default map center (Cameroon) when no coordinates yet */
export const DEFAULT_MAP_CENTER = { lat: 4.0511, lng: 9.7679 };

export type ReverseGeocodeResult = {
  address: string;
  city: string;
  region: string;
};

export async function requestBrowserLocation(): Promise<{ lat: number; lng: number }> {
  if (isNativeApp()) {
    const perm = await Geolocation.requestPermissions();
    const loc = perm.location ?? perm.coarseLocation;
    if (loc === 'denied') {
      throw new Error('Location access denied');
    }
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 20_000,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }

  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        reject(err instanceof Error ? err : new Error(String(err?.message ?? 'Location access denied')));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
}

/** OpenStreetMap Nominatim reverse lookup (no API key). */
export async function nominatimReverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const row = await res.json();
    const addr = row?.address ?? {};
    const city =
      addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.hamlet || '';
    const region = addr.state || addr.region || addr.province || '';
    const display = String(row?.display_name ?? '').trim();
    return {
      address: display,
      city: String(city),
      region: String(region),
    };
  } catch {
    return null;
  }
}
