import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/lib/auth';
import { font, radius, spacing, useTheme } from '@/theme';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors: c } = useTheme();
  const { enabled, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'undisclosed' | ''>('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setError(t('auth.errorInvalid'));
      return;
    }
    // Only name is required; gender and phone are optional (data minimisation).
    if (mode === 'signup' && (!firstName.trim() || !lastName.trim())) {
      setError(t('auth.errorProfile'));
      return;
    }
    if (mode === 'signup' && !agreed) {
      setError(t('auth.errorConsent'));
      return;
    }
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const err =
        mode === 'signin'
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password, {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              gender,
              phone: phone.trim(),
            });
      if (err) {
        setError(err);
      } else if (mode === 'signup') {
        setInfo(t('auth.checkEmail'));
      } else {
        router.back();
      }
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: c.surface, borderColor: c.border, color: c.text },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: t('auth.title') }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.iconWrap, { backgroundColor: c.primarySoft }]}>
          <Ionicons name="person-circle-outline" size={40} color={c.primary} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>
          {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
        </Text>

        {!enabled && (
          <View style={[styles.notice, { backgroundColor: c.accentSoft }]}>
            <Text style={[styles.noticeText, { color: c.accentText }]}>
              {t('auth.demoNotice')}
            </Text>
          </View>
        )}

        {mode === 'signup' && (
          <>
            <View style={styles.nameRow}>
              <View style={styles.nameCol}>
                <Text style={[styles.label, { color: c.text }]}>{t('auth.firstName')}</Text>
                <TextInput
                  style={inputStyle}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="name-given"
                  placeholder={t('auth.firstName')}
                  placeholderTextColor={c.textMuted}
                />
              </View>
              <View style={styles.nameCol}>
                <Text style={[styles.label, { color: c.text }]}>{t('auth.lastName')}</Text>
                <TextInput
                  style={inputStyle}
                  value={lastName}
                  onChangeText={setLastName}
                  autoComplete="name-family"
                  placeholder={t('auth.lastName')}
                  placeholderTextColor={c.textMuted}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: c.text }]}>
              {t('auth.gender')} <Text style={{ color: c.textMuted }}>{t('auth.optional')}</Text>
            </Text>
            <View style={styles.genderRow}>
              {(['male', 'female', 'undisclosed'] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[
                    styles.genderChip,
                    {
                      borderColor: gender === g ? c.primary : c.border,
                      backgroundColor: gender === g ? c.primarySoft : c.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.genderText,
                      { color: gender === g ? c.primary : c.text },
                    ]}
                  >
                    {t(`auth.gender_${g}`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: c.text }]}>
              {t('auth.phone')} <Text style={{ color: c.textMuted }}>{t('auth.optional')}</Text>
            </Text>
            <TextInput
              style={inputStyle}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="+971 50 000 0000"
              placeholderTextColor={c.textMuted}
            />
          </>
        )}

        <Text style={[styles.label, { color: c.text }]}>{t('auth.email')}</Text>
        <TextInput
          style={inputStyle}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={c.textMuted}
        />

        <Text style={[styles.label, { color: c.text }]}>{t('auth.password')}</Text>
        <TextInput
          style={inputStyle}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder="••••••••"
          placeholderTextColor={c.textMuted}
        />

        {mode === 'signup' && (
          <Pressable style={styles.consentRow} onPress={() => setAgreed(!agreed)}>
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={22}
              color={agreed ? c.primary : c.textMuted}
            />
            <Text style={[styles.consentText, { color: c.textMuted }]}>
              {t('auth.consentPre')}{' '}
              <Text
                style={{ color: c.primary, fontWeight: '700' }}
                onPress={() => router.push('/legal/terms')}
              >
                {t('legal.termsTitle')}
              </Text>
              {' '}{t('auth.consentAnd')}{' '}
              <Text
                style={{ color: c.primary, fontWeight: '700' }}
                onPress={() => router.push('/legal/privacy')}
              >
                {t('legal.privacyTitle')}
              </Text>
            </Text>
          </Pressable>
        )}

        {!!error && <Text style={[styles.error, { color: c.danger }]}>{error}</Text>}
        {!!info && <Text style={[styles.info, { color: c.success }]}>{info}</Text>}

        <Pressable
          style={[styles.submit, { backgroundColor: c.primary }, (busy || !enabled) && styles.disabled]}
          onPress={submit}
          disabled={busy || !enabled}
        >
          <Text style={[styles.submitText, { color: c.textInverse }]}>
            {busy
              ? t('common.loading')
              : mode === 'signin'
                ? t('auth.signIn')
                : t('auth.signUp')}
          </Text>
        </Pressable>

        <Pressable
          style={styles.switchBtn}
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setInfo(null);
          }}
        >
          <Text style={[styles.switchText, { color: c.primary }]}>
            {mode === 'signin' ? t('auth.switchToUp') : t('auth.switchToIn')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl },
  nameRow: { flexDirection: 'row', gap: spacing.md },
  nameCol: { flex: 1 },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  genderText: { fontSize: font.small, fontWeight: '600' },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  consentText: { flex: 1, fontSize: font.small, lineHeight: 19 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  title: {
    fontSize: font.h2,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  notice: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { fontSize: font.small, fontWeight: '600', textAlign: 'center' },
  label: {
    fontSize: font.small,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
  },
  error: { marginTop: spacing.md, fontSize: font.small },
  info: { marginTop: spacing.md, fontSize: font.small, fontWeight: '600' },
  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  disabled: { opacity: 0.5 },
  submitText: { fontWeight: '800', fontSize: font.body },
  switchBtn: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.sm },
  switchText: { fontSize: font.small, fontWeight: '700' },
});
