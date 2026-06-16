import { z } from 'zod';
import type { CanonicalSchool } from './types.js';

const Curriculum = z.enum([
  'British',
  'American',
  'IB',
  'Indian (CBSE)',
  'Indian (ICSE)',
  'French',
  'UAE/MoE',
  'Other',
]);

const Rating = z.enum([
  'Outstanding',
  'Very Good',
  'Good',
  'Acceptable',
  'Weak',
  'Not Rated',
]);

export const CanonicalSchoolSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(2),
  name_ar: z.string().nullable(),
  area: z.string().min(1),
  curriculum: Curriculum,
  gender: z.enum(['Boys', 'Girls', 'Mixed']),
  age_range: z.string().nullable(),
  khda_rating: Rating,
  fee_min_aed: z.number().int().nonnegative().nullable(),
  fee_max_aed: z.number().int().nonnegative().nullable(),
  fee_bands: z
    .array(z.object({ grade: z.string(), annualAed: z.number() }))
    .nullable()
    .optional(),
  fees_source: z.string().nullable().optional(),
  fees_updated_at: z.string().nullable().optional(),
  has_vacancy: z.boolean().nullable(),
  vacancy_note: z.string().nullable(),
  founded: z.number().int().gte(1900).lte(2100).nullable(),
  website: z.string().url().nullable(),
  phone: z.string().nullable(),
  lat: z.number().gte(22).lte(27).nullable(), // UAE latitude band
  lng: z.number().gte(50).lte(57).nullable(), // UAE longitude band
  enrollment: z.number().int().nonnegative().nullable(),
  capacity: z.number().int().nonnegative().nullable(),
  data_year: z.string().nullable(),
  description: z.string().nullable(),
  admissions_note: z.string().nullable(),
  source: z.string().min(1),
  source_ref: z.string().nullable(),
  source_url: z.string().nullable(),
  last_synced_at: z.string(),
});

export interface ValidateResult {
  valid: CanonicalSchool[];
  invalid: { school: CanonicalSchool; issues: string[] }[];
}

export function validate(schools: CanonicalSchool[]): ValidateResult {
  const valid: CanonicalSchool[] = [];
  const invalid: { school: CanonicalSchool; issues: string[] }[] = [];

  for (const s of schools) {
    const result = CanonicalSchoolSchema.safeParse(s);
    if (result.success) {
      valid.push(result.data);
    } else {
      // Coordinates out of the UAE band are likely junk — null them and retry
      // rather than dropping the whole school.
      const coerced = { ...s, lat: null, lng: null };
      const retry = CanonicalSchoolSchema.safeParse(coerced);
      if (retry.success) {
        valid.push(retry.data);
      } else {
        invalid.push({
          school: s,
          issues: retry.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        });
      }
    }
  }

  return { valid, invalid };
}
