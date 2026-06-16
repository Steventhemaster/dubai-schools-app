import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { config, hasSupabase } from './config.js';
import { slugify } from './slug.js';
import { parseIntish } from './mappings.js';

// ── Fees merge ─────────────────────────────────────────────────────────────
// Fees are NOT in KHDA open data. This step layers a separate fees source
// (prospectus extracts / community submissions) onto existing schools,
// updating ONLY fee columns so it never disturbs KHDA-managed fields.
//
// Fees CSV columns (headers flexible-ish):
//   school_id | school_name , fee_min_aed , fee_max_aed , fee_bands(JSON, optional) , fees_source
//
// Usage: npm run merge:fees -- --file=./sample/fees_sample.csv [--dry-run]

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.split('=')[1];
  return process.argv.includes(`--${name}`) ? '' : undefined;
}

interface FeeRow {
  id: string;
  fee_min_aed: number | null;
  fee_max_aed: number | null;
  fee_bands: unknown | null;
  fees_source: string;
}

function toFeeRow(raw: Record<string, string>): FeeRow | null {
  const id = (raw.school_id || raw.id || '').trim() || slugify(raw.school_name || raw.name || '');
  if (!id) return null;
  let bands: unknown | null = null;
  const bandsStr = (raw.fee_bands || '').trim();
  if (bandsStr) {
    try {
      bands = JSON.parse(bandsStr);
    } catch {
      bands = null; // ignore malformed JSON rather than fail the run
    }
  }
  return {
    id,
    fee_min_aed: parseIntish(raw.fee_min_aed),
    fee_max_aed: parseIntish(raw.fee_max_aed),
    fee_bands: bands,
    fees_source: (raw.fees_source || 'manual').trim(),
  };
}

async function main() {
  const file = arg('file') ?? './sample/fees_sample.csv';
  const dryRun = arg('dry-run') !== undefined;

  const text = await readFile(file, 'utf8');
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  const feeRows = (records as Record<string, string>[])
    .map(toFeeRow)
    .filter((r): r is FeeRow => r !== null);

  console.log(`💰  Parsed ${feeRows.length} fee rows from ${file}`);
  if (dryRun || !hasSupabase()) {
    console.log(dryRun ? '🟡  Dry run — no writes.' : '🟡  Supabase not configured — no writes.');
    console.log(JSON.stringify(feeRows.slice(0, 3), null, 2));
    return;
  }

  const db = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false },
  });

  let matched = 0;
  const unmatched: string[] = [];
  const now = new Date().toISOString();

  for (const r of feeRows) {
    // Only patch fields the CSV actually provides — an empty cell must never
    // null out a fee that's already stored.
    const patch: Record<string, unknown> = {
      fees_source: r.fees_source,
      fees_updated_at: now,
    };
    if (r.fee_min_aed !== null) patch.fee_min_aed = r.fee_min_aed;
    if (r.fee_max_aed !== null) patch.fee_max_aed = r.fee_max_aed;
    if (r.fee_bands !== null) patch.fee_bands = r.fee_bands;
    if (r.fee_min_aed === null && r.fee_max_aed === null && r.fee_bands === null) {
      unmatched.push(`${r.id} (no fee values in CSV — skipped)`);
      continue;
    }

    const { data, error } = await db
      .from('schools')
      .update(patch)
      .eq('id', r.id)
      .select('id');
    if (error) throw new Error(`Fee update failed for ${r.id}: ${error.message}`);
    if (data && data.length) matched++;
    else unmatched.push(r.id);
  }

  console.log(`✅  Updated fees for ${matched} schools`);
  if (unmatched.length) {
    console.log(`⚠️  ${unmatched.length} fee rows had no matching school id:`);
    console.log(unmatched.map((u) => `   • ${u}`).join('\n'));
  }
}

main().catch((e) => {
  console.error('💥', e instanceof Error ? e.message : e);
  process.exit(1);
});
