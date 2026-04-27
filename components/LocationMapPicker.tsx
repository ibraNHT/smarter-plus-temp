import React, { useEffect, useRef } from 'react';
import { loadGooglePlacesApi } from '../services/googlePlaces';
import { DEFAULT_MAP_CENTER } from '../services/geolocation';

let leafletLoadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  const w = window as unknown as { L?: unknown };
  if (w.L) return Promise.resolve();
  if (!leafletLoadPromise) {
    leafletLoadPromise = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Leaflet failed to load'));
      document.head.appendChild(script);
    });
  }
  return leafletLoadPromise;
}

export type LocationMapPickerProps = {
  latitude: number;
  longitude: number;
  onPositionChange: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
};

/**
 * Draggable pin on Google Maps (if VITE_GOOGLE_MAPS_API_KEY is set) or Leaflet + OSM.
 * Click map or drag pin to update coordinates.
 */
export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  latitude,
  longitude,
  onPositionChange,
  height = 'min(280px, 50vh)',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const googleMarkerRef = useRef<{ map: any; marker: any } | null>(null);
  const leafletRef = useRef<{ map: any; marker: any } | null>(null);

  const effectiveLat =
    Number.isFinite(latitude) && Math.abs(latitude) > 1e-6 ? latitude : DEFAULT_MAP_CENTER.lat;
  const effectiveLng =
    Number.isFinite(longitude) && Math.abs(longitude) > 1e-6 ? longitude : DEFAULT_MAP_CENTER.lng;
  const zoom =
    Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)
      ? 16
      : 6;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    (async () => {
      const hasGoogle = await loadGooglePlacesApi();
      if (cancelled || !containerRef.current) return;

      const g = (window as any).google;
      if (hasGoogle && g?.maps?.Map) {
        const map = new g.maps.Map(el, {
          center: { lat: effectiveLat, lng: effectiveLng },
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
        });
        const marker = new g.maps.Marker({
          position: { lat: effectiveLat, lng: effectiveLng },
          map,
          draggable: true,
        });
        googleMarkerRef.current = { map, marker };

        const emit = () => {
          const p = marker.getPosition();
          if (p) onPositionChange(p.lat(), p.lng());
        };
        marker.addListener('dragend', emit);
        map.addListener('click', (e: any) => {
          if (e.latLng) {
            marker.setPosition(e.latLng);
            emit();
          }
        });
        return;
      }

      await loadLeaflet();
      if (cancelled || !containerRef.current) return;
      const L = (window as any).L;
      const map = L.map(el).setView([effectiveLat, effectiveLng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      const marker = L.marker([effectiveLat, effectiveLng], { draggable: true }).addTo(map);
      leafletRef.current = { map, marker };

      marker.on('dragend', () => {
        const ll = marker.getLatLng();
        onPositionChange(ll.lat, ll.lng);
      });
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        onPositionChange(e.latlng.lat, e.latlng.lng);
      });
      setTimeout(() => map.invalidateSize(), 200);
    })();

    return () => {
      cancelled = true;
      googleMarkerRef.current = null;
      if (leafletRef.current) {
        try {
          leafletRef.current.map.remove();
        } catch {
          /* ignore */
        }
        leafletRef.current = null;
      }
      el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lat0 = Number.isFinite(latitude) && Math.abs(latitude) > 1e-6 ? latitude : DEFAULT_MAP_CENTER.lat;
    const lng0 = Number.isFinite(longitude) && Math.abs(longitude) > 1e-6 ? longitude : DEFAULT_MAP_CENTER.lng;

    if (googleMarkerRef.current) {
      const { map, marker } = googleMarkerRef.current;
      const p = marker.getPosition();
      if (!p || Math.abs(p.lat() - lat0) > 1e-5 || Math.abs(p.lng() - lng0) > 1e-5) {
        marker.setPosition({ lat: lat0, lng: lng0 });
        map.panTo({ lat: lat0, lng: lng0 });
      }
    }
    if (leafletRef.current) {
      const { map, marker } = leafletRef.current;
      const ll = marker.getLatLng();
      if (Math.abs(ll.lat - lat0) > 1e-5 || Math.abs(ll.lng - lng0) > 1e-5) {
        marker.setLatLng([lat0, lng0]);
        map.setView([lat0, lng0], zoom);
      }
    }
  }, [latitude, longitude, zoom]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-100 ${className}`}
      style={{ height }}
      role="application"
      aria-label="Map: drag the pin or click to set your location"
    />
  );
};
