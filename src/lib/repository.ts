// ── Data access layer ──────────────────────────────────────────────────────
// Single source of truth for the UI. Talks to Supabase when configured,
// otherwise serves bundled seed data so the app is fully functional offline.

import { isSupabaseConfigured, supabase } from './supabase';
import type { Review, School, SchoolFilter } from './types';
import { SEED_SCHOOLS } from '@/data/seedSchools';
import { SEED_REVIEWS } from '@/data/seedReviews';

// In-memory store for reviews added during a demo session (no backend).
let localReviews: Review[] = [...SEED_REVIEWS];

function applyFilter(schools: School[], filter?: SchoolFilter): School[] {
  if (!filter) return schools;
  return schools.filter((s) => {
    if (filter.query) {
      const q = filter.query.toLowerCase();
      const hit =
        s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (filter.area && s.area !== filter.area) return false;
    if (filter.curriculum && s.curriculum !== filter.curriculum) return false;
    if (filter.gender && s.gender !== filter.gender) return false;
    // Unknown vacancy (null) is excluded from "has vacancy" results.
    if (filter.vacancyOnly && s.hasVacancy !== true) return false;
    if (
      filter.maxFeeAed &&
      s.feeMinAed != null &&
      s.feeMinAed > filter.maxFeeAed
    )
      return false;
    return true;
  });
}

function recomputeAggregate(school: School): School {
  const reviews = localReviews.filter((r) => r.schoolId === school.id);
  if (reviews.length === 0) return { ...school };
  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return {
    ...school,
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  };
}

export async function listSchools(filter?: SchoolFilter): Promise<School[]> {
  if (isSupabaseConfigured && supabase) {
    let q = supabase.from('schools_with_stats').select('*');
    if (filter?.curriculum) q = q.eq('curriculum', filter.curriculum);
    if (filter?.gender) q = q.eq('gender', filter.gender);
    if (filter?.area) q = q.eq('area', filter.area);
    if (filter?.vacancyOnly) q = q.eq('has_vacancy', true);
    const { data, error } = await q;
    if (error) throw error;
    const mapped = (data ?? []).map(mapSchoolRow);
    // Text + fee filters applied client-side for simplicity.
    return applyFilter(mapped, {
      query: filter?.query,
      maxFeeAed: filter?.maxFeeAed,
    });
  }
  return applyFilter(SEED_SCHOOLS.map(recomputeAggregate), filter);
}

export async function getSchool(id: string): Promise<School | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('schools_with_stats')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data ? mapSchoolRow(data) : null;
  }
  const found = SEED_SCHOOLS.find((s) => s.id === id);
  return found ? recomputeAggregate(found) : null;
}

export async function listReviews(schoolId: string): Promise<Review[]> {
  if (isSupabaseConfigured && supabase) {
    // Explicit columns: never ship other users' auth UUIDs to clients.
    const { data, error } = await supabase
      .from('reviews')
      .select('id, school_id, author_name, rating, title, body, scores, created_at')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapReviewRow);
  }
  return localReviews
    .filter((r) => r.schoolId === schoolId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addReview(
  input: Omit<Review, 'id' | 'createdAt'>
): Promise<Review> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        school_id: input.schoolId,
        author_name: input.authorName,
        rating: input.rating,
        title: input.title,
        body: input.body,
        scores: input.scores,
      })
      .select()
      .single();
    if (error) throw error;
    return mapReviewRow(data);
  }
  const review: Review = {
    ...input,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  localReviews = [review, ...localReviews];
  return review;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'false_information'
  | 'inappropriate'
  | 'other';

/**
 * Flag a review for moderation (App Store UGC requirement).
 * In demo mode this is a no-op that resolves successfully.
 */
export async function reportReview(
  reviewId: string,
  reason: ReportReason = 'inappropriate'
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { data: userData } = await supabase.auth.getUser();
    const reporterId = userData?.user?.id;
    if (!reporterId) throw new Error('auth-required');
    const { error } = await supabase.from('review_reports').insert({
      review_id: reviewId,
      reporter_id: reporterId,
      reason,
    });
    // Duplicate report (unique constraint) counts as success for the UI.
    if (error && error.code !== '23505') throw error;
  }
}

export function uniqueAreas(): string[] {
  return Array.from(new Set(SEED_SCHOOLS.map((s) => s.area))).sort();
}

// ── Row mappers (snake_case DB → camelCase domain) ─────────────────────────

function mapSchoolRow(row: any): School {
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    curriculum: row.curriculum,
    gender: row.gender,
    ageRange: row.age_range,
    khdaRating: row.khda_rating,
    feeMinAed: row.fee_min_aed,
    feeMaxAed: row.fee_max_aed,
    hasVacancy: row.has_vacancy ?? null,
    vacancyNote: row.vacancy_note ?? undefined,
    founded: row.founded ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    description: row.description ?? undefined,
    feeBands: row.fee_bands ?? [],
    nationalityMix: row.nationality_mix ?? [],
    admissionsNote: row.admissions_note ?? undefined,
    enrollment: row.enrollment ?? null,
    capacity: row.capacity ?? null,
    dataYear: row.data_year ?? null,
    source: row.source ?? null,
    sourceUrl: row.source_url ?? null,
    lastSyncedAt: row.last_synced_at ?? null,
    feesSource: row.fees_source ?? null,
    feesUpdatedAt: row.fees_updated_at ?? null,
    avgRating: row.avg_rating ?? 0,
    reviewCount: row.review_count ?? 0,
  };
}

function mapReviewRow(row: any): Review {
  return {
    id: row.id,
    schoolId: row.school_id,
    authorName: row.author_name,
    rating: row.rating,
    title: row.title ?? undefined,
    body: row.body,
    createdAt: row.created_at,
    scores: row.scores ?? undefined,
  };
}
