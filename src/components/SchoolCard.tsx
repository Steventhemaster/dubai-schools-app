import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { School } from '@/lib/types';
import { font, radius, shadow, spacing, useTheme } from '@/theme';
import { feeRangeLabel } from '@/lib/format';
import { schoolSummaryShort } from '@/lib/summary';
import { useAuth } from '@/lib/auth';
import { Badge } from './Badge';
import { useSavedSchools } from './useSavedSchools';

export function SchoolCard({ school }: { school: School }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors: c } = useTheme();
  const { isSaved, toggle } = useSavedSchools();
  const { enabled, session } = useAuth();
  const gated = enabled && !session; // fees hidden until signed in
  const saved = isSaved(school.id);
  const fee = feeRangeLabel(school.feeMinAed, school.feeMaxAed);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border },
        pressed && styles.pressed,
      ]}
      onPress={() => router.push(`/school/${school.id}`)}
      accessibilityRole="button"
    >
      <View style={styles.headerRow}>
        <View style={[styles.logo, { backgroundColor: c.primarySoft }]}>
          <Text style={[styles.logoText, { color: c.primary }]}>
            {initials(school.name)}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: c.text }]} numberOfLines={2}>
            {school.name}
          </Text>
          <View style={styles.areaRow}>
            <Ionicons name="location-outline" size={12} color={c.textMuted} />
            <Text style={[styles.area, { color: c.textMuted }]}>{school.area}</Text>
          </View>
        </View>
        <Pressable
          hitSlop={10}
          onPress={() => toggle(school.id)}
          accessibilityLabel={saved ? t('common.saved') : t('common.save')}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? c.accent : c.textMuted}
          />
        </Pressable>
      </View>

      <View style={styles.badges}>
        <Badge label={school.curriculum} tone="primary" />
        {school.khdaRating !== 'Not Rated' && (
          <Badge label={school.khdaRating} tone="accent" />
        )}
        {school.hasVacancy !== null && (
          <Badge
            label={
              school.hasVacancy ? t('school.hasVacancy') : t('school.noVacancy')
            }
            tone={school.hasVacancy ? 'success' : 'danger'}
          />
        )}
      </View>

      <Text style={[styles.summary, { color: c.textMuted }]} numberOfLines={2}>
        {schoolSummaryShort(school)}
      </Text>

      <View style={styles.footerRow}>
        <View style={[styles.ratingPill, { backgroundColor: c.surfaceAlt }]}>
          <Ionicons name="star" size={13} color={c.star} />
          <Text style={[styles.ratingText, { color: c.text }]}>
            {school.avgRating > 0 ? school.avgRating.toFixed(1) : '—'}
          </Text>
          <Text style={[styles.ratingCount, { color: c.textMuted }]}>
            ({school.reviewCount})
          </Text>
        </View>
        {gated ? (
          <View style={styles.feeLock}>
            <Ionicons name="lock-closed" size={12} color={c.textMuted} />
            <Text style={[styles.feeTba, { color: c.textMuted }]}>
              {t('gate.feesLocked')}
            </Text>
          </View>
        ) : fee ? (
          <Text style={[styles.fee, { color: c.primary }]}>
            {t('common.aed')} {fee}
          </Text>
        ) : (
          <Text style={[styles.feeTba, { color: c.textMuted }]}>
            {t('school.feesTba')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** Compact card for horizontal "top rated" rails. */
export function SchoolMiniCard({ school }: { school: School }) {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { t } = useTranslation();
  const fee = feeRangeLabel(school.feeMinAed, school.feeMaxAed);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.mini,
        { backgroundColor: c.surface, borderColor: c.border },
        pressed && styles.pressed,
      ]}
      onPress={() => router.push(`/school/${school.id}`)}
    >
      <View style={[styles.miniLogo, { backgroundColor: c.primarySoft }]}>
        <Text style={[styles.miniLogoText, { color: c.primary }]}>
          {initials(school.name)}
        </Text>
      </View>
      <Text style={[styles.miniName, { color: c.text }]} numberOfLines={2}>
        {school.name}
      </Text>
      <Text style={[styles.miniArea, { color: c.textMuted }]} numberOfLines={1}>
        {school.area}
      </Text>
      <View style={styles.miniFooter}>
        <Ionicons name="star" size={12} color={c.star} />
        <Text style={[styles.miniRating, { color: c.text }]}>
          {school.avgRating.toFixed(1)}
        </Text>
        {fee && (
          <Text style={[styles.miniFee, { color: c.textMuted }]} numberOfLines={1}>
            · {t('common.aed')} {fee}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function initials(name: string): string {
  return name
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadow.card,
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.985 }] },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  logo: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontWeight: '800', fontSize: font.body },
  headerText: { flex: 1 },
  name: { fontSize: 18, lineHeight: 23, fontWeight: '800', letterSpacing: -0.3 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  area: { fontSize: font.small },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  ratingText: { fontSize: font.small, fontWeight: '800' },
  ratingCount: { fontSize: font.tiny },
  fee: { fontSize: font.small, fontWeight: '700' },
  feeTba: { fontSize: font.tiny, fontWeight: '600' },
  feeLock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summary: { fontSize: font.small, lineHeight: 18, marginTop: spacing.sm },

  mini: {
    width: 190,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginEnd: spacing.md, // logical edge — flips correctly under RTL
  },
  miniLogo: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  miniLogoText: { fontWeight: '800', fontSize: font.small },
  miniName: { fontSize: font.small, fontWeight: '700', minHeight: 34 },
  miniArea: { fontSize: font.tiny, marginTop: 2 },
  miniFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: spacing.sm,
  },
  miniRating: { fontSize: font.tiny, fontWeight: '800' },
  miniFee: { fontSize: font.tiny, flexShrink: 1 },
});
