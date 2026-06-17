import type { School } from './types';
import { formatAed } from './format';

// Composes a short, factual one-liner from a school's structured fields.
// KHDA-imported schools have no free-text description, so we synthesise one
// from real data only — never inventing facts.
export function schoolSummary(school: School): string {
  if (school.description) return school.description;

  const parts: string[] = [];
  const curriculum =
    school.curriculum === 'Other' ? 'Private' : `${school.curriculum}-curriculum`;
  parts.push(`${curriculum} school in ${school.area}`);

  if (school.khdaRating && school.khdaRating !== 'Not Rated') {
    parts.push(`rated ${school.khdaRating} by KHDA`);
  }
  if (school.gender && school.gender !== 'Mixed') {
    parts.push(`${school.gender.toLowerCase()} only`);
  }
  if (school.enrollment && school.enrollment > 0) {
    parts.push(`~${formatAed(school.enrollment)} students`);
  }
  if (school.founded) {
    parts.push(`est. ${school.founded}`);
  }

  // "British-curriculum school in Al Barsha First, rated Very Good by KHDA, ~1,200 students."
  return parts.join(', ') + '.';
}

/** Shorter version for dense list cards (first clause only). */
export function schoolSummaryShort(school: School): string {
  if (school.description) return school.description;
  const curriculum =
    school.curriculum === 'Other' ? 'Private' : `${school.curriculum}-curriculum`;
  const tail =
    school.khdaRating && school.khdaRating !== 'Not Rated'
      ? `, ${school.khdaRating}`
      : '';
  return `${curriculum} school in ${school.area}${tail}`;
}
