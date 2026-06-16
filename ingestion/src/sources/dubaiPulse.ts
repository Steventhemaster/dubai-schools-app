import { config } from '../config.js';
import type { RawRow, SourceAdapter } from '../types.js';

// ── Dubai Pulse (KHDA) open-data adapter ───────────────────────────────────
// Auth: exchange API Key/Secret for an OAuth token, then call the dataset API
// with a Bearer token. Dubai Pulse is CKAN-based, so responses typically wrap
// rows in { result: { records, total } }. We handle a few shapes defensively.
//
// ⚠️ Confirm the exact data URL + response shape on your dataset's API page,
//    and set DUBAI_PULSE_DATA_URL if it differs from the default below.

const PAGE_SIZE = 100;

async function getToken(): Promise<string> {
  const { apiKey, apiSecret, tokenUrl } = config.dubaiPulse;
  if (!apiKey || !apiSecret) {
    throw new Error(
      'DUBAI_PULSE_API_KEY / DUBAI_PULSE_API_SECRET are not set. ' +
        'Request free API access at https://www.dubaipulse.gov.ae'
    );
  }
  const body = new URLSearchParams({
    client_id: apiKey,
    client_secret: apiSecret,
  });
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  }
  const json: any = await res.json();
  const token = json.access_token ?? json.accessToken ?? json.token;
  if (!token) throw new Error('No access_token in token response');
  return token;
}

function dataUrl(): string {
  if (process.env.DUBAI_PULSE_DATA_URL) return process.env.DUBAI_PULSE_DATA_URL;
  const { baseUrl, resourceId } = config.dubaiPulse;
  // Default guess — override via env if your dataset page shows a different path.
  return `${baseUrl}/data/khda-schools/${resourceId}-open-api`;
}

/** Pull a single page; returns { records, total }. */
async function fetchPage(
  token: string,
  offset: number
): Promise<{ records: RawRow[]; total: number | null }> {
  const url = new URL(dataUrl());
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Data request failed: ${res.status} ${await res.text()}`);
  }
  const json: any = await res.json();

  // Handle CKAN ({result:{records}}) and plain ({data}|array) shapes.
  const records: RawRow[] =
    json?.result?.records ?? json?.records ?? json?.data ?? (Array.isArray(json) ? json : []);
  const total: number | null =
    json?.result?.total ?? json?.total ?? null;

  return { records, total };
}

export const dubaiPulseAdapter: SourceAdapter = {
  name: `dubai_pulse_khda:${config.dubaiPulse.resourceId}`,
  async fetchRows(): Promise<RawRow[]> {
    const token = await getToken();
    const all: RawRow[] = [];
    let offset = 0;
    // Hard cap to avoid runaway loops if `total` is missing.
    for (let page = 0; page < 200; page++) {
      const { records, total } = await fetchPage(token, offset);
      all.push(...records);
      if (records.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
      if (total !== null && offset >= total) break;
    }
    return all;
  },
};
