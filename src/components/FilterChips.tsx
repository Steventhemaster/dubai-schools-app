import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { font, radius, spacing, useTheme } from '@/theme';

export interface ChipOption {
  label: string;
  value: string;
}

interface Props {
  options: ChipOption[];
  /** Currently selected value, or undefined for "all". */
  selected?: string;
  onSelect: (value?: string) => void;
  allLabel?: string;
}

/** Horizontal single-select chip row with an "all" reset chip. */
export function FilterChips({ options, selected, onSelect, allLabel }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {allLabel && (
        <Chip
          label={allLabel}
          active={!selected}
          onPress={() => onSelect(undefined)}
        />
      )}
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          active={selected === o.value}
          onPress={() => onSelect(selected === o.value ? undefined : o.value)}
        />
      ))}
    </ScrollView>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  const { colors: t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: t.surface, borderColor: t.border },
        active && { backgroundColor: t.primary, borderColor: t.primary },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon}
      <Text
        style={[
          styles.chipText,
          { color: active ? t.textInverse : t.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs, paddingEnd: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: font.small, fontWeight: '600' },
});
