let mapsScriptPromise: Promise<void> | null = null;

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-places-script';

function getGoogleMapsApiKey(): string {
  return (
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY ||
    ''
  );
}

export async function loadGooglePlacesApi(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  if (w.google?.maps?.places) return true;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return false;

  if (!mapsScriptPromise) {
    mapsScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = GOOGLE_MAPS_SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });
  }

  try {
    await mapsScriptPromise;
    return Boolean((window as any).google?.maps?.places);
  } catch {
    return false;
  }
}

export type ParsedPlace = {
  address: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
};

export function parseGooglePlace(place: any): ParsedPlace | null {
  const address = place?.formatted_address || place?.name || '';
  const lat = place?.geometry?.location?.lat?.();
  const lng = place?.geometry?.location?.lng?.();
  if (!address || typeof lat !== 'number' || typeof lng !== 'number') return null;

  const components: any[] = Array.isArray(place?.address_components) ? place.address_components : [];
  const findByType = (types: string[]) =>
    components.find((c) => Array.isArray(c.types) && types.some((t) => c.types.includes(t)));

  const cityComp =
    findByType(['locality']) ||
    findByType(['postal_town']) ||
    findByType(['administrative_area_level_2']);
  const regionComp = findByType(['administrative_area_level_1']);

  return {
    address,
    city: cityComp?.long_name || '',
    region: regionComp?.long_name || '',
    lat,
    lng,
  };
}
