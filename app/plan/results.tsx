import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePlan } from '@/lib/usePlan';
import { useAuth } from '@/lib/auth';
import { listSchools } from '@/lib/repository';
import { OFFICES, recommendSchools, type SchoolMatch } from '@/lib/planner';
import { formatAed } from '@/lib/format';
import type { School } from '@/lib/types';
import { font, radius, shadow, spacing, useTheme, type ThemeColors } from '@/theme';

export default function ResultsScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { plan, ready } = usePlan();
  const { enabled, session } = useAuth();
  const gated = enabled && !session;
  const [all, setAll] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSchools().then(setAll).finally(() => setLoading(false));
  }, []);

  // No plan yet → send to the wizard.
  useEffect(() => {
    if (ready && !plan) router.replace('/plan/wizard');
  }, [ready, plan, router]);

  const matches = useMemo(
    () => (plan ? recommendSchools(all, plan, 15) : []),
    [all, plan]
  );

  const officeLabel = plan
    ? OFFICES.find((o) => o.id === plan.officeId)?.label ?? 'your work'
    : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.top}>
        <Pressable hitSlop={10} onPress={() => router.replace('/')}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Pressable
          style={[styles.editBtn, { borderColor: c.border }]}
          onPress={() => router.push('/plan/wizard')}
        >
          <Ionicons name="options-outline" size={15} color={c.text} />
          <Text style={[styles.editText, { color: c.text }]}>Edit plan</Text>
        </Pressable>
      </View>

      {loading || !ready ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.eyebrow, { color: c.primary }]}>YOUR FAMILY PLAN</Text>
          <Text style={[styles.h1, { color: c.text }]}>Top matches for you</Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>
            Ranked by your priorities · commute from {officeLabel} ·{' '}
            <Text style={{ fontStyle: 'italic' }}>some figures are estimates</Text>
          </Text>

          {matches.map((m, i) => (
            <MatchCard key={m.school.id} match={m} rank={i + 1} gated={gated} c={c} onPress={() => router.push(`/school/${m.school.id}`)} onSignIn={() => router.push('/auth')} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function scoreColor(score: number, c: ThemeColors): string {
  if (score >= 85) return c.success;
  if (score >= 70) return c.primary;
  if (score >= 50) return c.warning;
  return c.textMuted;
}

function MatchCard({
  match,
  rank,
  gated,
  c,
  onPress,
  onSignIn,
}: {
  match: SchoolMatch;
  rank: number;
  gated: boolean;
  c: ThemeColors;
  onPress: () => void;
  onSignIn: () => void;
}) {
  const { school, score, commute, cost, reasons } = match;
  const col = scoreColor(score, c);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.cardHead}>
        <View style={styles.rankRow}>
          <Text style={[styles.rank, { color: c.textSubtle }]}>#{rank}</Text>
          <Text style={[styles.cardName, { color: c.text }]} numberOfLines={2}>
            {school.name}
          </Text>
        </View>
        <View style={[styles.scoreRing, { borderColor: col }]}>
          <Text style={[styles.scoreNum, { color: col }]}>{score}</Text>
          <Text style={[styles.scorePct, { color: col }]}>%</Text>
        </View>
      </View>

      <Text style={[styles.meta, { color: c.textMuted }]} numberOfLines={1}>
        {school.curriculum} · {school.area}
        {school.khdaRating !== 'Not Rated' ? ` · ${school.khdaRating}` : ''}
      </Text>

      {reasons.length > 0 && (
        <View style={styles.reasons}>
          {reasons.slice(0, 3).map((r) => (
            <View key={r} style={styles.reasonRow}>
              <Ionicons name="checkmark-circle" size={14} color={c.success} />
              <Text style={[styles.reasonText, { color: c.text }]}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.statsRow, { borderTopColor: c.border }]}>
        <Stat
          icon="car-outline"
          label="Commute"
          value={commute ? `~${commute.minutes} min` : '—'}
          hint="est."
          c={c}
        />
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        {gated ? (
          <Pressable style={styles.stat} onPress={onSignIn}>
            <View style={styles.statLabelRow}>
              <Ionicons name="lock-closed" size={13} color={c.textMuted} />
              <Text style={[styles.statLabel, { color: c.textMuted }]}>True cost</Text>
            </View>
            <Text style={[styles.statValue, { color: c.primary }]}>Sign in</Text>
          </Pressable>
        ) : (
          <Stat
            icon="cash-outline"
            label="True cost / yr"
            value={cost.trueAnnual != null ? `AED ${formatAed(cost.trueAnnual)}` : '—'}
            hint="est."
            c={c}
          />
        )}
      </View>
    </Pressable>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  c,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hint?: string;
  c: ThemeColors;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statLabelRow}>
        <Ionicons name={icon} size={13} color={c.textMuted} />
        <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: c.text }]}>
        {value}
        {hint ? <Text style={[styles.statHint, { color: c.textSubtle }]}> {hint}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  editText: { fontSize: font.small, fontWeight: '600' },
  body: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  eyebrow: { fontSize: font.tiny, fontWeight: '800', letterSpacing: 1.5 },
  h1: { fontSize: font.h1, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  sub: { fontSize: font.small, marginTop: 6, marginBottom: spacing.lg, lineHeight: 19 },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  rankRow: { flex: 1, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  rank: { fontSize: font.body, fontWeight: '800', marginTop: 2 },
  cardName: { flex: 1, fontSize: 18, lineHeight: 23, fontWeight: '800', letterSpacing: -0.3 },
  scoreRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreNum: { fontSize: font.h3, fontWeight: '800' },
  scorePct: { fontSize: font.tiny, fontWeight: '800', marginTop: 3 },
  meta: { fontSize: font.small, marginTop: spacing.sm },
  reasons: { marginTop: spacing.md, gap: 5 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reasonText: { fontSize: font.small },
  statsRow: { flexDirection: 'row', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1 },
  stat: { flex: 1, gap: 3 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { fontSize: font.tiny, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: font.body, fontWeight: '800' },
  statHint: { fontSize: font.tiny, fontWeight: '400', fontStyle: 'italic' },
  statDivider: { width: 1, marginHorizontal: spacing.md },
});
