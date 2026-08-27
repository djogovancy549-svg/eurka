import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { Requirement, BidangConfig, BIDANG_LIST, NON_BIDANG_UNITS } from '../types';
import { DEFAULT_NAGEKEO_WILAYAH, KecamatanDesa } from '../data/nagekeoWilayah';

// Helper to prevent slow Firestore connections from hanging the UI
const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export const getNagekeoWilayah = async (): Promise<KecamatanDesa[]> => {
  try {
    const cached = localStorage.getItem('cached_nagekeo_wilayah');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'masterWilayah');
    const docSnap = await withTimeout(getDoc(docRef), 8000, null as any);
    if (docSnap && docSnap.exists() && docSnap.data().wilayah) {
      const data = docSnap.data().wilayah as KecamatanDesa[];
      localStorage.setItem('cached_nagekeo_wilayah', JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn('Using default wilayah due to slow connection or error:', e);
  }

  localStorage.setItem('cached_nagekeo_wilayah', JSON.stringify(DEFAULT_NAGEKEO_WILAYAH));
  return DEFAULT_NAGEKEO_WILAYAH;
};

export const saveNagekeoWilayah = async (wilayah: KecamatanDesa[]) => {
  try {
    localStorage.setItem('cached_nagekeo_wilayah', JSON.stringify(wilayah));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'masterWilayah');
    await withTimeout(setDoc(docRef, { wilayah }, { merge: true }), 8000, undefined);
  } catch (e) {
    console.warn('Saved wilayah locally, Firestore sync delayed:', e);
  }
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
    const deepClean = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(deepClean).filter(v => v !== undefined);
      } else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj)
            .map(([k, v]) => [k, deepClean(v)])
            .filter(([_, v]) => v !== undefined)
        );
      }
      return obj;
    };
    
    const docRef = doc(db, 'appConfig', 'settings');
    await withTimeout(setDoc(docRef, { requirements: deepClean(requirements) }, { merge: true }), 8000, undefined);
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
  let fetchFailed = false;
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
    } else {
      fetchFailed = true;
    }
  } catch (e) {
    console.warn('Using cached bidang configs due to slow connection or error:', e);
    fetchFailed = true;
  }
  
  // Use Firestore result if fetch succeeded, otherwise fallback to local cache
  const sourceConfigs = fetchFailed ? cachedConfigs : configs;

  // If some are missing, fill them with defaults
  const allUnits = Array.from(new Set([...BIDANG_LIST, ...NON_BIDANG_UNITS]));
  const filledConfigs = allUnits.map(id => {
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
    // Firestore rejects undefined values. JSON stringify/parse is a safe way to clean them.
    const cleanConfig = JSON.parse(JSON.stringify(config));
    
    const docRef = doc(db, 'bidangConfigs', config.id);
    console.log('Attempting to write to:', docRef.path, 'with data:', cleanConfig);
    await withTimeout(setDoc(docRef, cleanConfig), 8000, undefined);
    console.log('Successfully wrote to:', docRef.path);
  } catch (e) {
    console.error('Failed to sync config to Firestore:', e);
    throw e;
  }
};

export const deleteBidangConfig = async (configId: string) => {
  // Update local cache
  try {
    const cached = localStorage.getItem('cached_bidang_configs');
    if (cached) {
      let list: BidangConfig[] = JSON.parse(cached);
      list = list.filter(c => c.id !== configId);
      localStorage.setItem('cached_bidang_configs', JSON.stringify(list));
    }
  } catch (e) {}

  try {
    const docRef = doc(db, 'bidangConfigs', configId);
    await withTimeout(deleteDoc(docRef), 8000, undefined);
  } catch (e) {
    console.error('Failed to delete config from Firestore:', e);
    throw e;
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

export const notifyAdminNewProposal = async () => {
  try {
    const docRef = doc(db, 'appConfig', 'newProposalNotification');
    await setDoc(docRef, { lastUpdated: Date.now() });
  } catch (e) {
    console.error('Failed to notify admin:', e);
  }
};

