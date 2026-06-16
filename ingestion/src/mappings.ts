// ── Source → canonical mappings ────────────────────────────────────────────
// KHDA / Dubai Pulse column names vary between datasets and over time, so we
// resolve each canonical field from a list of candidate header names
// (case-insensitive, punctuation-insensitive). Run `npm run describe` to see
// the real columns of your dataset and extend these lists if needed.

export const FIELD_ALIASES: Record<string, string[]> = {
  name: ['school name', 'name', 'name in english', 'english name', 'institution name'],
  name_ar: ['arabic name', 'name in arabic', 'school name arabic'],
  area: ['area', 'location', 'community', 'region', 'address area', 'zone'],
  curriculum: ['curriculum', 'curriculum name', 'education system'],
  gender: ['gender', 'school gender', 'students gender'],
  age_range: ['age range', 'ages', 'age', 'grades', 'grade range'],
  khda_rating: ['rating', 'inspection rating', 'khda rating', 'overall rating', 'dsib rating'],
  has_vacancy: ['vacancy', 'has vacancy', 'seats available', 'availability'],
  founded: ['founded', 'established', 'year established', 'opening year'],
  website: ['website', 'web', 'url', 'school website'],
  phone: ['phone', 'telephone', 'contact number', 'phone number'],
  lat: ['latitude', 'lat', 'y'],
  lng: ['longitude', 'lng', 'long', 'x'],
  enrollment: ['enrollment', 'total enrollment', 'students', 'total students', 'number of students'],
  capacity: ['capacity', 'student capacity', 'max capacity'],
  data_year: ['academic year', 'year', 'data year'],
  source_ref: ['school id', 'id', 'khda id', 'dsib id', 'school code', '_id'],
};

// Curriculum strings → our enum values.
// NOTE: short tokens need \b — bare /us/ matched "Russian"/"Australian",
// bare /uk/ matched "Ukrainian".
const CURRICULUM_MAP: [RegExp, string][] = [
  [/\buk\b|british|england|cambridge|pearson|edexcel/i, 'British'],
  [/\bus\b|\busa\b|american/i, 'American'],
  [/\bib\b|international baccalaureate|baccalaureate/i, 'IB'],
  [/cbse/i, 'Indian (CBSE)'],
  [/icse|cisce/i, 'Indian (ICSE)'],
  [/indian/i, 'Indian (CBSE)'],
  [/french|france|mlf|aefe/i, 'French'],
  [/moe|ministry of education|uae/i, 'UAE/MoE'],
];

export function normalizeCurriculum(raw: string | null | undefined): string {
  if (!raw) return 'Other';
  for (const [re, val] of CURRICULUM_MAP) if (re.test(raw)) return val;
  return 'Other';
}

// KHDA inspection ratings → our enum (handles spacing/case variants).
const RATING_MAP: [RegExp, string][] = [
  [/outstanding/i, 'Outstanding'],
  [/very\s*good/i, 'Very Good'],
  [/good/i, 'Good'],
  [/acceptable/i, 'Acceptable'],
  // KHDA's older label "Unsatisfactory" was renamed "Weak".
  [/weak|unsatisfactory/i, 'Weak'],
];

export function normalizeRating(raw: string | null | undefined): string {
  if (!raw) return 'Not Rated';
  // Check "very good" before "good" — order matters, handled by map order.
  for (const [re, val] of RATING_MAP) if (re.test(raw)) return val;
  return 'Not Rated';
}

export function normalizeGender(
  raw: string | null | undefined
): 'Boys' | 'Girls' | 'Mixed' {
  const s = (raw ?? '').toLowerCase();
  if (/girl/.test(s)) return 'Girls';
  if (/boy/.test(s)) return 'Boys';
  return 'Mixed';
}

// KHDA has no gender column — infer it from the school name when possible
// ("... for Boys", "... Girls School"). Defaults to Mixed.
export function inferGenderFromName(name: string): 'Boys' | 'Girls' | 'Mixed' {
  const s = name.toLowerCase();
  if (/\bgirls?\b/.test(s)) return 'Girls';
  if (/\bboys?\b/.test(s)) return 'Boys';
  return 'Mixed';
}

// Trim and title-case area names; collapse common variants.
// Short all-caps tokens are kept as acronyms (JLT, DSO) except Arabic
// particles KHDA writes in caps ("AL QUSAIS" → "Al Qusais").
const NOT_ACRONYMS = new Set(['AL', 'UM', 'BIN', 'BUR', 'OUD', 'NAD']);

export function normalizeArea(raw: string | null | undefined): string {
  const s = (raw ?? '').trim().replace(/\s+/g, ' ');
  if (!s) return 'Dubai';
  return s
    .split(' ')
    .map((w) =>
      w.length <= 3 && w === w.toUpperCase() && !NOT_ACRONYMS.has(w)
        ? w
        : titleWord(w)
    )
    .join(' ');
}

function titleWord(w: string): string {
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

export function parseBoolish(raw: unknown): boolean {
  const s = String(raw ?? '').toLowerCase().trim();
  return ['yes', 'true', '1', 'available', 'y', 'open'].includes(s);
}

export function parseIntish(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function parseFloatish(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Resolve a canonical field's value from a raw row using alias list. */
export function pick(row: Record<string, unknown>, field: string): unknown {
  const aliases = FIELD_ALIASES[field] ?? [field];
  const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wanted = new Set(aliases.map(norm));
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(norm(key))) return value;
  }
  return undefined;
}
