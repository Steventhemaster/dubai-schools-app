// ── Family Planner & Recommendation Engine ────────────────────────────────
// The "brain" of the relocation-intelligence pivot. Pure functions over the
// existing School data + the user's FamilyPlan. Where we lack real data
// (commute drive-time, vacancy, lifestyle), we produce clearly-labelled
// ESTIMATES rather than browsing-only UX.

import type { School } from './types';

// ── Work locations (preset office hubs) ────────────────────────────────────
export interface OfficeLocation {
  id: string;
  label: string;
  lat: number;
  lng: number;
  group: string; // zone, used to section the picker
}

// Major Dubai employment hubs (plus the neighbouring emirates many commute
// to). Grouped by zone so the picker stays scannable. Coordinates are hub
// centroids — good enough for estimated drive-time, not turn-by-turn.
export const OFFICES: OfficeLocation[] = [
  // Central / Sheikh Zayed Road corridor
  { id: 'difc', label: 'DIFC', lat: 25.211, lng: 55.2796, group: 'Central (SZR corridor)' },
  { id: 'downtown', label: 'Downtown Dubai', lat: 25.1972, lng: 55.2744, group: 'Central (SZR corridor)' },
  { id: 'business-bay', label: 'Business Bay', lat: 25.185, lng: 55.265, group: 'Central (SZR corridor)' },
  { id: 'dwtc', label: 'World Trade Centre / SZR', lat: 25.2253, lng: 55.287, group: 'Central (SZR corridor)' },
  { id: 'd3', label: 'Dubai Design District (d3)', lat: 25.187, lng: 55.297, group: 'Central (SZR corridor)' },
  { id: 'dhcc', label: 'Dubai Healthcare City', lat: 25.231, lng: 55.323, group: 'Central (SZR corridor)' },
  { id: 'meydan', label: 'Meydan', lat: 25.162, lng: 55.3, group: 'Central (SZR corridor)' },

  // Tecom / Marina belt (south-west coast)
  { id: 'internet-city', label: 'Dubai Internet City', lat: 25.095, lng: 55.161, group: 'Tecom / Marina belt' },
  { id: 'media-city', label: 'Dubai Media City', lat: 25.095, lng: 55.156, group: 'Tecom / Marina belt' },
  { id: 'knowledge-park', label: 'Dubai Knowledge Park', lat: 25.101, lng: 55.162, group: 'Tecom / Marina belt' },
  { id: 'barsha-heights', label: 'Barsha Heights (TECOM)', lat: 25.1, lng: 55.18, group: 'Tecom / Marina belt' },
  { id: 'jlt', label: 'JLT (Jumeirah Lake Towers)', lat: 25.069, lng: 55.141, group: 'Tecom / Marina belt' },
  { id: 'dubai-marina', label: 'Dubai Marina', lat: 25.08, lng: 55.14, group: 'Tecom / Marina belt' },

  // Al Quoz / motor & sports cluster (mid)
  { id: 'al-quoz', label: 'Al Quoz', lat: 25.14, lng: 55.23, group: 'Al Quoz / Motor cluster' },
  { id: 'science-park', label: 'Dubai Science Park', lat: 25.103, lng: 55.233, group: 'Al Quoz / Motor cluster' },
  { id: 'production-city', label: 'Dubai Production City (IMPZ)', lat: 25.034, lng: 55.19, group: 'Al Quoz / Motor cluster' },
  { id: 'studio-city', label: 'Dubai Studio City', lat: 25.03, lng: 55.23, group: 'Al Quoz / Motor cluster' },
  { id: 'sports-city', label: 'Dubai Sports City', lat: 25.038, lng: 55.218, group: 'Al Quoz / Motor cluster' },
  { id: 'motor-city', label: 'Motor City', lat: 25.045, lng: 55.238, group: 'Al Quoz / Motor cluster' },

  // Silicon Oasis / Academic (east)
  { id: 'dso', label: 'Dubai Silicon Oasis', lat: 25.1216, lng: 55.3815, group: 'Silicon Oasis / Academic' },
  { id: 'outsource-city', label: 'Dubai Outsource City', lat: 25.123, lng: 55.392, group: 'Silicon Oasis / Academic' },
  { id: 'academic-city', label: 'Dubai Academic City', lat: 25.109, lng: 55.413, group: 'Silicon Oasis / Academic' },

  // Airport / Deira (north-east)
  { id: 'dafza', label: 'DAFZA (Airport Free Zone)', lat: 25.265, lng: 55.357, group: 'Airport / Deira' },
  { id: 'dxb-airport', label: 'Dubai Int’l Airport (DXB)', lat: 25.253, lng: 55.365, group: 'Airport / Deira' },
  { id: 'festival-city', label: 'Dubai Festival City', lat: 25.222, lng: 55.349, group: 'Airport / Deira' },
  { id: 'deira', label: 'Deira / Dubai Creek', lat: 25.271, lng: 55.314, group: 'Airport / Deira' },
  { id: 'bur-dubai', label: 'Bur Dubai', lat: 25.258, lng: 55.296, group: 'Airport / Deira' },

  // Southern free zones (far south-west)
  { id: 'jafza', label: 'JAFZA (Jebel Ali Free Zone)', lat: 25.0, lng: 55.07, group: 'Southern free zones' },
  { id: 'dip', label: 'Dubai Investment Park (DIP)', lat: 24.97, lng: 55.18, group: 'Southern free zones' },
  { id: 'dubai-south', label: 'Dubai South / Expo City', lat: 24.896, lng: 55.161, group: 'Southern free zones' },

  // Neighbouring emirates
  { id: 'sharjah', label: 'Sharjah', lat: 25.346, lng: 55.421, group: 'Other emirates' },
  { id: 'abu-dhabi', label: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, group: 'Other emirates' },
];

// ── Budget bands (annual tuition, AED) ─────────────────────────────────────
export type BudgetBand = 'lt30' | '30-50' | '50-80' | '80-120' | 'gt120';
export const BUDGET_BANDS: { id: BudgetBand; label: string; max: number }[] = [
  { id: 'lt30', label: 'Below AED 30,000', max: 30000 },
  { id: '30-50', label: 'AED 30,000–50,000', max: 50000 },
  { id: '50-80', label: 'AED 50,000–80,000', max: 80000 },
  { id: '80-120', label: 'AED 80,000–120,000', max: 120000 },
  { id: 'gt120', label: 'AED 120,000+', max: 250000 },
];

export type CurriculumPref = School['curriculum'] | 'Any';

export type Priority =
  | 'academics'
  | 'affordability'
  | 'availability'
  | 'commute'
  | 'sports'
  | 'arts'
  | 'university'
  | 'lifestyle';

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'academics', label: 'Academic excellence' },
  { id: 'affordability', label: 'Affordability' },
  { id: 'availability', label: 'Seat availability' },
  { id: 'commute', label: 'Short commute' },
  { id: 'university', label: 'University placement' },
  { id: 'sports', label: 'Sports' },
  { id: 'arts', label: 'Arts' },
  { id: 'lifestyle', label: 'Family lifestyle' },
];

export interface Child {
  age?: number;
  currentGrade?: string;
}

export interface FamilyPlan {
  officeId: string; // OFFICES id or 'custom'
  customLat?: number;
  customLng?: number;
  children: Child[];
  curriculum: CurriculumPref;
  budget: BudgetBand;
  priorities: Priority[]; // ranked, highest first (top 3 weighted)
  createdAt: string;
}

// ── Geo / commute ──────────────────────────────────────────────────────────
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimated drive minutes from straight-line distance. Dubai arterial roads +
 * traffic ≈ 1.35× detour factor and ~38 km/h effective speed. This is an
 * ESTIMATE; a Google Distance Matrix integration (via a server proxy) can
 * replace `estimateDriveMinutes` later without changing callers.
 */
export function estimateDriveMinutes(km: number): number {
  const roadKm = km * 1.35;
  return Math.round((roadKm / 38) * 60) + 4; // +4 min base (parking/access)
}

export function planOrigin(plan: FamilyPlan): { lat: number; lng: number } | null {
  if (plan.officeId === 'custom' && plan.customLat != null && plan.customLng != null) {
    return { lat: plan.customLat, lng: plan.customLng };
  }
  const office = OFFICES.find((o) => o.id === plan.officeId);
  return office ? { lat: office.lat, lng: office.lng } : null;
}

export function commuteFor(
  school: School,
  plan: FamilyPlan
): { km: number; minutes: number } | null {
  const origin = planOrigin(plan);
  if (!origin || school.lat == null || school.lng == null) return null;
  const km = haversineKm(origin.lat, origin.lng, school.lat, school.lng);
  return { km, minutes: estimateDriveMinutes(km) };
}

// ── True cost (tuition + estimated add-ons) ────────────────────────────────
export interface CostBreakdown {
  tuition: number | null;
  bus: number;
  uniform: number;
  books: number;
  activities: number;
  registration: number; // one-time
  trueAnnual: number | null; // tuition + recurring add-ons
  estimated: boolean; // add-ons are estimates
}

// Dubai market averages for add-ons (estimates — not from KHDA data).
const ADDONS = { bus: 8000, uniform: 2000, books: 1500, activities: 3000, registration: 500 };

export function trueCost(school: School): CostBreakdown {
  // Use entry-level (feeMin) tuition as the representative annual figure.
  const tuition = school.feeMinAed ?? null;
  const trueAnnual =
    tuition != null
      ? tuition + ADDONS.bus + ADDONS.uniform + ADDONS.books + ADDONS.activities
      : null;
  return { tuition, ...ADDONS, trueAnnual, estimated: true };
}

// ── Match scoring ──────────────────────────────────────────────────────────
export interface SubScore {
  key: string;
  label: string;
  score: number; // 0–100
  estimated: boolean;
}

export interface SchoolMatch {
  school: School;
  score: number; // 0–100 overall
  commute: { km: number; minutes: number } | null;
  cost: CostBreakdown;
  subs: SubScore[];
  reasons: string[]; // short "why" bullets
}

function ratingScore(r: School['khdaRating']): number {
  switch (r) {
    case 'Outstanding': return 100;
    case 'Very Good': return 85;
    case 'Good': return 70;
    case 'Acceptable': return 52;
    case 'Weak': return 28;
    default: return 55; // Not Rated → neutral
  }
}

function affordabilityScore(feeMin: number | null, budgetMax: number): number {
  if (feeMin == null) return 55; // unknown → neutral
  if (feeMin <= budgetMax) {
    // Well under budget scores highest; near the ceiling still good.
    return Math.round(70 + 30 * (1 - feeMin / budgetMax));
  }
  // Over budget — falls off quickly.
  const over = feeMin / budgetMax; // >1
  return Math.max(0, Math.round(70 - (over - 1) * 120));
}

function commuteScore(minutes: number | null): number {
  if (minutes == null) return 55;
  if (minutes <= 15) return 100;
  if (minutes >= 50) return 20;
  return Math.round(100 - ((minutes - 15) / 35) * 80);
}

// Priority → which subscore it maps to, and whether we have real data.
const PRIORITY_WEIGHTS: Record<Priority, { sub: string; estimatedOnly?: boolean }> = {
  academics: { sub: 'academics' },
  affordability: { sub: 'affordability' },
  commute: { sub: 'commute' },
  availability: { sub: 'availability', estimatedOnly: true },
  university: { sub: 'academics' }, // proxy via KHDA until outcomes data exists
  sports: { sub: 'lifestyle', estimatedOnly: true },
  arts: { sub: 'lifestyle', estimatedOnly: true },
  lifestyle: { sub: 'lifestyle', estimatedOnly: true },
};

export function matchSchool(school: School, plan: FamilyPlan): SchoolMatch {
  const budgetMax = BUDGET_BANDS.find((b) => b.id === plan.budget)?.max ?? 80000;
  const commute = commuteFor(school, plan);
  const cost = trueCost(school);

  const subs: SubScore[] = [
    { key: 'academics', label: 'Academics (KHDA)', score: ratingScore(school.khdaRating), estimated: false },
    { key: 'affordability', label: 'Affordability', score: affordabilityScore(school.feeMinAed, budgetMax), estimated: school.feeMinAed == null },
    { key: 'commute', label: 'Commute', score: commuteScore(commute?.minutes ?? null), estimated: true },
    { key: 'availability', label: 'Seat availability', score: 60, estimated: true },
    { key: 'lifestyle', label: 'Lifestyle fit', score: 62, estimated: true },
  ];
  const subByKey = Object.fromEntries(subs.map((s) => [s.key, s]));

  // Curriculum is a hard-ish preference: mismatch caps the match.
  const curriculumMatch =
    plan.curriculum === 'Any' || plan.curriculum === school.curriculum;

  // Weight priorities: ranks 1..N → weights, top 3 dominate. Always include
  // academics + affordability + commute with a base weight so scores are stable.
  const weights: Record<string, number> = { academics: 1, affordability: 1, commute: 1 };
  plan.priorities.forEach((p, i) => {
    const sub = PRIORITY_WEIGHTS[p].sub;
    weights[sub] = (weights[sub] ?? 0) + Math.max(1, 4 - i); // rank1:+4 ... rank4+:+1
  });

  let total = 0;
  let wsum = 0;
  for (const [key, w] of Object.entries(weights)) {
    const s = subByKey[key];
    if (!s) continue;
    total += s.score * w;
    wsum += w;
  }
  let score = wsum > 0 ? total / wsum : 60;
  if (!curriculumMatch) score *= 0.7; // de-prioritise non-matching curriculum
  score = Math.round(Math.max(0, Math.min(100, score)));

  // "Why" bullets — surface the strongest real signals.
  const reasons: string[] = [];
  if (school.khdaRating === 'Outstanding' || school.khdaRating === 'Very Good')
    reasons.push(`${school.khdaRating} KHDA rating`);
  if (commute && commute.minutes <= 25)
    reasons.push(`~${commute.minutes} min from work (est.)`);
  if (school.feeMinAed != null && school.feeMinAed <= budgetMax)
    reasons.push('Within your budget');
  if (curriculumMatch && plan.curriculum !== 'Any')
    reasons.push(`${school.curriculum} curriculum`);

  return { school, score, commute, cost, subs, reasons };
}

export function recommendSchools(
  schools: School[],
  plan: FamilyPlan,
  limit = 12
): SchoolMatch[] {
  return schools
    .map((s) => matchSchool(s, plan))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
