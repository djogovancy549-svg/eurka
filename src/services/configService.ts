import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { Requirement, BidangConfig, BIDANG_LIST } from '../types';

export const getAdminRequirements = async (): Promise<Requirement[]> => {
  const docRef = doc(db, 'appConfig', 'settings');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().requirements) {
    return docSnap.data().requirements as Requirement[];
  }
  return [];
};

export const saveAdminRequirements = async (requirements: Requirement[]) => {
  const docRef = doc(db, 'appConfig', 'settings');
  await setDoc(docRef, { requirements }, { merge: true });
};

export const getAllBidangConfigs = async (): Promise<BidangConfig[]> => {
  const configs: BidangConfig[] = [];
  const querySnapshot = await getDocs(collection(db, 'bidangConfigs'));
  querySnapshot.forEach((doc) => {
    configs.push(doc.data() as BidangConfig);
  });
  
  // If some are missing, fill them with defaults
  const filledConfigs = BIDANG_LIST.map(id => {
    const existing = configs.find(c => c.id === id);
    if (existing) return existing;
    return {
      id,
      name: id,
      pagu: 0,
      sheetId: '',
      folderUrl: ''
    };
  });
  return filledConfigs;
};

export const saveBidangConfig = async (config: BidangConfig) => {
  const docRef = doc(db, 'bidangConfigs', config.id);
  await setDoc(docRef, config);
};

export const getBidangConfig = async (id: string): Promise<BidangConfig | null> => {
  const docRef = doc(db, 'bidangConfigs', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as BidangConfig;
  }
  return null;
};
