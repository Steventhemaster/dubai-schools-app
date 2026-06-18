// ── Auth state (Supabase email/password) ───────────────────────────────────
// When Supabase isn't configured (demo mode) `enabled` is false and the app
// keeps its anonymous demo behaviour. All Supabase calls live in effects /
// handlers, never at module level (expo-router SSR has no window).

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';

export interface SignUpProfile {
  firstName: string;
  lastName: string;
  /** Optional — empty string when not provided. */
  gender: 'male' | 'female' | 'undisclosed' | '';
  /** Optional — empty string when not provided. */
  phone: string;
}

interface AuthCtx {
  /** False in offline demo mode — auth UI should be skipped entirely. */
  enabled: boolean;
  session: Session | null;
  /** Convenience: signed-in user's email (or null). */
  email: string | null;
  /** Returns an error message, or null on success. */
  signIn: (email: string, password: string) => Promise<string | null>;
  /** Returns an error message, or null on success (may require email confirm). */
  signUp: (
    email: string,
    password: string,
    profile: SignUpProfile
  ) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return 'Demo mode — Supabase not configured';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const signUp = async (
    email: string,
    password: string,
    profile: SignUpProfile
  ) => {
    if (!supabase) return 'Demo mode — Supabase not configured';
    // Profile fields ride along as user metadata; a DB trigger writes them
    // into public.profiles. Passwords never touch our tables.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          gender: profile.gender,
          phone: profile.phone,
        },
      },
    });
    return error ? error.message : null;
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <Ctx.Provider
      value={{
        enabled: isSupabaseConfigured,
        session,
        email: session?.user?.email ?? null,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
