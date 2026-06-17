import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/Badge';
import { RatingStars } from '@/components/RatingStars';
import { RatingSummary } from '@/components/RatingSummary';
import { useSavedSchools } from '@/components/useSavedSchools';
import { useAuth } from '@/lib/auth';
import { schoolSummary } from '@/lib/summary';
import { getSchool, listReviews, reportReview } from '@/lib/repository';
import type { Review, School } from '@/lib/types';
import { feeRangeLabel, formatAed, relativeDate } from '@/lib/format';
import { font, radius, spacing, useTheme, type ThemeColors } from '@/theme';

type Tab = 'overview' | 'admissions' | 'fees' | 'reviews';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors: c } = useTheme();
  const { isSaved, toggle } = useSavedSchools();

  const [school, setSchool] = useState<School | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!id) return;
    Promise.all([getSchool(id), listReviews(id)])
      .then(([s, r]) => {
        setSchool(s);
        setReviews(r);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Covers both initial load and refresh after the "write review" modal —
  // a separate useEffect would double-fetch on mount.
  useFocusEffect(useCallback(() => load(), [load]));

  if (loading || !school) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const saved = isSaved(school.id);

  const onShare = () => {
    // Desktop browsers reject (no navigator.share) — fail silently there.
    Share.share({
      message: `${school.name} — ${school.area}, Dubai. KHDA: ${school.khdaRating}. (Dubai Schools app)`,
    }).catch(() => {});
  };

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable hitSlop={10} onPress={onShare} accessibilityLabel={t('common.share')}>
              <Ionicons name="share-outline" size={22} color={c.text} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <Text style={[styles.name, { color: c.text }]}>{school.name}</Text>
        <View style={styles.areaRow}>
          <Ionicons name="location-outline" size={14} color={c.textMuted} />
          <Text style={[styles.area, { color: c.textMuted }]}>{school.area}</Text>
        </View>
        <View style={styles.ratingRow}>
          <RatingStars value={school.avgRating} size={18} showValue />
          <Text style={[styles.basedOn, { color: c.textMuted }]}>
            {t('school.basedOn', { count: school.reviewCount })}
          </Text>
        </View>
        <View style={styles.badges}>
          <Badge label={school.curriculum} tone="primary" />
          <Badge label={school.gender} />
          {school.khdaRating !== 'Not Rated' && (
            <Badge label={school.khdaRating} tone="accent" />
          )}
          {school.hasVacancy !== null && (
            <Badge
              label={school.hasVacancy ? t('school.hasVacancy') : t('school.noVacancy')}
              tone={school.hasVacancy ? 'success' : 'danger'}
            />
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { borderBottomColor: c.border }]}>
          {(['overview', 'admissions', 'fees', 'reviews'] as Tab[]).map((tb) => (
            <Pressable key={tb} style={styles.tabBtn} onPress={() => setTab(tb)}>
              <Text
                style={[
                  styles.tabText,
                  { color: tab === tb ? c.primary : c.textMuted },
                  tab === tb && styles.tabTextActive,
                ]}
              >
                {t(`school.${tb}`)}
              </Text>
              {tab === tb && (
                <View style={[styles.tabUnderline, { backgroundColor: c.primary }]} />
              )}
            </Pressable>
          ))}
        </View>

        {tab === 'overview' && <Overview school={school} c={c} />}
        {tab === 'admissions' && <Admissions school={school} c={c} />}
        {tab === 'fees' && <Fees school={school} c={c} />}
        {tab === 'reviews' && (
          <Reviews school={school} reviews={reviews} c={c} />
        )}
      </ScrollView>

      {/* Bottom action bar — primary CTA always reachable */}
      <SafeAreaView
        edges={['bottom']}
        style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border }]}
      >
        <Pressable
          style={[styles.saveBtn, { borderColor: saved ? c.accent : c.border }]}
          onPress={() => toggle(school.id)}
          accessibilityLabel={saved ? t('common.saved') : t('common.save')}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? c.accent : c.textMuted}
          />
        </Pressable>
        <Pressable
          style={[styles.ctaBtn, { backgroundColor: c.primary }]}
          onPress={() => router.push(`/school/review/${school.id}`)}
        >
          <Ionicons name="create-outline" size={18} color={c.textInverse} />
          <Text style={[styles.ctaText, { color: c.textInverse }]}>
            {t('school.writeReview')}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

// ── Tab panels ─────────────────────────────────────────────────────────────

function Overview({ school, c }: { school: School; c: ThemeColors }) {
  const { t } = useTranslation();
  const { enabled, session } = useAuth();
  const gated = enabled && !session;
  return (
    <View style={styles.panel}>
      <Text style={[styles.body, { color: c.text }]}>{schoolSummary(school)}</Text>

      <View style={styles.kvGrid}>
        <KV label={t('school.curriculum')} value={school.curriculum} c={c} />
        <KV label={t('school.gender')} value={school.gender} c={c} />
        {!!school.ageRange && (
          <KV label={t('school.ageRange')} value={school.ageRange} c={c} />
        )}
        <KV label={t('school.khdaRating')} value={school.khdaRating} c={c} />
        {!!school.founded && (
          <KV label={t('school.founded')} value={String(school.founded)} c={c} />
        )}
        <KV
          label={t('school.feeRange')}
          value={gated ? `🔒 ${t('gate.feesLocked')}` : feeValue(school, t)}
          c={c}
        />
        {school.enrollment != null && (
          <KV label={t('school.enrollment')} value={String(school.enrollment)} c={c} />
        )}
        {school.capacity != null && (
          <KV label={t('school.capacity')} value={String(school.capacity)} c={c} />
        )}
      </View>

      {school.nationalityMix.length > 0 && (
        <>
          <Text style={[styles.subHeading, { color: c.text }]}>
            {t('school.nationalityMix')}
          </Text>
          {school.nationalityMix.map((n) => (
            <View key={n.nationality} style={styles.mixRow}>
              <Text style={[styles.mixLabel, { color: c.text }]}>{n.nationality}</Text>
              <View style={[styles.mixBarTrack, { backgroundColor: c.surfaceAlt }]}>
                <View
                  style={[
                    styles.mixBarFill,
                    { backgroundColor: c.accent, width: `${n.percent}%` },
                  ]}
                />
              </View>
              <Text style={[styles.mixPct, { color: c.textMuted }]}>{n.percent}%</Text>
            </View>
          ))}
        </>
      )}

      {(school.website || school.phone) && (
        <View style={styles.linkRow}>
          {!!school.website && (
            <LinkButton
              icon="globe-outline"
              label={t('school.website')}
              onPress={() => Linking.openURL(school.website!)}
              c={c}
            />
          )}
          {!!school.phone && (
            <LinkButton
              icon="call-outline"
              label={t('school.call')}
              onPress={() => Linking.openURL(`tel:${school.phone}`)}
              c={c}
            />
          )}
        </View>
      )}

      <Provenance school={school} c={c} />
    </View>
  );
}

function Admissions({ school, c }: { school: School; c: ThemeColors }) {
  const { t } = useTranslation();
  const open = school.hasVacancy;
  const unknown = open === null;
  return (
    <View style={styles.panel}>
      <View
        style={[
          styles.vacancyCard,
          unknown
            ? { backgroundColor: c.surfaceAlt, borderColor: c.border }
            : {
                backgroundColor: open ? c.successSoft : c.dangerSoft,
                borderColor: open ? c.success : c.danger,
              },
        ]}
      >
        <View style={styles.vacHead}>
          <Ionicons
            name={unknown ? 'help-circle' : open ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={unknown ? c.textMuted : open ? c.success : c.danger}
          />
          <Text style={[styles.vacTitle, { color: c.text }]}>
            {unknown
              ? t('school.vacancyUnknown')
              : open
                ? t('school.hasVacancy')
                : t('school.noVacancy')}
          </Text>
        </View>
        {!!school.vacancyNote && (
          <Text style={[styles.vacNote, { color: c.textMuted }]}>
            {school.vacancyNote}
          </Text>
        )}
      </View>
      {!!school.admissionsNote && (
        <Text style={[styles.body, { color: c.text, marginTop: spacing.lg }]}>
          {school.admissionsNote}
        </Text>
      )}
    </View>
  );
}

function Fees({ school, c }: { school: School; c: ThemeColors }) {
  const { t } = useTranslation();
  const { enabled, session } = useAuth();
  const router = useRouter();
  const range = feeRangeLabel(school.feeMinAed, school.feeMaxAed);
  const hasAny = school.feeBands.length > 0 || range;

  // Fee details are sign-in gated.
  if (enabled && !session) {
    return (
      <View style={[styles.panel, styles.emptyPanel]}>
        <View style={[styles.feeLockIcon, { backgroundColor: c.primarySoft }]}>
          <Ionicons name="lock-closed" size={24} color={c.primary} />
        </View>
        <Text style={[styles.noContent, { color: c.text, fontWeight: '700' }]}>
          {t('gate.feesLocked')}
        </Text>
        <Pressable
          style={[styles.feeLockBtn, { backgroundColor: c.primary }]}
          onPress={() => router.push('/auth')}
        >
          <Text style={{ color: c.textInverse, fontWeight: '800' }}>
            {t('gate.createAccount')}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!hasAny) {
    return (
      <View style={[styles.panel, styles.emptyPanel]}>
        <Ionicons name="cash-outline" size={32} color={c.textMuted} />
        <Text style={[styles.noContent, { color: c.textMuted }]}>
          {t('school.feesTba')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={[styles.subHeading, { color: c.text, marginTop: 0 }]}>
        {t('school.feeByGrade')}
      </Text>
      {school.feeBands.length > 0 ? (
        school.feeBands.map((b) => (
          <View key={b.grade} style={[styles.feeRow, { borderBottomColor: c.border }]}>
            <Text style={[styles.feeGrade, { color: c.text }]}>{b.grade}</Text>
            <Text style={[styles.feeAmount, { color: c.primary }]}>
              AED {formatAed(b.annualAed)}{' '}
              <Text style={[styles.feePer, { color: c.textMuted }]}>
                {t('school.perYear')}
              </Text>
            </Text>
          </View>
        ))
      ) : (
        <View style={[styles.feeRow, { borderBottomColor: c.border }]}>
          <Text style={[styles.feeGrade, { color: c.text }]}>{t('school.feeRange')}</Text>
          <Text style={[styles.feeAmount, { color: c.primary }]}>AED {range}</Text>
        </View>
      )}
      {!!school.feesSource && (
        <Text style={[styles.feesNote, { color: c.textMuted }]}>
          {t('school.feesNote', { source: school.feesSource })}
        </Text>
      )}
    </View>
  );
}

function Reviews({
  school,
  reviews,
  c,
}: {
  school: School;
  reviews: Review[];
  c: ThemeColors;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { enabled, session } = useAuth();
  const [reported, setReported] = useState<Set<string>>(new Set());

  const onReport = async (reviewId: string) => {
    // App Store 1.2: users must be able to flag objectionable content.
    if (enabled && !session) {
      router.push('/auth');
      return;
    }
    try {
      await reportReview(reviewId);
      setReported((prev) => new Set(prev).add(reviewId));
    } catch {
      /* keep UI quiet; report can be retried */
    }
  };

  return (
    <View style={styles.panel}>
      <RatingSummary average={school.avgRating} reviews={reviews} />

      {reviews.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={c.textMuted} />
          <Text style={[styles.noContent, { color: c.textMuted }]}>
            {t('school.noReviews')}
          </Text>
        </View>
      ) : (
        reviews.map((r) => (
          <View
            key={r.id}
            style={[styles.reviewCard, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <View style={styles.reviewHead}>
              <View style={[styles.avatar, { backgroundColor: c.primarySoft }]}>
                <Text style={[styles.avatarText, { color: c.primary }]}>
                  {r.authorName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewAuthor, { color: c.text }]}>
                  {r.authorName}
                </Text>
                <RatingStars value={r.rating} size={12} />
              </View>
              <Text style={[styles.reviewDate, { color: c.textMuted }]}>
                {relativeDate(r.createdAt)}
              </Text>
            </View>
            {!!r.title && (
              <Text style={[styles.reviewTitle, { color: c.text }]}>{r.title}</Text>
            )}
            <Text style={[styles.reviewBody, { color: c.text }]}>{r.body}</Text>
            <Pressable
              style={styles.reportBtn}
              onPress={() => onReport(r.id)}
              disabled={reported.has(r.id)}
              accessibilityRole="button"
              accessibilityLabel={t('review.report')}
            >
              <Ionicons
                name={reported.has(r.id) ? 'flag' : 'flag-outline'}
                size={12}
                color={c.textMuted}
              />
              <Text style={[styles.reportText, { color: c.textMuted }]}>
                {reported.has(r.id) ? t('review.reported') : t('review.report')}
              </Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

// ── Small pieces ───────────────────────────────────────────────────────────

function feeValue(school: School, t: TFunction): string {
  const fee = feeRangeLabel(school.feeMinAed, school.feeMaxAed);
  return fee ? `AED ${fee}` : t('school.feesTba');
}

function LinkButton({
  icon,
  label,
  onPress,
  c,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  c: ThemeColors;
}) {
  return (
    <Pressable style={[styles.linkBtn, { borderColor: c.primary }]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={c.primary} />
      <Text style={[styles.linkBtnText, { color: c.primary }]}>{label}</Text>
    </Pressable>
  );
}

function Provenance({ school, c }: { school: School; c: ThemeColors }) {
  const { t } = useTranslation();
  if (!school.source && !school.lastSyncedAt) return null;
  const label = school.source?.startsWith('dubai_pulse') || school.source?.startsWith('khda')
    ? t('school.officialData')
    : school.source;
  const updated = school.lastSyncedAt
    ? new Date(school.lastSyncedAt).toLocaleDateString()
    : null;
  return (
    <View style={[styles.provenance, { borderTopColor: c.border }]}>
      <Ionicons name="shield-checkmark-outline" size={13} color={c.textMuted} />
      <View style={{ flex: 1 }}>
        {!!label && (
          <Text style={[styles.provText, { color: c.textMuted }]}>
            {t('school.dataSource')}: {label}
            {school.dataYear ? ` (${school.dataYear})` : ''}
          </Text>
        )}
        {!!updated && (
          <Text style={[styles.provText, { color: c.textMuted }]}>
            {t('school.lastUpdated')}: {updated}
          </Text>
        )}
      </View>
    </View>
  );
}

function KV({ label, value, c }: { label: string; value: string; c: ThemeColors }) {
  return (
    <View style={styles.kv}>
      <Text style={[styles.kvLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.kvValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  name: { fontSize: font.h1, fontWeight: '800' },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  area: { fontSize: font.body },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  basedOn: { fontSize: font.small },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },

  tabBar: { flexDirection: 'row', marginTop: spacing.lg, borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabText: { fontSize: font.small, fontWeight: '600' },
  tabTextActive: { fontWeight: '800' },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    width: '60%',
    borderRadius: 2,
  },

  panel: { marginTop: spacing.lg },
  body: { fontSize: font.body, lineHeight: 22 },
  subHeading: {
    fontSize: font.h3,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  kvGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  kv: { width: '50%', paddingVertical: spacing.sm },
  kvLabel: { fontSize: font.tiny, textTransform: 'uppercase' },
  kvValue: { fontSize: font.body, fontWeight: '600', marginTop: 2 },

  mixRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  mixLabel: { width: 80, fontSize: font.small },
  mixBarTrack: { flex: 1, height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  mixBarFill: { height: '100%', borderRadius: radius.pill },
  mixPct: { width: 40, textAlign: 'right', fontSize: font.small },

  linkRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  linkBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  linkBtnText: { fontWeight: '700', fontSize: font.small },

  vacancyCard: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1 },
  vacHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  vacTitle: { fontSize: font.h3, fontWeight: '700', flex: 1 },
  vacNote: { fontSize: font.small, marginTop: spacing.sm },

  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  feeGrade: { fontSize: font.body, fontWeight: '600' },
  feeAmount: { fontSize: font.body, fontWeight: '700' },
  feePer: { fontSize: font.tiny, fontWeight: '400' },
  feesNote: { fontSize: font.tiny, marginTop: spacing.md, fontStyle: 'italic' },

  emptyPanel: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  noContent: { fontSize: font.body, textAlign: 'center' },
  feeLockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeLockBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },

  reviewCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '800', fontSize: font.body },
  reviewAuthor: { fontSize: font.body, fontWeight: '700', marginBottom: 2 },
  reviewDate: { fontSize: font.tiny },
  reviewTitle: { fontSize: font.body, fontWeight: '700', marginTop: spacing.md },
  reviewBody: { fontSize: font.small, lineHeight: 20, marginTop: spacing.xs },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  reportText: { fontSize: font.tiny, fontWeight: '600' },

  provenance: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  provText: { fontSize: font.tiny, marginBottom: 2 },

  bottomBar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  saveBtn: {
    width: 50,
    borderWidth: 1.5,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
  },
  ctaText: { fontWeight: '800', fontSize: font.body },
});
