import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePlan } from '@/lib/usePlan';
import {
  BUDGET_BANDS,
  OFFICES,
  PRIORITIES,
  type BudgetBand,
  type Child,
  type CurriculumPref,
  type Priority,
} from '@/lib/planner';
import { font, radius, shadow, spacing, useTheme, type ThemeColors } from '@/theme';

const CURRICULA: CurriculumPref[] = ['British', 'IB', 'American', 'Indian (CBSE)', 'French', 'Any'];
const TOTAL_STEPS = 5;

export default function WizardScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { savePlan } = usePlan();

  const [step, setStep] = useState(0);
  const [officeId, setOfficeId] = useState<string>('');
  const [children, setChildren] = useState<Child[]>([{ age: undefined }]);
  const [curriculum, setCurriculum] = useState<CurriculumPref>('Any');
  const [budget, setBudget] = useState<BudgetBand | ''>('');
  const [priorities, setPriorities] = useState<Priority[]>([]);

  const canNext = [
    !!officeId,
    children.length > 0,
    !!curriculum,
    !!budget,
    priorities.length > 0,
  ][step];

  const finish = () => {
    savePlan({
      officeId,
      children,
      curriculum,
      budget: budget as BudgetBand,
      priorities,
      createdAt: new Date().toISOString(),
    });
    router.replace('/plan/results');
  };

  const next = () => (step < TOTAL_STEPS - 1 ? setStep(step + 1) : finish());

  const togglePriority = (p: Priority) =>
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : prev.length >= 3 ? prev : [...prev, p]
    );

  const setChildCount = (n: number) =>
    setChildren((prev) => {
      const next = [...prev];
      while (next.length < n) next.push({ age: undefined });
      return next.slice(0, n);
    });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header: progress + close */}
      <View style={styles.top}>
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={c.textMuted} />
        </Pressable>
        <View style={styles.progressTrack}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                { backgroundColor: i <= step ? c.primary : c.surfaceAlt },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.stepNum, { color: c.textSubtle }]}>
          {step + 1}/{TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <Step title="Where do you work?" subtitle="We'll estimate commute from here." c={c}>
            {OFFICES.map((o, i) => {
              const newGroup = i === 0 || OFFICES[i - 1].group !== o.group;
              return (
                <React.Fragment key={o.id}>
                  {newGroup && (
                    <Text style={[styles.groupHeader, { color: c.textSubtle }]}>
                      {o.group.toUpperCase()}
                    </Text>
                  )}
                  <SelectRow
                    label={o.label}
                    active={officeId === o.id}
                    onPress={() => setOfficeId(o.id)}
                    c={c}
                  />
                </React.Fragment>
              );
            })}
          </Step>
        )}

        {step === 1 && (
          <Step title="Your children" subtitle="How many, and their ages." c={c}>
            <View style={styles.stepper}>
              <Text style={[styles.stepperLabel, { color: c.text }]}>Children</Text>
              <View style={styles.stepperCtrls}>
                <StepBtn icon="remove" onPress={() => setChildCount(Math.max(1, children.length - 1))} c={c} />
                <Text style={[styles.stepperVal, { color: c.text }]}>{children.length}</Text>
                <StepBtn icon="add" onPress={() => setChildCount(Math.min(5, children.length + 1))} c={c} />
              </View>
            </View>
            {children.map((ch, i) => (
              <View key={i} style={[styles.ageRow, { borderColor: c.border }]}>
                <Text style={[styles.ageLabel, { color: c.textMuted }]}>Child {i + 1} age</Text>
                <TextInput
                  style={[styles.ageInput, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={c.textSubtle}
                  value={ch.age != null ? String(ch.age) : ''}
                  onChangeText={(v) => {
                    const age = parseInt(v, 10);
                    setChildren((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, age: isNaN(age) ? undefined : age } : x))
                    );
                  }}
                />
              </View>
            ))}
          </Step>
        )}

        {step === 2 && (
          <Step title="Curriculum preference" subtitle="Pick one, or keep it open." c={c}>
            {CURRICULA.map((cur) => (
              <SelectRow key={cur} label={cur} active={curriculum === cur} onPress={() => setCurriculum(cur)} c={c} />
            ))}
          </Step>
        )}

        {step === 3 && (
          <Step title="Annual school budget" subtitle="Per child, tuition only." c={c}>
            {BUDGET_BANDS.map((b) => (
              <SelectRow key={b.id} label={b.label} active={budget === b.id} onPress={() => setBudget(b.id)} c={c} />
            ))}
          </Step>
        )}

        {step === 4 && (
          <Step title="What matters most?" subtitle="Pick up to 3, in order." c={c}>
            {PRIORITIES.map((p) => {
              const rank = priorities.indexOf(p.id);
              const active = rank >= 0;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => togglePriority(p.id)}
                  style={[
                    styles.selectRow,
                    { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primarySoft : c.surface },
                  ]}
                >
                  <Text style={[styles.selectLabel, { color: active ? c.primary : c.text, fontWeight: active ? '700' : '500' }]}>
                    {p.label}
                  </Text>
                  {active ? (
                    <View style={[styles.rankBadge, { backgroundColor: c.primary }]}>
                      <Text style={[styles.rankText, { color: c.textInverse }]}>{rank + 1}</Text>
                    </View>
                  ) : (
                    <Ionicons name="ellipse-outline" size={20} color={c.textSubtle} />
                  )}
                </Pressable>
              );
            })}
          </Step>
        )}
      </ScrollView>

      {/* Footer nav */}
      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.surface }]}>
        {step > 0 && (
          <Pressable style={[styles.backBtn, { borderColor: c.border }]} onPress={() => setStep(step - 1)}>
            <Text style={[styles.backText, { color: c.text }]}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.nextBtn, { backgroundColor: c.primary }, !canNext && styles.disabled]}
          onPress={next}
          disabled={!canNext}
        >
          <Text style={[styles.nextText, { color: c.textInverse }]}>
            {step === TOTAL_STEPS - 1 ? 'See my matches' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Step({
  title,
  subtitle,
  c,
  children,
}: {
  title: string;
  subtitle: string;
  c: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

function SelectRow({
  label,
  active,
  onPress,
  c,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  c: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectRow,
        { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primarySoft : c.surface },
      ]}
    >
      <Text style={[styles.selectLabel, { color: active ? c.primary : c.text, fontWeight: active ? '700' : '500' }]}>
        {label}
      </Text>
      <Ionicons
        name={active ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={active ? c.primary : c.textSubtle}
      />
    </Pressable>
  );
}

function StepBtn({ icon, onPress, c }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; c: ThemeColors }) {
  return (
    <Pressable onPress={onPress} style={[styles.stepBtn, { borderColor: c.border, backgroundColor: c.surface }]}>
      <Ionicons name={icon} size={18} color={c.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 4 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },
  stepNum: { fontSize: font.small, fontWeight: '600' },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: font.h1, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: font.body, marginTop: 6, marginBottom: spacing.xl, lineHeight: 21 },
  groupHeader: {
    fontSize: font.tiny,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  selectLabel: { fontSize: font.body },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepperLabel: { fontSize: font.h3, fontWeight: '700' },
  stepperCtrls: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stepperVal: { fontSize: font.h2, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  stepBtn: { width: 40, height: 40, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
  },
  ageLabel: { fontSize: font.body },
  ageInput: { width: 64, borderWidth: 1, borderRadius: radius.sm, paddingVertical: 8, textAlign: 'center', fontSize: font.body },
  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: font.small, fontWeight: '800' },
  footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, ...shadow.lg },
  backBtn: { paddingHorizontal: spacing.xl, justifyContent: 'center', borderWidth: 1, borderRadius: radius.md },
  backText: { fontSize: font.body, fontWeight: '700' },
  nextBtn: { flex: 1, alignItems: 'center', borderRadius: radius.md, paddingVertical: spacing.lg },
  nextText: { fontSize: font.body, fontWeight: '800' },
  disabled: { opacity: 0.4 },
});
