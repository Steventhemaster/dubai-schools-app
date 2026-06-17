import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/FilterChips';
import { setAppLanguage, type AppLanguage } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { font, radius, spacing, useTheme } from '@/theme';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { colors: c, dark } = useTheme();
  const router = useRouter();
  const { enabled, session, email, signOut } = useAuth();
  // Derived, not captured in state — stays in sync with async language restore.
  const lang = (i18n.language as AppLanguage) ?? 'en';
  const [confirmDelete, setConfirmDelete] = useState(false);

  const change = async (l: AppLanguage) => {
    await setAppLanguage(l);
  };

  const deleteAccount = async () => {
    // Two-tap confirm (RN Alert is a no-op on web).
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    // Apple 5.1.1(v): in-app account deletion. SECURITY DEFINER RPC.
    await supabase?.rpc('delete_my_account');
    await signOut();
    setConfirmDelete(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: c.text }]}>{t('profile.title')}</Text>

        {enabled && (
          <Section title={t('profile.account')} icon="person-outline">
            {session ? (
              <View style={{ gap: spacing.md }}>
                <Text style={[styles.body, { color: c.text }]}>
                  {t('auth.signedInAs')}{' '}
                  <Text style={{ fontWeight: '700' }}>{email}</Text>
                </Text>
                <View style={styles.row}>
                  <Chip label={t('auth.signOut')} onPress={() => signOut()} />
                </View>
                <Pressable onPress={deleteAccount} hitSlop={6}>
                  <Text style={[styles.deleteText, { color: c.danger }]}>
                    {confirmDelete ? t('auth.deleteConfirm') : t('auth.deleteAccount')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.signInBtn, { backgroundColor: c.primary }]}
                onPress={() => router.push('/auth')}
              >
                <Ionicons name="log-in-outline" size={16} color={c.textInverse} />
                <Text style={[styles.signInText, { color: c.textInverse }]}>
                  {t('auth.signIn')}
                </Text>
              </Pressable>
            )}
          </Section>
        )}

        <Section title={t('profile.language')} icon="language-outline">
          <View style={styles.row}>
            <Chip
              label={t('profile.english')}
              active={lang === 'en'}
              onPress={() => change('en')}
            />
            <Chip
              label={t('profile.arabic')}
              active={lang === 'ar'}
              onPress={() => change('ar')}
            />
          </View>
        </Section>

        <Section title={t('profile.appearance')} icon={dark ? 'moon-outline' : 'sunny-outline'}>
          <Text style={[styles.body, { color: c.textMuted }]}>
            {t('profile.appearanceAuto')}
          </Text>
        </Section>

        <Section title={t('profile.legal')} icon="document-text-outline">
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push('/legal/privacy')}
          >
            <Text style={[styles.linkText, { color: c.primary }]}>
              {t('legal.privacyTitle')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push('/legal/terms')}
          >
            <Text style={[styles.linkText, { color: c.primary }]}>
              {t('legal.termsTitle')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </Pressable>
        </Section>

        <Section title={t('profile.about')} icon="information-circle-outline">
          <Text style={[styles.body, { color: c.textMuted }]}>
            {t('profile.aboutText')}
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  const { colors: c } = useTheme();
  return (
    <View
      style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}
    >
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={16} color={c.textMuted} />
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.md },
  title: { fontSize: font.h1, fontWeight: '800', marginBottom: spacing.lg },
  section: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: font.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  status: { fontSize: font.body, fontWeight: '600' },
  body: { fontSize: font.body, lineHeight: 22 },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  signInText: { fontWeight: '700', fontSize: font.small },
  deleteText: { fontSize: font.small, fontWeight: '600' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  linkText: { fontSize: font.body, fontWeight: '600' },
});
