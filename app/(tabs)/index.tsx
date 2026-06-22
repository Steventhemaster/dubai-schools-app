import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePlan } from '@/lib/usePlan';
import { OFFICES, BUDGET_BANDS } from '@/lib/planner';
import { font, radius, shadow, spacing, useTheme, type ThemeColors } from '@/theme';

export default function PlanHomeScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { plan } = usePlan();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.eyebrow, { color: c.primary }]}>DUBAI FAMILY PLANNER</Text>
        <Text style={[styles.hero, { color: c.text }]}>
          Find the best school & community for your family
        </Text>
        <Text style={[styles.heroSub, { color: c.textMuted }]}>
          Answer a few questions and get matched on tuition, commute, KHDA rating, and
          family-friendly areas across Dubai — no endless browsing.
        </Text>

        {plan ? (
          <View style={[styles.planCard, { backgroundColor: c.primarySoft, borderColor: c.primary }]}>
            <Text style={[styles.planCardLabel, { color: c.primaryText }]}>YOUR PLAN</Text>
            <Text style={[styles.planCardSummary, { color: c.text }]}>
              {plan.children.length} {plan.children.length > 1 ? 'children' : 'child'} ·{' '}
              {plan.curriculum} ·{' '}
              {BUDGET_BANDS.find((b) => b.id === plan.budget)?.label ?? ''}
            </Text>
            <Text style={[styles.planCardSub, { color: c.textMuted }]}>
              Work near {OFFICES.find((o) => o.id === plan.officeId)?.label ?? 'Dubai'}
            </Text>
            <View style={styles.planCardActions}>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: c.primary, flex: 1 }]}
                onPress={() => router.push('/plan/results')}
              >
                <Text style={[styles.primaryText, { color: c.textInverse }]}>View my matches</Text>
              </Pressable>
              <Pressable
                style={[styles.ghostBtn, { borderColor: c.primary }]}
                onPress={() => router.push('/plan/wizard')}
              >
                <Ionicons name="options-outline" size={18} color={c.primary} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[styles.primaryBtn, styles.cta, { backgroundColor: c.primary }]}
            onPress={() => router.push('/plan/wizard')}
          >
            <Ionicons name="sparkles" size={18} color={c.textInverse} />
            <Text style={[styles.primaryText, { color: c.textInverse }]}>Start my family plan</Text>
          </Pressable>
        )}

        {/* How it works */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>How it works</Text>
        <Step n={1} icon="location-outline" title="Tell us your situation" body="Where you work, your children, curriculum and budget." c={c} />
        <Step n={2} icon="sparkles-outline" title="Get matched" body="We score every Dubai school on commute, cost, rating and your priorities." c={c} />
        <Step n={3} icon="cash-outline" title="See the true cost" body="Tuition plus bus, books, uniform and activities — the real annual number." c={c} />

        {/* What we factor in */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>What we factor in</Text>
        <View style={styles.chips}>
          {['Tuition & true cost', 'KHDA rating', 'Commute from work', 'Curriculum', 'Seat availability', 'Your priorities'].map((f) => (
            <View key={f} style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.chipText, { color: c.text }]}>{f}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.browseLink} onPress={() => router.push('/browse')}>
          <Text style={[styles.browseText, { color: c.primary }]}>or browse all schools</Text>
          <Ionicons name="arrow-forward" size={16} color={c.primary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({
  n,
  icon,
  title,
  body,
  c,
}: {
  n: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  c: ThemeColors;
}) {
  return (
    <View style={[styles.step, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.stepIcon, { backgroundColor: c.primarySoft }]}>
        <Ionicons name={icon} size={20} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { color: c.text }]}>{title}</Text>
        <Text style={[styles.stepBody, { color: c.textMuted }]}>{body}</Text>
      </View>
      <Text style={[styles.stepNum, { color: c.surfaceAlt }]}>{n}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: { fontSize: font.tiny, fontWeight: '800', letterSpacing: 2, marginTop: spacing.sm },
  hero: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.7, marginTop: spacing.sm },
  heroSub: { fontSize: font.body, lineHeight: 22, marginTop: spacing.md },
  cta: { marginTop: spacing.xl },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  primaryText: { fontSize: font.body, fontWeight: '800' },
  ghostBtn: { width: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: radius.md },
  planCard: { borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl, ...shadow.soft },
  planCardLabel: { fontSize: font.tiny, fontWeight: '800', letterSpacing: 1.2 },
  planCardSummary: { fontSize: font.h3, fontWeight: '800', marginTop: 6 },
  planCardSub: { fontSize: font.small, marginTop: 2 },
  planCardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  sectionTitle: { fontSize: font.h2, fontWeight: '800', letterSpacing: -0.3, marginTop: spacing.xxl, marginBottom: spacing.md },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  stepIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: font.body, fontWeight: '700' },
  stepBody: { fontSize: font.small, marginTop: 2, lineHeight: 18 },
  stepNum: { fontSize: 34, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipText: { fontSize: font.small, fontWeight: '600' },
  browseLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.xxl },
  browseText: { fontSize: font.body, fontWeight: '700' },
});
