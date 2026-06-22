// ── Family plan store (persisted, app-wide) ────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { FamilyPlan } from './planner';

const KEY = 'app.familyPlan';

interface PlanCtx {
  plan: FamilyPlan | null;
  /** True once we've finished reading storage (avoids home flicker). */
  ready: boolean;
  savePlan: (p: FamilyPlan) => void;
  clearPlan: () => void;
}

const Ctx = createContext<PlanCtx | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<FamilyPlan | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setReady(true);
      return;
    }
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          try {
            setPlan(JSON.parse(raw));
          } catch {
            /* ignore corrupt cache */
          }
        }
      })
      .finally(() => setReady(true));
  }, []);

  const savePlan = (p: FamilyPlan) => {
    setPlan(p);
    AsyncStorage.setItem(KEY, JSON.stringify(p)).catch(() => {});
  };

  const clearPlan = () => {
    setPlan(null);
    AsyncStorage.removeItem(KEY).catch(() => {});
  };

  return (
    <Ctx.Provider value={{ plan, ready, savePlan, clearPlan }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlan(): PlanCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
