// ── i18n bootstrap (Cultural Intelligence / Localization role) ─────────────
// English-first, Arabic ready. RTL is wired but defaults off until the user
// switches to Arabic, keeping the v1 launch English-primary.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ar from './locales/ar.json';

export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANG_KEY = 'app.language';

export const isRtlLanguage = (lng: string) => lng === 'ar';

function resolveInitialLanguage(): AppLanguage {
  const device = Localization.getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(device)
    ? (device as AppLanguage)
    : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Restore saved preference (async; UI re-renders on change).
// Guard: AsyncStorage's web backend touches window.localStorage, which doesn't
// exist during expo-router's server-side static render.
if (typeof window !== 'undefined') {
  AsyncStorage.getItem(LANG_KEY)
    .then((saved) => {
      if (saved && saved !== i18n.language) {
        i18n.changeLanguage(saved);
      }
    })
    .catch(() => {});
}

export async function setAppLanguage(lng: AppLanguage) {
  await AsyncStorage.setItem(LANG_KEY, lng);
  await i18n.changeLanguage(lng);
  const shouldBeRtl = isRtlLanguage(lng);
  if (I18nManager.isRTL !== shouldBeRtl) {
    I18nManager.allowRTL(shouldBeRtl);
    I18nManager.forceRTL(shouldBeRtl);
    // NOTE: A full RTL flip requires an app reload (Updates.reloadAsync in prod).
  }
}

export default i18n;
