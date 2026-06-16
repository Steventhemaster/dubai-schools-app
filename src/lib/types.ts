// ── Domain types (shared by UI + Supabase layer) ──────────────────────────
// Authored by the Backend Architect role; consumed by Frontend role.

export type Curriculum =
  | 'British'
  | 'American'
  | 'IB'
  | 'Indian (CBSE)'
  | 'Indian (ICSE)'
  | 'French'
  | 'UAE/MoE'
  | 'Other';

export type SchoolGender = 'Boys' | 'Girls' | 'Mixed';

/** KHDA-style inspection rating used across Dubai schools. */
export type KhdaRating =
  | 'Outstanding'
  | 'Very Good'
  | 'Good'
  | 'Acceptable'
  | 'Weak'
  | 'Not Rated';

export interface NationalityShare {
  /** e.g. "Emirati", "Indian", "British" */
  nationality: string;
  /** 0–100 */
  percent: number;
}

export interface FeeBand {
  /** Grade band label, e.g. "FS1", "Year 1", "Grade 12" */
  grade: string;
  /** Annual tuition in AED */
  annualAed: number;
}

export interface School {
  id: string;
  name: string;
  /** Dubai community/area, e.g. "Dubai Hills", "Mirdif", "JVC" */
  area: string;
  curriculum: Curriculum;
  gender: SchoolGender;
  /** Age range served, e.g. "3–18". Null when the source doesn't provide it. */
  ageRange: string | null;
  khdaRating: KhdaRating;
  /**
   * Cheapest → most expensive annual tuition (AED). Null when fees aren't yet
   * known — KHDA open data has no fees, so these are filled by a separate
   * source (prospectus / community) and may lag behind the KHDA fields.
   */
  feeMinAed: number | null;
  feeMaxAed: number | null;
  /**
   * Whether the school currently has open seats.
   * null = unknown (KHDA open data has no vacancy info) — render nothing,
   * never a false "No vacancy".
   */
  hasVacancy: boolean | null;
  /** Free-text vacancy note, e.g. "Waitlist for Year 7" */
  vacancyNote?: string;
  founded?: number;
  website?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  logoUrl?: string;
  description?: string;
  feeBands: FeeBand[];
  nationalityMix: NationalityShare[];
  admissionsNote?: string;
  // ── Provenance / open-data fields ──
  enrollment?: number | null;
  capacity?: number | null;
  dataYear?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  lastSyncedAt?: string | null;
  feesSource?: string | null;
  feesUpdatedAt?: string | null;
  /** Aggregated, computed in DB view */
  avgRating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  schoolId: string;
  authorName: string;
  /** 1–5 */
  rating: number;
  title?: string;
  body: string;
  createdAt: string; // ISO
  /** Optional sub-scores 1–5 */
  scores?: {
    academics?: number;
    facilities?: number;
    teaching?: number;
    valueForMoney?: number;
  };
}

export interface SchoolFilter {
  query?: string;
  area?: string;
  curriculum?: Curriculum;
  gender?: SchoolGender;
  vacancyOnly?: boolean;
  maxFeeAed?: number;
}
