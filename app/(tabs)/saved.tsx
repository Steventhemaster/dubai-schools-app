import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SchoolCard } from '@/components/SchoolCard';
import { useSavedSchools } from '@/components/useSavedSchools';
import { listSchools } from '@/lib/repository';
import type { School } from '@/lib/types';
import { font, spacing, useTheme } from '@/theme';

export default function SavedScreen() {
  const { t } = useTranslation();
  const { colors: c } = useTheme();
  const { saved } = useSavedSchools();
  const [all, setAll] = useState<School[]>([]);

  // Refresh when the tab regains focus so newly saved schools appear.
  useFocusEffect(
    useCallback(() => {
      listSchools().then(setAll);
    }, [])
  );

  const schools = all.filter((s) => saved.includes(s.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <FlatList
        data={schools}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <SchoolCard school={item} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={[styles.title, { color: c.text }]}>{t('tabs.saved')}</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={40} color={c.textMuted} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              {t('saved.empty')}
            </Text>
            <Text style={[styles.emptyHint, { color: c.textMuted }]}>
              {t('saved.hint')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.md, flexGrow: 1 },
  title: { fontSize: font.h1, fontWeight: '800', marginBottom: spacing.lg },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: font.h3, fontWeight: '700', textAlign: 'center' },
  emptyHint: { fontSize: font.small, textAlign: 'center' },
});
