// Web map (Leaflet + OpenStreetMap, free). Native gets SchoolMap.tsx instead.
//
// Leaflet (and the markercluster plugin) are browser-only and break Metro
// bundling + expo-router static render if imported at module scope, so we load
// them from a CDN at runtime inside an effect — never on the server.
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import i18n from '@/i18n';
import type { School } from '@/lib/types';
import { useTheme } from '@/theme';

const DUBAI: [number, number] = [25.2048, 55.2708];
const LV = '1.9.4'; // leaflet
const MCV = '1.5.3'; // markercluster

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

function addCss(id: string, href: string) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function addScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any)._loaded) resolve();
      else existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => { (s as any)._loaded = true; resolve(); };
    s.onerror = () => reject(new Error('script load failed: ' + src));
    document.head.appendChild(s);
  });
}

/** Load Leaflet + markercluster from CDN; resolve with window.L. */
async function loadLeaflet(): Promise<any> {
  const w = window as any;
  addCss('leaflet-css', `https://unpkg.com/leaflet@${LV}/dist/leaflet.css`);
  addCss('mc-css', `https://unpkg.com/leaflet.markercluster@${MCV}/dist/MarkerCluster.css`);
  addCss('mc-css-def', `https://unpkg.com/leaflet.markercluster@${MCV}/dist/MarkerCluster.Default.css`);
  if (!w.L) await addScript('leaflet-js', `https://unpkg.com/leaflet@${LV}/dist/leaflet.js`);
  if (!w.L.markerClusterGroup)
    await addScript('mc-js', `https://unpkg.com/leaflet.markercluster@${MCV}/dist/leaflet.markercluster.js`);
  return w.L;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) =>
    ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '"' ? '&quot;' : '&#39;'
  );
}

export function SchoolMap({
  schools,
  gated = false,
}: {
  schools: School[];
  gated?: boolean;
}) {
  const router = useRouter();
  const { dark } = useTheme();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const [error, setError] = useState(false);

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

        // Marker clustering keeps 223 dense pins legible.
        clusterRef.current = L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 50,
          showCoverageOnHover: false,
        });
        map.addLayer(clusterRef.current);
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 120);

        // "Near me" control.
        const Locate = L.Control.extend({
          onAdd() {
            const b = L.DomUtil.create('button');
            b.innerHTML = '📍';
            b.title = i18n.t('home.locateMe');
            b.style.cssText =
              'width:36px;height:36px;font-size:18px;line-height:36px;background:#fff;border:none;border-radius:6px;cursor:pointer;box-shadow:0 1px 5px rgba(0,0,0,.3)';
            L.DomEvent.on(b, 'click', (e: Event) => {
              L.DomEvent.stop(e);
              map.locate({ setView: true, maxZoom: 13 });
            });
            return b;
          },
        });
        new Locate({ position: 'topright' }).addTo(map);
        map.on('locationfound', (e: any) => {
          L.circleMarker(e.latlng, {
            radius: 8, color: '#fff', weight: 2,
            fillColor: '#1E90FF', fillOpacity: 0.9,
          }).addTo(map).bindPopup(i18n.t('home.locateMe')).openPopup();
        });

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

  useEffect(() => {
    const L = (window as any).L;
    if (L && mapRef.current) drawMarkers(L);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schools, gated]);

  function drawMarkers(L: any) {
    const cluster = clusterRef.current;
    const map = mapRef.current;
    if (!cluster || !map) return;
    cluster.clearLayers();
    const pts: [number, number][] = [];
    for (const s of schools) {
      if (s.lat == null || s.lng == null) continue;
      pts.push([s.lat, s.lng]);
      const fee =
        !gated && s.feeMinAed != null && s.feeMaxAed != null
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
        .addTo(cluster);
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
