import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { Requirement, BidangConfig, BIDANG_LIST } from '../types';

// Helper to prevent slow Firestore connections from hanging the UI
const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export const getAdminRequirements = async (): Promise<Requirement[]> => {
  // First check localStorage cache
  let cachedReqs: Requirement[] = [];
  try {
    const cached = localStorage.getItem('cached_admin_requirements');
    if (cached) {
      cachedReqs = JSON.parse(cached);
    }
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'settings');
    const docSnap = await withTimeout(getDoc(docRef), 8000, null as any);
    if (docSnap && docSnap.exists() && docSnap.data().requirements) {
      const reqs = docSnap.data().requirements as Requirement[];
      localStorage.setItem('cached_admin_requirements', JSON.stringify(reqs));
      return reqs;
    }
  } catch (e) {
    console.warn('Using cached admin requirements due to slow connection or error:', e);
  }
  return cachedReqs;
};

export const saveAdminRequirements = async (requirements: Requirement[]) => {
  // Save immediately to local cache
  try {
    localStorage.setItem('cached_admin_requirements', JSON.stringify(requirements));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'settings');
    await withTimeout(setDoc(docRef, { requirements }, { merge: true }), 8000, undefined);
  } catch (e) {
    console.warn('Saved requirements locally, Firestore sync delayed:', e);
  }
};

export const getAllBidangConfigs = async (): Promise<BidangConfig[]> => {
  let cachedConfigs: BidangConfig[] = [];
  try {
    const cached = localStorage.getItem('cached_bidang_configs');
    if (cached) {
      cachedConfigs = JSON.parse(cached);
    }
  } catch (e) {}

  const configs: BidangConfig[] = [];
  try {
    const querySnapshot = await withTimeout(
      getDocs(collection(db, 'bidangConfigs')),
      8000,
      null as any
    );
    if (querySnapshot) {
      querySnapshot.forEach((doc) => {
        configs.push(doc.data() as BidangConfig);
      });
      localStorage.setItem('cached_bidang_configs', JSON.stringify(configs));
    }
  } catch (e) {
    console.warn('Using cached bidang configs due to slow connection or error:', e);
  }
  
  // Use Firestore result if non-empty, otherwise fallback to local cache
  const sourceConfigs = configs.length > 0 ? configs : cachedConfigs;

  // If some are missing, fill them with defaults
  const filledConfigs = BIDANG_LIST.map(id => {
    const existing = sourceConfigs.find(c => c.id === id);
    if (existing) return existing;
    return {
      id,
      name: id,
      pagu: 0,
      sheetId: '',
      folderUrl: ''
    };
  });

  try {
    localStorage.setItem('cached_bidang_configs', JSON.stringify(filledConfigs));
  } catch (e) {}

  return filledConfigs;
};

export const saveBidangConfig = async (config: BidangConfig) => {
  // Update local cache immediately so changes reflect instantly
  try {
    const cached = localStorage.getItem('cached_bidang_configs');
    let list: BidangConfig[] = cached ? JSON.parse(cached) : [];
    const index = list.findIndex(c => c.id === config.id);
    if (index >= 0) {
      list[index] = config;
    } else {
      list.push(config);
    }
    localStorage.setItem('cached_bidang_configs', JSON.stringify(list));
  } catch (e) {}

  try {
    const docRef = doc(db, 'bidangConfigs', config.id);
    await withTimeout(setDoc(docRef, config), 8000, undefined);
  } catch (e) {
    console.warn('Saved config locally, Firestore sync delayed:', e);
  }
};

export const getBidangConfig = async (id: string): Promise<BidangConfig | null> => {
  try {
    const cached = localStorage.getItem('cached_bidang_configs');
    if (cached) {
      const list: BidangConfig[] = JSON.parse(cached);
      const found = list.find(c => c.id === id);
      if (found) return found;
    }
  } catch (e) {}

  try {
    const docRef = doc(db, 'bidangConfigs', id);
    const docSnap = await withTimeout(getDoc(docRef), 8000, null as any);
    if (docSnap && docSnap.exists()) {
      return docSnap.data() as BidangConfig;
    }
  } catch (e) {}
  return null;
};

