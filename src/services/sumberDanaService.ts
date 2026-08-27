import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SumberDanaItem, SUMBER_DANA_LIST } from '../types';

const STORAGE_KEY = 'cached_master_sumber_dana';
const FIRESTORE_DOC_PATH = ['appConfig', 'masterSumberDana'];

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export const DEFAULT_SUMBER_DANA_ITEMS: SumberDanaItem[] = SUMBER_DANA_LIST.map((name, index) => ({
  id: `sd_def_${index + 1}`,
  kodeDana: `5.0.${index + 1}`,
  namaSumberDana: name,
  kategori: name.includes('PAD') || name.includes('Pajak') ? 'PAD (Pendapatan Asli Daerah)' : name.includes('DAK') || name.includes('DAU') || name.includes('DBH') ? 'Transfer Pemerintah Pusat' : name.includes('Provinsi') ? 'Transfer Pemerintah Provinsi' : 'Lainnya / Hibah',
  keterangan: `Nomenklatur baku Sumber Dana APBD SIPD: ${name}`,
  isActive: true,
  updatedAt: new Date().toISOString()
}));

export const getAllSumberDana = async (): Promise<SumberDanaItem[]> => {
  // 1. Try local storage cache
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Try Firestore
  try {
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    const docSnap = await withTimeout(getDoc(docRef), 6000, null as any);
    if (docSnap && docSnap.exists() && docSnap.data().items) {
      const items = docSnap.data().items as SumberDanaItem[];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return items;
    }
  } catch (e) {
    console.warn('Using default Sumber Dana due to slow connection or error:', e);
  }

  // 3. Fallback to default
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUMBER_DANA_ITEMS));
  return DEFAULT_SUMBER_DANA_ITEMS;
};

export const saveAllSumberDana = async (items: SumberDanaItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}

  try {
    const cleanItems = JSON.parse(JSON.stringify(items));
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    await withTimeout(setDoc(docRef, { items: cleanItems }, { merge: true }), 8000, undefined);
  } catch (e) {
    console.warn('Saved Sumber Dana locally, Firestore sync delayed:', e);
  }
};

export const resetToDefaultSumberDana = async (): Promise<SumberDanaItem[]> => {
  await saveAllSumberDana(DEFAULT_SUMBER_DANA_ITEMS);
  return DEFAULT_SUMBER_DANA_ITEMS;
};
