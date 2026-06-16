import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config.js';
import type { CanonicalSchool } from './types.js';

// Columns the KHDA sync OWNS. Fees, vacancy_note, description and admissions
// come from other sources (prospectus / community), so they're intentionally
// excluded here — an upsert must never null them out.
const MANAGED_COLUMNS: (keyof CanonicalSchool)[] = [
  'id',
  'name',
  'name_ar',
  'area',
  'curriculum',
  'gender',
  'age_range',
  'khda_rating',
  'has_vacancy',
  'founded',
  'website',
  'phone',
  'lat',
  'lng',
  'enrollment',
  'capacity',
  'data_year',
  'source',
  'source_ref',
  'source_url',
  'last_synced_at',
];

function client(): SupabaseClient {
  config.requireSupabase();
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// Fee columns are only written when the source is authoritative for fees
// (the KHDA official workbook). The Dubai Pulse API sync leaves them untouched.
const FEE_COLUMNS: (keyof CanonicalSchool)[] = [
  'fee_min_aed',
  'fee_max_aed',
  'fee_bands',
  'fees_source',
  'fees_updated_at',
];

function projectManaged(
  s: CanonicalSchool,
  includeFees: boolean
): Record<string, unknown> {
  const cols = includeFees ? [...MANAGED_COLUMNS, ...FEE_COLUMNS] : MANAGED_COLUMNS;
  const out: Record<string, unknown> = {};
  for (const col of cols) out[col] = s[col] ?? null;
  return out;
}

export async function upsertSchools(
  schools: CanonicalSchool[],
  opts: { includeFees?: boolean } = {}
): Promise<number> {
  if (schools.length === 0) return 0;
  const db = client();

  // Fee columns are written ONLY for rows where this source actually matched
  // fees (fees_source set). Rows without a match must not null out fees that
  // a previous run or merge:fees already stored — so the two groups are
  // upserted as separate batches with different column sets.
  const includeFees = opts.includeFees ?? false;
  const withFees = includeFees
    ? schools.filter((s) => s.fees_source != null)
    : [];
  const withoutFees = includeFees
    ? schools.filter((s) => s.fees_source == null)
    : schools;

  let upserted = 0;
  const BATCH = 500;
  const groups: { rows: Record<string, unknown>[]; }[] = [
    { rows: withFees.map((s) => projectManaged(s, true)) },
    { rows: withoutFees.map((s) => projectManaged(s, false)) },
  ];
  for (const { rows } of groups) {
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      if (batch.length === 0) continue;
      const { error, count } = await db
        .from('schools')
        .upsert(batch, { onConflict: 'id', count: 'exact' });
      if (error) throw new Error(`Upsert failed at batch ${i / BATCH}: ${error.message}`);
      upserted += count ?? batch.length;
    }
  }
  return upserted;
}

// ── Audit log ──────────────────────────────────────────────────────────────
export async function startRun(source: string, dataset: string | null): Promise<string | null> {
  try {
    const db = client();
    const { data, error } = await db
      .from('ingestion_runs')
      .insert({ source, dataset, status: 'running' })
      .select('id')
      .single();
    if (error) return null;
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function finishRun(
  id: string | null,
  patch: {
    status: 'success' | 'failed';
    rows_seen?: number;
    rows_upserted?: number;
    rows_skipped?: number;
    error?: string;
    notes?: unknown;
  }
): Promise<void> {
  if (!id) return;
  try {
    const db = client();
    await db
      .from('ingestion_runs')
      .update({ ...patch, finished_at: new Date().toISOString(), notes: patch.notes ?? null })
      .eq('id', id);
  } catch {
    /* best-effort audit logging */
  }
}
