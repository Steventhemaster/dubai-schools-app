import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  LEGAL_META,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  type LegalSection,
} from '@/lib/legal';
import { font, spacing, useTheme } from '@/theme';

/** Shared renderer for the privacy / terms static screens. */
export function LegalView({ doc }: { doc: 'privacy' | 'terms' }) {
  const { t } = useTranslation();
  const { colors: c } = useTheme();

  const isPrivacy = doc === 'privacy';
  const sections: LegalSection[] = isPrivacy ? PRIVACY_POLICY : TERMS_OF_SERVICE;
  const title = isPrivacy ? t('legal.privacyTitle') : t('legal.termsTitle');

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.h1, { color: c.text }]}>{title}</Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {LEGAL_META.appName} · {t('legal.effective')} {LEGAL_META.effectiveDate}
        </Text>
        {sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={[styles.h2, { color: c.text }]}>{s.heading}</Text>
            {s.body.map((p, i) => (
              <Text key={i} style={[styles.p, { color: c.textMuted }]}>
                {p}
              </Text>
            ))}
          </View>
        ))}
        <Text style={[styles.disclaimer, { color: c.textMuted }]}>
          {t('legal.draftNote')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  h1: { fontSize: font.h1, fontWeight: '800' },
  meta: { fontSize: font.small, marginTop: spacing.xs, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  h2: { fontSize: font.h3, fontWeight: '700', marginBottom: spacing.sm },
  p: { fontSize: font.body, lineHeight: 22, marginBottom: spacing.sm },
  disclaimer: {
    fontSize: font.tiny,
    fontStyle: 'italic',
    marginTop: spacing.md,
    lineHeight: 16,
  },
});
