import ExcelJS from 'exceljs';
import type { CanonicalSchool } from '../types.js';
import { slugify } from '../slug.js';
import {
  inferGenderFromName,
  normalizeArea,
  normalizeCurriculum,
  normalizeRating,
  parseFloatish,
  parseIntish,
} from '../mappings.js';

// ── KHDA official workbook importer ────────────────────────────────────────
// Reads "Dubai's Private Schools Open Data.xlsx" published by KHDA at
// https://web.khda.gov.ae (no API key / login needed). The workbook has a
// "Main information YYYY-YYYY" sheet plus per-year "Fees YYYY-YYYY" sheets.
// We read the main sheet for school facts and the latest fees sheet for tuition,
// joining the two by normalized school name.

const MAIN_HEADER_ROW = 2; // row 1 is blank; headers on row 2 (1-indexed)
const FEES_HEADER_ROW = 2;

export interface KhdaImportResult {
  schools: CanonicalSchool[];
  skipped: { name: string; reason: string }[];
  feesMatched: number;
  feesUnmatched: number;
  dataYear: string;
}

interface FeeInfo {
  min: number;
  max: number;
  bands: { grade: string; annualAed: number }[];
}

interface FeeEntry {
  fingerprint: string; // sorted significant tokens
  tokens: Set<string>;
  info: FeeInfo;
}

// School names differ slightly between the Main and Fees sheets
// ("Al Adab ... for Girls" vs "Adab ... - Girls"), so we match on a normalized
// token set rather than exact name. Conservative: exact token-set, else
// Jaccard ≥ 0.6 — low enough to catch reorderings/noise, high enough to avoid
// false matches like "Brighton College Dubai" ↔ "Dubai College".
const NAME_STOPWORDS = new Set([
  'private', 'school', 'schools', 'the', 'for', 'of', 'dubai', 'international',
  'a', 'an', 'and', 'est', 'co', 'educational', 'education', 'academy',
  'nursery', 'kindergarten', 'kg', 'llc',
]);

function nameTokens(name: string): Set<string> {
  const cleaned = name
    .toLowerCase()
    .replace(/\bl\.?l\.?c\.?\b/g, ' ') // LLC variants
    .replace(/\(.*?\)/g, ' ') // (Br), (Branch)
    .replace(/\bbranch\b|\bbr\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ');
  return new Set(
    cleaned.split(/\s+/).filter((t) => t && !NAME_STOPWORDS.has(t))
  );
}

function fingerprintOf(tokens: Set<string>): string {
  return [...tokens].sort().join(' ');
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function headerMap(ws: ExcelJS.Worksheet, headerRow: number): string[] {
  const headers: string[] = [];
  const row = ws.getRow(headerRow);
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = String(cell.text ?? '').replace(/\s+/g, ' ').trim();
  });
  return headers;
}

function findExact(headers: string[], label: string): number {
  const t = label.toLowerCase();
  for (let i = 1; i < headers.length; i++) {
    if ((headers[i] ?? '').toLowerCase() === t) return i;
  }
  return -1;
}

function findContains(
  headers: string[],
  substr: string,
  opts: { last?: boolean; exclude?: string } = {}
): number {
  const t = substr.toLowerCase();
  let found = -1;
  for (let i = 1; i < headers.length; i++) {
    const h = (headers[i] ?? '').toLowerCase();
    if (!h.includes(t)) continue;
    if (opts.exclude && h.includes(opts.exclude.toLowerCase())) continue;
    found = i;
    if (!opts.last) break;
  }
  return found;
}

function yearFromSheetName(name: string): string | null {
  const m = name.match(/(\d{4})\s*[-/]\s*(\d{4})/);
  if (m) return `${m[1]}-${m[2]}`;
  const m2 = name.match(/(\d{4})\s*[-/]\s*(\d{2})\b/);
  if (m2) return `${m2[1]}-20${m2[2]}`;
  return null;
}

function parseFeesSheet(ws: ExcelJS.Worksheet): FeeEntry[] {
  const headers = headerMap(ws, FEES_HEADER_ROW);
  const nameCol = findExact(headers, 'School Name');
  const feeCols: { col: number; grade: string }[] = [];
  for (let i = 1; i < headers.length; i++) {
    const h = headers[i] ?? '';
    if (i === nameCol || !h) continue;
    if (/fee|fs1|kg|grade|year/i.test(h)) {
      const grade = h.replace(/fees/gi, '').replace(/\s+/g, ' ').replace(/^\/+|\/+$/g, '').trim();
      feeCols.push({ col: i, grade: grade || h });
    }
  }

  const entries: FeeEntry[] = [];
  for (let r = FEES_HEADER_ROW + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = nameCol > 0 ? String(row.getCell(nameCol).text ?? '').trim() : '';
    if (!name) continue;
    const bands: { grade: string; annualAed: number }[] = [];
    for (const { col, grade } of feeCols) {
      const v = parseIntish(row.getCell(col).text);
      if (v && v > 0) bands.push({ grade, annualAed: v });
    }
    if (bands.length === 0) continue;
    const amounts = bands.map((b) => b.annualAed);
    const tokens = nameTokens(name);
    entries.push({
      fingerprint: fingerprintOf(tokens),
      tokens,
      info: { min: Math.min(...amounts), max: Math.max(...amounts), bands },
    });
  }
  return entries;
}

function makeFeeMatcher(entries: FeeEntry[]) {
  const exact = new Map<string, FeeInfo>();
  for (const e of entries) if (!exact.has(e.fingerprint)) exact.set(e.fingerprint, e.info);
  return (schoolName: string): FeeInfo | null => {
    const tokens = nameTokens(schoolName);
    const fp = fingerprintOf(tokens);
    const hit = exact.get(fp);
    if (hit) return hit;
    let best: FeeInfo | null = null;
    let bestScore = 0.6; // inclusive threshold
    for (const e of entries) {
      const score = jaccard(tokens, e.tokens);
      if (score >= bestScore) {
        bestScore = score;
        best = e.info;
      }
    }
    return best;
  };
}

export async function importKhdaWorkbook(path: string): Promise<KhdaImportResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);

  const main =
    wb.worksheets.find((w) => /^main information/i.test(w.name)) ?? wb.worksheets[0];
  if (!main) throw new Error('No worksheets found in KHDA workbook');
  // Pick the NEWEST fees sheet by parsed year — sheet order is not guaranteed.
  const feesWs = wb.worksheets
    .filter((w) => /^fees/i.test(w.name))
    .sort(
      (a, b) =>
        (yearFromSheetName(b.name) ?? '').localeCompare(yearFromSheetName(a.name) ?? '')
    )[0];

  const dataYear = yearFromSheetName(main.name) ?? 'unknown';
  const matchFees = makeFeeMatcher(feesWs ? parseFeesSheet(feesWs) : []);

  const headers = headerMap(main, MAIN_HEADER_ROW);
  const col = {
    name: findExact(headers, 'School Name'),
    nameAr: headers.findIndex((h) => /اسم|arabic name/i.test(h ?? '')),
    location: findExact(headers, 'Location'),
    lat: findExact(headers, 'Latitude'),
    lng: findExact(headers, 'Longitude'),
    curriculum: findExact(headers, 'Curriculum'),
    phone: findContains(headers, 'telephone'),
    website: findContains(headers, 'website'),
    email: findContains(headers, 'email'),
    grades: findExact(headers, 'Grades'),
    founded: findContains(headers, 'established'),
    // Prefer an explicit "Latest" rating, else the right-most "DSIB Rating".
    rating:
      findContains(headers, 'latest dsib rating') >= 0
        ? findContains(headers, 'latest dsib rating')
        : findContains(headers, 'dsib rating', { last: true }),
    // Right-most enrolment column = most recent year.
    enrollment: findContains(headers, 'enrol', { last: true }),
  };

  if (col.name < 0) {
    throw new Error(
      `Could not find "School Name" header on row ${MAIN_HEADER_ROW}. ` +
        `Headers seen: ${headers.filter(Boolean).slice(0, 8).join(', ')}…`
    );
  }

  const schools: CanonicalSchool[] = [];
  const skipped: { name: string; reason: string }[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();
  let feesMatched = 0;
  let feesUnmatched = 0;

  const txt = (row: ExcelJS.Row, c: number): string | null => {
    if (c < 0) return null;
    const s = String(row.getCell(c).text ?? '').replace(/\s+/g, ' ').trim();
    return s === '' || s.toLowerCase() === 'n/a' ? null : s;
  };

  for (let r = MAIN_HEADER_ROW + 1; r <= main.rowCount; r++) {
    const row = main.getRow(r);
    const name = txt(row, col.name);
    if (!name) continue; // blank/spacer row

    let id = slugify(name);
    if (!id) {
      skipped.push({ name, reason: 'unslugifiable name' });
      continue;
    }
    if (seen.has(id)) {
      const area = txt(row, col.location);
      const withArea = area ? `${id}-${slugify(area)}` : id;
      if (withArea !== id && !seen.has(withArea)) {
        id = withArea;
      } else {
        let n = 2;
        while (seen.has(`${withArea}-${n}`)) n++;
        id = `${withArea}-${n}`;
      }
    }
    seen.add(id);

    const feeInfo = matchFees(name);
    if (feeInfo) feesMatched++;
    else feesUnmatched++;

    schools.push({
      id,
      name,
      name_ar: txt(row, col.nameAr),
      area: normalizeArea(txt(row, col.location)),
      curriculum: normalizeCurriculum(txt(row, col.curriculum)),
      gender: inferGenderFromName(name),
      age_range: txt(row, col.grades),
      khda_rating: normalizeRating(txt(row, col.rating)),
      fee_min_aed: feeInfo?.min ?? null,
      fee_max_aed: feeInfo?.max ?? null,
      fee_bands: feeInfo?.bands ?? null,
      fees_source: feeInfo ? `khda_official_xlsx (${dataYear})` : null,
      fees_updated_at: feeInfo ? now : null,
      has_vacancy: null, // not in KHDA data — unknown, NOT "no vacancy"
      vacancy_note: null,
      founded: parseIntish(txt(row, col.founded)),
      website: normalizeUrl(txt(row, col.website)),
      phone: normalizePhone(txt(row, col.phone)),
      lat: parseFloatish(txt(row, col.lat)),
      lng: parseFloatish(txt(row, col.lng)),
      enrollment: parseIntish(txt(row, col.enrollment)),
      capacity: null,
      data_year: dataYear,
      description: null,
      admissions_note: null,
      source: 'khda_official_xlsx',
      source_ref: txt(row, 1), // leading index column
      source_url: 'https://web.khda.gov.ae/KHDA/media/KHDA/DubaiPrivateSchoolsOpenData.xlsx',
      last_synced_at: now,
    });
  }

  return { schools, skipped, feesMatched, feesUnmatched, dataYear };
}

function normalizeUrl(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, '');
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return `https://${cleaned.replace(/^\/+/, '')}`;
}

function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, '');
  return digits || null;
}
