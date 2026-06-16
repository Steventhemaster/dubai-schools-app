import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { radius, spacing, useTheme } from '@/theme';

/** Pulsing placeholder block shown while content loads. */
export function Skeleton({
  width,
  height = 14,
  round = radius.sm,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  round?: number;
  style?: ViewStyle;
}) {
  const { colors: t } = useTheme();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width: width ?? '100%', height, borderRadius: round, backgroundColor: t.surfaceAlt, opacity: pulse },
        style,
      ]}
    />
  );
}

/** Skeleton shaped like a SchoolCard, for list loading states. */
export function SchoolCardSkeleton() {
  const { colors: t } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.border },
      ]}
    >
      <View style={styles.row}>
        <Skeleton width={48} height={48} round={radius.md} />
        <View style={{ flex: 1, gap: spacing.sm }}>
          <Skeleton width="80%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <View style={[styles.row, { marginTop: spacing.md }]}>
        <Skeleton width={70} height={22} round={radius.pill} />
        <Skeleton width={56} height={22} round={radius.pill} />
        <Skeleton width={90} height={22} round={radius.pill} />
      </View>
      <View style={[styles.row, { marginTop: spacing.md, justifyContent: 'space-between' }]}>
        <Skeleton width={110} height={14} />
        <Skeleton width={120} height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
