// ── Saved-schools store (lightweight global state via React context) ───────
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const KEY = 'app.savedSchools';

interface SavedCtx {
  saved: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
}

const Ctx = createContext<SavedCtx | undefined>(undefined);

export function SavedSchoolsProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setSaved(JSON.parse(raw));
        } catch {
          /* ignore corrupt cache */
        }
      }
    });
  }, []);

  const persist = (next: string[]) => {
    setSaved(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next));
  };

  const toggle = (id: string) => {
    persist(saved.includes(id) ? saved.filter((s) => s !== id) : [...saved, id]);
  };

  const isSaved = (id: string) => saved.includes(id);

  return <Ctx.Provider value={{ saved, isSaved, toggle }}>{children}</Ctx.Provider>;
}

export function useSavedSchools() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSavedSchools must be used within SavedSchoolsProvider');
  return ctx;
}
