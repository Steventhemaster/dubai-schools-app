import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { font, radius, useTheme } from '@/theme';

type Tone = 'neutral' | 'success' | 'danger' | 'accent' | 'primary';

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: Tone;
}) {
  const { colors: t } = useTheme();
  const tones: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: t.surfaceAlt, fg: t.textMuted },
    success: { bg: t.successSoft, fg: t.success },
    danger: { bg: t.dangerSoft, fg: t.danger },
    accent: { bg: t.accentSoft, fg: t.accentText },
    primary: { bg: t.primarySoft, fg: t.primary },
  };
  const c = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { fontSize: font.tiny, fontWeight: '700' },
});
