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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { RatingStars } from '@/components/RatingStars';
import { useAuth } from '@/lib/auth';
import { addReview } from '@/lib/repository';
import { font, radius, spacing, useTheme } from '@/theme';

export default function WriteReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors: c } = useTheme();
  const { enabled, session } = useAuth();

  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // With a live backend, reviews require an account (RLS enforces it anyway).
  if (enabled && !session) {
    return (
      <View style={[styles.container, styles.gate, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: t('review.title') }} />
        <Ionicons name="lock-closed-outline" size={36} color={c.textMuted} />
        <Text style={[styles.gateTitle, { color: c.text }]}>
          {t('review.signInToReview')}
        </Text>
        <Text style={[styles.gateBody, { color: c.textMuted }]}>
          {t('review.signInToReviewBody')}
        </Text>
        <Pressable
          style={[styles.submit, styles.gateBtn, { backgroundColor: c.primary }]}
          onPress={() => router.push('/auth')}
        >
          <Text style={[styles.submitText, { color: c.textInverse }]}>
            {t('auth.signIn')}
          </Text>
        </Pressable>
      </View>
    );
  }

  const submit = async () => {
    if (rating === 0) return setError(t('review.errorRating'));
    if (body.trim().length < 4) return setError(t('review.errorBody'));
    setError(null);
    setSubmitting(true);
    try {
      await addReview({
        schoolId: id!,
        authorName: name.trim() || 'Anonymous',
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      });
      router.back();
    } catch (e) {
      setError(String(e));
      setSubmitting(false);
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
      <Stack.Screen options={{ title: t('review.title') }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Big tap-to-rate block */}
        <View
          style={[styles.rateBox, { backgroundColor: c.surface, borderColor: c.border }]}
        >
          <Text style={[styles.label, { color: c.text, marginTop: 0 }]}>
            {t('review.yourRating')}
          </Text>
          <RatingStars value={rating} size={38} onChange={setRating} />
          <Text
            style={[
              styles.rateLabel,
              { color: rating > 0 ? c.accentText : c.textMuted },
            ]}
          >
            {rating > 0 ? t(`review.labels.${rating}`) : t('review.tapToRate')}
          </Text>
        </View>

        <Text style={[styles.label, { color: c.text }]}>{t('review.name')}</Text>
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder={t('review.namePlaceholder')}
          placeholderTextColor={c.textMuted}
        />

        <Text style={[styles.label, { color: c.text }]}>{t('review.reviewTitle')}</Text>
        <TextInput
          style={inputStyle}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={c.textMuted}
        />

        <Text style={[styles.label, { color: c.text }]}>{t('review.body')}</Text>
        <TextInput
          style={[...inputStyle, styles.textarea]}
          value={body}
          onChangeText={setBody}
          placeholder={t('review.bodyPlaceholder')}
          placeholderTextColor={c.textMuted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {!!error && <Text style={[styles.error, { color: c.danger }]}>{error}</Text>}

        <Pressable
          style={[
            styles.submit,
            { backgroundColor: c.primary },
            submitting && styles.submitDisabled,
          ]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={[styles.submitText, { color: c.textInverse }]}>
            {submitting ? t('review.submitting') : t('review.submit')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  gate: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  gateTitle: { fontSize: font.h3, fontWeight: '800', textAlign: 'center' },
  gateBody: { fontSize: font.small, textAlign: 'center', lineHeight: 20 },
  gateBtn: { alignSelf: 'stretch', marginTop: spacing.md },
  rateBox: {
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
  },
  rateLabel: { fontSize: font.body, fontWeight: '700' },
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
  textarea: { minHeight: 120 },
  error: { marginTop: spacing.md, fontSize: font.small },
  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontWeight: '800', fontSize: font.body },
});
