import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, useTheme } from '@/theme';

interface Props {
  value: number; // 0–5, may be fractional for display
  size?: number;
  /** When provided, stars become tappable (1–5). */
  onChange?: (value: number) => void;
  showValue?: boolean;
  count?: number;
}

/**
 * Star rating that doubles as a display widget and an input control.
 * Display mode renders half-stars; input mode rounds to whole stars.
 */
export function RatingStars({
  value,
  size = 16,
  onChange,
  showValue,
  count,
}: Props) {
  const { colors: t } = useTheme();
  const interactive = !!onChange;
  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = value >= i - 0.25;
          const half = !filled && value >= i - 0.75;
          const name = filled ? 'star' : half ? 'star-half' : 'star-outline';
          const star = (
            <Ionicons
              key={i}
              name={name}
              size={size}
              color={filled || half ? t.star : t.border}
            />
          );
          return interactive ? (
            <Pressable
              key={i}
              hitSlop={8}
              onPress={() => onChange?.(i)}
              accessibilityRole="button"
              accessibilityLabel={`${i} star${i > 1 ? 's' : ''}`}
            >
              {star}
            </Pressable>
          ) : (
            star
          );
        })}
      </View>
      {showValue && (
        <Text style={[styles.value, { color: t.textMuted }]}>
          {value > 0 ? value.toFixed(1) : '—'}
          {typeof count === 'number' ? ` (${count})` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stars: { flexDirection: 'row', gap: 2 },
  value: { fontSize: font.small, fontWeight: '600' },
});
