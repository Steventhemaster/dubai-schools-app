import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SchoolCard, SchoolMiniCard } from '@/components/SchoolCard';
import { SchoolCardSkeleton } from '@/components/Skeleton';
import { Chip, FilterChips } from '@/components/FilterChips';
import { listSchools } from '@/lib/repository';
import type { School, SchoolFilter } from '@/lib/types';
import { font, radius, spacing, useTheme } from '@/theme';

const CURRICULA = ['British', 'American', 'IB', 'Indian (CBSE)', 'French'];
type SortKey = 'rating' | 'fees' | null;

export default function SchoolsScreen() {
  const { t } = useTranslation();
  const { colors: c } = useTheme();
  const [all, setAll] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SchoolFilter>({});
  const [sort, setSort] = useState<SortKey>(null);

  const load = useCallback(async () => {
    const data = await listSchools();
    setAll(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Area options come from the loaded data so they work in both demo and
  // Supabase modes (the #1 decision for relocating parents is the area).
  const areas = useMemo(
    () => Array.from(new Set(all.map((s) => s.area))).sort(),
    [all]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.area.toLowerCase().includes(q))
        return false;
      if (filter.curriculum && s.curriculum !== filter.curriculum) return false;
      if (filter.area && s.area !== filter.area) return false;
      // Unknown vacancy (null) is excluded from "has vacancy" results.
      if (filter.vacancyOnly && s.hasVacancy !== true) return false;
      return true;
    });
    if (sort === 'rating') {
      return [...filtered].sort((a, b) => b.avgRating - a.avgRating);
    }
    if (sort === 'fees') {
      return [...filtered].sort(
        (a, b) => (a.feeMinAed ?? Infinity) - (b.feeMinAed ?? Infinity)
      );
    }
    return filtered;
  }, [all, query, filter, sort]);

  // Horizontal rail: best-reviewed schools; before reviews exist (cold
  // start) fall back to official KHDA "Outstanding" schools so the rail is
  // never empty on a fresh launch.
  const topRated = useMemo(() => {
    const reviewed = all
      .filter((s) => s.reviewCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating);
    if (reviewed.length > 1) return reviewed.slice(0, 6);
    return all.filter((s) => s.khdaRating === 'Outstanding').slice(0, 6);
  }, [all]);
  const showRail =
    !query &&
    !filter.curriculum &&
    !filter.area &&
    !filter.vacancyOnly &&
    topRated.length > 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <FlatList
        data={loading ? [] : results}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <SchoolCard school={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.appName, { color: c.accentText }]}>
              {t('app.name').toUpperCase()}
            </Text>
            <Text style={[styles.title, { color: c.text }]}>{t('home.title')}</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              {t('home.subtitle')}
            </Text>

            <View
              style={[
                styles.search,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <Ionicons name="search" size={18} color={c.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: c.text }]}
                placeholder={t('home.searchPlaceholder')}
                placeholderTextColor={c.textMuted}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={c.textMuted}
                  onPress={() => setQuery('')}
                />
              )}
            </View>

            <FilterChips
              allLabel={t('filter.all')}
              options={CURRICULA.map((cur) => ({ label: cur, value: cur }))}
              selected={filter.curriculum}
              onSelect={(v) => setFilter((f) => ({ ...f, curriculum: v as any }))}
            />
            {areas.length > 1 && (
              <FilterChips
                allLabel={`📍 ${t('filter.area')}`}
                options={areas.map((a) => ({ label: a, value: a }))}
                selected={filter.area}
                onSelect={(v) => setFilter((f) => ({ ...f, area: v }))}
              />
            )}

            <View style={styles.sortRow}>
              <Chip
                label={t('filter.vacancyOnly')}
                active={!!filter.vacancyOnly}
                onPress={() =>
                  setFilter((f) => ({ ...f, vacancyOnly: f.vacancyOnly ? undefined : true }))
                }
                icon={
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={14}
                    color={filter.vacancyOnly ? c.textInverse : c.success}
                  />
                }
              />
              <Chip
                label={t('home.sortRating')}
                active={sort === 'rating'}
                onPress={() => setSort(sort === 'rating' ? null : 'rating')}
                icon={
                  <Ionicons
                    name="star-outline"
                    size={14}
                    color={sort === 'rating' ? c.textInverse : c.star}
                  />
                }
              />
              <Chip
                label={t('home.sortFees')}
                active={sort === 'fees'}
                onPress={() => setSort(sort === 'fees' ? null : 'fees')}
                icon={
                  <Ionicons
                    name="trending-down-outline"
                    size={14}
                    color={sort === 'fees' ? c.textInverse : c.primary}
                  />
                }
              />
            </View>

            {showRail && (
              <View style={styles.rail}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>
                  {t('home.topRated')}
                </Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={topRated}
                  keyExtractor={(s) => `top-${s.id}`}
                  renderItem={({ item }) => <SchoolMiniCard school={item} />}
                />
              </View>
            )}

            <Text style={[styles.count, { color: c.textMuted }]}>
              {showRail
                ? t('home.allSchools')
                : t('home.resultsCount', { count: results.length })}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View>
              <SchoolCardSkeleton />
              <SchoolCardSkeleton />
              <SchoolCardSkeleton />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="school-outline" size={36} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                {t('home.noResults')}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: spacing.lg, paddingTop: spacing.md },
  header: { marginBottom: spacing.sm },
  appName: { fontSize: font.tiny, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: font.h1, fontWeight: '800', marginTop: 2 },
  subtitle: { fontSize: font.small, marginTop: spacing.xs, marginBottom: spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontSize: font.body, paddingVertical: 2 },
  sortRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  rail: { marginTop: spacing.lg },
  sectionTitle: { fontSize: font.h3, fontWeight: '700', marginBottom: spacing.md },
  count: {
    fontSize: font.small,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  empty: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl },
  emptyText: { fontSize: font.body, textAlign: 'center' },
});
