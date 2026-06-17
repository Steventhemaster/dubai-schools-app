import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { font, radius, spacing, useTheme } from '@/theme';

interface Props {
  visible: boolean;
  title: string;
  options: string[];
  selected?: string;
  /** Label for the "no filter" row, e.g. "All areas". */
  allLabel: string;
  /** Show a search box (for long lists like 78 areas). */
  searchable?: boolean;
  onSelect: (value?: string) => void;
  onClose: () => void;
}

/** Bottom-sheet single-select picker. Built on RN Modal — no extra deps,
 *  works on web + native. */
export function PickerSheet({
  visible,
  title,
  options,
  selected,
  allLabel,
  searchable,
  onSelect,
  onClose,
}: Props) {
  const { colors: c } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const choose = (v?: string) => {
    onSelect(v);
    setQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: c.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>
            <Pressable hitSlop={10} onPress={onClose}>
              <Ionicons name="close" size={22} color={c.textMuted} />
            </Pressable>
          </View>

          {searchable && (
            <View
              style={[styles.search, { backgroundColor: c.bg, borderColor: c.border }]}
            >
              <Ionicons name="search" size={16} color={c.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: c.text }]}
                placeholder={t('common.search')}
                placeholderTextColor={c.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ListHeaderComponent={
              <Row
                label={allLabel}
                active={!selected}
                onPress={() => choose(undefined)}
                c={c}
              />
            }
            renderItem={({ item }) => (
              <Row
                label={item}
                active={selected === item}
                onPress={() => choose(item)}
                c={c}
              />
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  label,
  active,
  onPress,
  c,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  c: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.bg }]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.rowText,
          { color: active ? c.primary : c.text, fontWeight: active ? '800' : '500' },
        ]}
      >
        {label}
      </Text>
      {active && <Ionicons name="checkmark" size={20} color={c.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9993',
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { fontSize: font.h3, fontWeight: '800' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: font.body, paddingVertical: 2 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowText: { fontSize: font.body },
});
