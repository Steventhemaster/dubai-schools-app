// Native fallback. Leaflet is web-only; a real native map (react-native-maps)
// needs a dev build, so on iOS/Android we show a clear placeholder until then.
// Metro resolves SchoolMap.web.tsx on web and this file on native.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { School } from '@/lib/types';
import { font, spacing, useTheme } from '@/theme';

export function SchoolMap({
  schools,
}: {
  schools: School[];
  gated?: boolean;
}) {
  const { colors: c } = useTheme();
  const { t } = useTranslation();
  const withCoords = schools.filter((s) => s.lat != null && s.lng != null).length;
  return (
    <View style={[styles.wrap, { backgroundColor: c.surfaceAlt }]}>
      <Ionicons name="map-outline" size={40} color={c.textMuted} />
      <Text style={[styles.title, { color: c.text }]}>{t('home.mapNativeTitle')}</Text>
      <Text style={[styles.body, { color: c.textMuted }]}>
        {t('home.mapNativeBody', { count: withCoords })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  title: { fontSize: font.h3, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: font.small, textAlign: 'center', lineHeight: 20 },
});
