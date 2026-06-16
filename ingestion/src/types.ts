// A raw row from any source, before normalization. Keys are source-specific.
export type RawRow = Record<string, unknown>;

// Canonical school record the pipeline produces and upserts into Supabase.
// Mirrors the `schools` table (snake_case) after migration 0002.
export interface CanonicalSchool {
  id: string; // stable slug
  name: string;
  name_ar: string | null;
  area: string;
  curriculum: string;
  gender: 'Boys' | 'Girls' | 'Mixed';
  age_range: string | null;
  khda_rating: string;
  fee_min_aed: number | null;
  fee_max_aed: number | null;
  // Present only for sources that are authoritative for fees (KHDA xlsx).
  fee_bands?: { grade: string; annualAed: number }[] | null;
  fees_source?: string | null;
  fees_updated_at?: string | null;
  /** null = unknown (KHDA open data carries no vacancy info). */
  has_vacancy: boolean | null;
  vacancy_note: string | null;
  founded: number | null;
  website: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  enrollment: number | null;
  capacity: number | null;
  data_year: string | null;
  description: string | null;
  admissions_note: string | null;
  source: string;
  source_ref: string | null;
  source_url: string | null;
  last_synced_at: string; // ISO
}

export interface NormalizeResult {
  ok: CanonicalSchool[];
  skipped: { row: RawRow; reason: string }[];
}

export interface SourceAdapter {
  name: string;
  /** Pull all rows (handles pagination/auth internally). */
  fetchRows(): Promise<RawRow[]>;
}
