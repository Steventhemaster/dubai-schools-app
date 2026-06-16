import type { CanonicalSchool, NormalizeResult, RawRow } from './types.js';
import { slugify } from './slug.js';
import {
  normalizeArea,
  normalizeCurriculum,
  normalizeGender,
  normalizeRating,
  parseBoolish,
  parseFloatish,
  parseIntish,
  pick,
} from './mappings.js';

function str(row: RawRow, field: string): string | null {
  const v = pick(row, field);
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s.toLowerCase() === 'n/a' ? null : s;
}

/**
 * Convert raw source rows → canonical schools.
 * Rows missing a usable name are skipped (and reported, not silently dropped).
 */
export function normalize(
  rows: RawRow[],
  meta: { source: string; sourceUrl?: string; dataYear?: string }
): NormalizeResult {
  const ok: CanonicalSchool[] = [];
  const skipped: { row: RawRow; reason: string }[] = [];
  const seenIds = new Set<string>();
  const now = new Date().toISOString();

  for (const row of rows) {
    const name = str(row, 'name');
    if (!name) {
      skipped.push({ row, reason: 'missing school name' });
      continue;
    }

    let id = slugify(name);
    if (!id) {
      skipped.push({ row, reason: `unslugifiable name: "${name}"` });
      continue;
    }
    // Disambiguate slug collisions (e.g. multiple campuses, same trimmed
    // name). Loop until unique — three or more same-name branches exist in
    // real KHDA data, and a duplicate id in one batch fails the whole upsert.
    if (seenIds.has(id)) {
      const area = str(row, 'area');
      const withArea = area ? `${id}-${slugify(area)}` : id;
      let candidate = withArea !== id && !seenIds.has(withArea) ? withArea : '';
      if (!candidate) {
        let n = 2;
        while (seenIds.has(`${withArea}-${n}`)) n++;
        candidate = `${withArea}-${n}`;
      }
      id = candidate;
    }
    seenIds.add(id);

    ok.push({
      id,
      name,
      name_ar: str(row, 'name_ar'),
      area: normalizeArea(str(row, 'area')),
      curriculum: normalizeCurriculum(str(row, 'curriculum')),
      gender: normalizeGender(str(row, 'gender')),
      age_range: str(row, 'age_range'),
      khda_rating: normalizeRating(str(row, 'khda_rating')),
      // Fees are NOT in KHDA open data — left null, filled by a separate source.
      fee_min_aed: null,
      fee_max_aed: null,
      // Tri-state: absent/empty column = unknown (null), never a false "no".
      has_vacancy: vacancyOf(row),
      vacancy_note: null,
      founded: parseIntish(pick(row, 'founded')),
      website: normalizeUrl(str(row, 'website')),
      phone: str(row, 'phone'),
      lat: parseFloatish(pick(row, 'lat')),
      lng: parseFloatish(pick(row, 'lng')),
      enrollment: parseIntish(pick(row, 'enrollment')),
      capacity: parseIntish(pick(row, 'capacity')),
      data_year: str(row, 'data_year') ?? meta.dataYear ?? null,
      description: null,
      admissions_note: null,
      source: meta.source,
      source_ref: str(row, 'source_ref'),
      source_url: meta.sourceUrl ?? null,
      last_synced_at: now,
    });
  }

  return { ok, skipped };
}

function vacancyOf(row: RawRow): boolean | null {
  const v = pick(row, 'has_vacancy');
  if (v === undefined || v === null || String(v).trim() === '') return null;
  return parseBoolish(v);
}

function normalizeUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, '')}`;
}
