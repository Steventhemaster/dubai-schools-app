// ── Supabase client (Backend Architect role) ──────────────────────────────
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '';
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '';

/**
 * True only when real credentials are configured. When false, the data layer
 * falls back to bundled seed data so the app is fully demoable offline.
 */
export const isSupabaseConfigured =
  !!url && !!anonKey && !url.includes('YOUR_PROJECT');

// During expo-router's static web render there is no `window`, and supabase-js
// auto-initialises its auth client (reading from storage) the moment it's
// created — which crashes AsyncStorage's web backend. On the server we hand it
// a no-op storage and disable session persistence; the real device/browser
// build (where `window` exists) gets full AsyncStorage-backed sessions.
const isServer = typeof window === 'undefined';

const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        storage: isServer ? noopStorage : AsyncStorage,
        autoRefreshToken: !isServer,
        persistSession: !isServer,
        detectSessionInUrl: false,
      },
    })
  : null;
