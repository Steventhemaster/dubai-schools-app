import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { config } from '../config.js';
import type { RawRow, SourceAdapter } from '../types.js';

// ── CSV adapter ────────────────────────────────────────────────────────────
// For the common workflow of downloading a KHDA dataset as CSV from the Dubai
// Pulse dataset page (no API key needed), or any hand-curated spreadsheet.
// Columns are matched by the alias table in mappings.ts, so headers don't need
// to be exact.

export function csvAdapter(path = config.csv.path): SourceAdapter {
  return {
    name: `csv:${path}`,
    async fetchRows(): Promise<RawRow[]> {
      const text = await readFile(path, 'utf8');
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
      });
      return records as RawRow[];
    },
  };
}
