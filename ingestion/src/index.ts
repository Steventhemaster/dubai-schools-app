import { config, hasSupabase } from './config.js';
import type { CanonicalSchool, SourceAdapter } from './types.js';
import { csvAdapter } from './sources/csv.js';
import { dubaiPulseAdapter } from './sources/dubaiPulse.js';
import { importKhdaWorkbook } from './sources/khdaWorkbook.js';
import { normalize } from './normalize.js';
import { validate } from './validate.js';
import { finishRun, startRun, upsertSchools } from './upsert.js';

// ── CLI ────────────────────────────────────────────────────────────────────
// Usage:
//   npm run ingest -- --source=khda          (official KHDA xlsx — recommended)
//   npm run ingest -- --source=csv           (any CSV / spreadsheet export)
//   npm run ingest -- --source=dubaipulse    (Dubai Pulse API, needs keys)
//   npm run ingest -- --describe             (print source columns, no write)
//   npm run ingest -- --dry-run              (normalize+validate, no write)

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.split('=')[1];
  return process.argv.includes(`--${name}`) ? '' : undefined;
}

function rowSource(src: string): SourceAdapter {
  switch (src) {
    case 'dubaipulse':
      return dubaiPulseAdapter;
    case 'csv':
    case '':
      return csvAdapter();
    default:
      throw new Error(`Unknown --source=${src} (use khda | csv | dubaipulse)`);
  }
}

function log(emoji: string, msg: string) {
  console.log(`${emoji}  ${msg}`);
}

function preview(valid: CanonicalSchool[]) {
  log('👀', 'Preview (first 3):');
  console.log(
    JSON.stringify(
      valid.slice(0, 3).map((s) => ({
        id: s.id,
        name: s.name,
        area: s.area,
        curriculum: s.curriculum,
        gender: s.gender,
        khda_rating: s.khda_rating,
        enrollment: s.enrollment,
        fees: s.fee_min_aed != null ? `${s.fee_min_aed}-${s.fee_max_aed}` : null,
      })),
      null,
      2
    )
  );
}

async function main() {
  const describe = arg('describe') !== undefined;
  const dryRun = arg('dry-run') !== undefined || describe;
  const sourceArg = arg('source') ?? 'csv';

  let canonical: CanonicalSchool[];
  let rawCount: number;
  let skippedCount: number;
  let sourceLabel: string;
  let notes: Record<string, unknown> = {};

  if (sourceArg === 'khda') {
    sourceLabel = 'khda_official_xlsx';
    log('📥', `Source: KHDA official workbook (${config.khda.xlsxPath})`);
    const res = await importKhdaWorkbook(config.khda.xlsxPath);
    log('📊', `Parsed ${res.schools.length} schools  (academic year ${res.dataYear})`);
    log('💰', `Fees matched: ${res.feesMatched}   unmatched: ${res.feesUnmatched}`);
    if (res.skipped.length) log('🧹', `Skipped ${res.skipped.length} rows`);

    canonical = res.schools;
    rawCount = res.schools.length + res.skipped.length;
    skippedCount = res.skipped.length;
    notes = {
      dataYear: res.dataYear,
      feesMatched: res.feesMatched,
      feesUnmatched: res.feesUnmatched,
    };

    if (describe) {
      const sample = res.schools[0];
      log('🔎', 'Canonical fields produced:');
      console.log(JSON.stringify(sample, null, 2));
      return;
    }
  } else {
    const source = rowSource(sourceArg);
    log('📥', `Source: ${source.name}`);
    const rows = await source.fetchRows();
    log('📊', `Fetched ${rows.length} raw rows`);
    if (rows.length === 0) {
      log('⚠️', 'No rows returned — check source config.');
      return;
    }
    if (describe) {
      const keys = Object.keys(rows[0] ?? {});
      log('🔎', `Columns (${keys.length}):`);
      console.log(keys.map((k) => `   • ${k}`).join('\n'));
      console.log('\nSample row:');
      console.log(JSON.stringify(rows[0], null, 2));
      return;
    }
    const { ok, skipped } = normalize(rows, {
      source: source.name,
      dataYear: process.env.DUBAI_PULSE_DATA_YEAR,
    });
    log('🧹', `Normalized ${ok.length} schools (${skipped.length} skipped)`);
    for (const s of skipped.slice(0, 5)) log('   ↳', `skipped: ${s.reason}`);
    canonical = ok;
    rawCount = rows.length;
    skippedCount = skipped.length;
    sourceLabel = source.name;
  }

  const { valid, invalid } = validate(canonical);
  log('✅', `Valid: ${valid.length}   ❌ Invalid: ${invalid.length}`);
  for (const v of invalid.slice(0, 8)) {
    log('   ↳', `invalid "${v.school.name}": ${v.issues.join('; ')}`);
  }
  if (invalid.length > 8) log('   ↳', `…and ${invalid.length - 8} more`);

  preview(valid);

  if (dryRun) {
    log('🟡', 'Dry run — nothing written to Supabase.');
    return;
  }
  if (!hasSupabase()) {
    log('🟡', 'Supabase not configured — set SUPABASE_URL + SERVICE_ROLE key to write. Skipping.');
    return;
  }

  const runId = await startRun(sourceLabel, sourceArg);
  try {
    const upserted = await upsertSchools(valid, { includeFees: sourceArg === 'khda' });
    log('💾', `Upserted ${upserted} schools into Supabase`);
    await finishRun(runId, {
      status: 'success',
      rows_seen: rawCount,
      rows_upserted: upserted,
      rows_skipped: skippedCount + invalid.length,
      notes,
    });
    log('🎉', 'Done.');
  } catch (e) {
    await finishRun(runId, {
      status: 'failed',
      rows_seen: rawCount,
      rows_skipped: skippedCount + invalid.length,
      error: String(e),
      notes,
    });
    throw e;
  }
}

main().catch((e) => {
  console.error('💥', e instanceof Error ? e.message : e);
  process.exit(1);
});
