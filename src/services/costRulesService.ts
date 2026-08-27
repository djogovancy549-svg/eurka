import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CostComponentRule, DEFAULT_COST_COMPONENT_RULES } from '../types';

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export const getCostComponentRules = async (): Promise<CostComponentRule[]> => {
  try {
    const cached = localStorage.getItem('cached_cost_component_rules');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Trigger background refresh
        fetchFromFirestore();
        return parsed;
      }
    }
  } catch (e) {}

  return await fetchFromFirestore();
};

const fetchFromFirestore = async (): Promise<CostComponentRule[]> => {
  try {
    const docRef = doc(db, 'appConfig', 'costComponentRules');
    const docSnap = await withTimeout(getDoc(docRef), 8000, null as any);

    if (docSnap && docSnap.exists() && docSnap.data().rules) {
      const rules = docSnap.data().rules as CostComponentRule[];
      try {
        localStorage.setItem('cached_cost_component_rules', JSON.stringify(rules));
      } catch (e) {}
      return rules;
    }
  } catch (e) {
    console.warn('Failed to load cost rules from Firestore:', e);
  }

  try {
    localStorage.setItem('cached_cost_component_rules', JSON.stringify(DEFAULT_COST_COMPONENT_RULES));
  } catch (e) {}

  return DEFAULT_COST_COMPONENT_RULES;
};

export const saveCostComponentRules = async (rules: CostComponentRule[]): Promise<void> => {
  try {
    localStorage.setItem('cached_cost_component_rules', JSON.stringify(rules));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'costComponentRules');
    await withTimeout(
      setDoc(docRef, {
        rules: JSON.parse(JSON.stringify(rules)),
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      8000,
      undefined
    );
  } catch (e) {
    console.warn('Error saving cost rules to Firestore:', e);
  }
};

export interface BudgetBreakdownResult {
  rule: CostComponentRule;
  percentage: number;
  nominal: number;
  exceedsMax: boolean;
  status: 'valid' | 'warning' | 'disabled';
}

export const calculateBudgetBreakdown = (
  totalPagu: number,
  rules: CostComponentRule[],
  customPercentages?: Record<string, number>
): {
  items: BudgetBreakdownResult[];
  totalAllocated: number;
  remainingPagu: number;
  isOverAllocated: boolean;
  hasWarnings: boolean;
} => {
  if (totalPagu <= 0) {
    return {
      items: [],
      totalAllocated: 0,
      remainingPagu: 0,
      isOverAllocated: false,
      hasWarnings: false
    };
  }

  let totalAllocated = 0;
  let hasWarnings = false;

  const items: BudgetBreakdownResult[] = rules.map(rule => {
    if (!rule.isActive) {
      return {
        rule,
        percentage: 0,
        nominal: 0,
        exceedsMax: false,
        status: 'disabled'
      };
    }

    const appliedPct = customPercentages && customPercentages[rule.id] !== undefined
      ? customPercentages[rule.id]
      : rule.defaultPercentage;

    const nominal = Math.round((appliedPct / 100) * totalPagu);
    const exceedsMax = appliedPct > rule.maxPercentage;

    if (exceedsMax) {
      hasWarnings = true;
    }

    totalAllocated += nominal;

    return {
      rule,
      percentage: appliedPct,
      nominal,
      exceedsMax,
      status: exceedsMax ? 'warning' : 'valid'
    };
  });

  const remainingPagu = totalPagu - totalAllocated;
  const isOverAllocated = remainingPagu < 0;

  return {
    items,
    totalAllocated,
    remainingPagu,
    isOverAllocated,
    hasWarnings
  };
};
