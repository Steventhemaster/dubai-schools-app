import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Review } from '@/lib/types';
import { font, radius, spacing, useTheme } from '@/theme';
import { RatingStars } from './RatingStars';

/** App Store–style rating block: big average + 5→1 distribution bars. */
export function RatingSummary({
  average,
  reviews,
}: {
  average: number;
  reviews: Review[];
}) {
  const { colors: c } = useTheme();
  const { t } = useTranslation();
  const total = reviews.length;

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <View
      style={[styles.box, { backgroundColor: c.surface, borderColor: c.border }]}
    >
      <View style={styles.left}>
        <Text style={[styles.big, { color: c.text }]}>
          {total > 0 ? average.toFixed(1) : '—'}
        </Text>
        <RatingStars value={average} size={14} />
        <Text style={[styles.count, { color: c.textMuted }]}>
          {t('school.basedOn', { count: total })}
        </Text>
      </View>
      <View style={styles.right}>
        {dist.map(({ star, n }) => (
          <View key={star} style={styles.barRow}>
            <Text style={[styles.barLabel, { color: c.textMuted }]}>{star}</Text>
            <View style={[styles.track, { backgroundColor: c.surfaceAlt }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: c.star,
                    width: total > 0 ? `${(n / total) * 100}%` : '0%',
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  left: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  big: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  count: { fontSize: font.tiny },
  right: { flex: 1, justifyContent: 'center', gap: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 10, fontSize: font.tiny, fontWeight: '700', textAlign: 'center' },
  track: { flex: 1, height: 7, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
