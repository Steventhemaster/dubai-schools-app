// Web map (Leaflet + OpenStreetMap, free). Native gets SchoolMap.tsx instead.
//
// Leaflet is browser-only and breaks Metro bundling + expo-router's static
// (server) render if imported at module scope. So we load it from a CDN at
// runtime, inside an effect — never on the server, never through the bundler.
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import type { School } from '@/lib/types';
import { useTheme } from '@/theme';

const DUBAI: [number, number] = [25.2048, 55.2708];
const LEAFLET_VERSION = '1.9.4';

function ratingColor(r: School['khdaRating']): string {
  switch (r) {
    case 'Outstanding': return '#1E8E5A';
    case 'Very Good': return '#3CB371';
    case 'Good': return '#D4A017';
    case 'Acceptable': return '#E67E22';
    case 'Weak': return '#C0392B';
    default: return '#888';
  }
}

/** Inject Leaflet CSS + JS from CDN once; resolve with window.L. */
function loadLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
    document.head.appendChild(link);
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(w.L));
      return;
    }
    const s = document.createElement('script');
    s.id = 'leaflet-js';
    s.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    s.async = true;
    s.onload = () => resolve(w.L);
    s.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(s);
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) =>
    ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '"' ? '&quot;' : '&#39;'
  );
}

export function SchoolMap({ schools }: { schools: School[] }) {
  const router = useRouter();
  const { dark } = useTheme();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [error, setError] = useState(false);

  // Init map once Leaflet is loaded.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current || mapRef.current) return;
        const map = L.map(ref.current, { center: DUBAI, zoom: 11 });
        L.tileLayer(
          dark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          { attribution: '© OpenStreetMap, © CARTO', maxZoom: 19 }
        ).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 120);
        map.on('popupopen', (e: any) => {
          const el = e.popup.getElement()?.querySelector('.map-go');
          el?.addEventListener('click', (ev: Event) => {
            ev.preventDefault();
            const id = (el as HTMLElement).dataset.id;
            if (id) router.push(`/school/${id}`);
          }, { once: true });
        });
        drawMarkers(L);
      })
      .catch(() => setError(true));
    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark]);

  // Redraw markers when the filtered list changes.
  useEffect(() => {
    const L = (window as any).L;
    if (L && mapRef.current) drawMarkers(L);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schools]);

  function drawMarkers(L: any) {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    const pts: [number, number][] = [];
    for (const s of schools) {
      if (s.lat == null || s.lng == null) continue;
      pts.push([s.lat, s.lng]);
      const fee =
        s.feeMinAed != null && s.feeMaxAed != null
          ? `AED ${s.feeMinAed.toLocaleString()}–${s.feeMaxAed.toLocaleString()}`
          : '';
      L.circleMarker([s.lat, s.lng], {
        radius: 7, color: '#fff', weight: 1.5,
        fillColor: ratingColor(s.khdaRating), fillOpacity: 0.95,
      })
        .bindPopup(
          `<div style="min-width:160px">
             <strong>${escapeHtml(s.name)}</strong><br/>
             <span style="color:#666">${escapeHtml(s.area)}${
               s.khdaRating !== 'Not Rated' ? ' · ' + s.khdaRating : ''
             }</span>
             ${fee ? `<br/><span style="color:#0A3D62;font-weight:600">${fee}</span>` : ''}
             <br/><a href="#" class="map-go" data-id="${s.id}"
               style="display:inline-block;margin-top:6px;color:#0A3D62;font-weight:700">View school →</a>
           </div>`
        )
        .addTo(layer);
    }
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.15), { maxZoom: 14 });
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 14 }}>
        Map failed to load. Check your connection.
      </div>
    );
  }
  return <div ref={ref} style={{ flex: 1, width: '100%', height: '100%' }} />;
}
