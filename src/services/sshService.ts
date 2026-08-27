import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SshItem } from '../types';
import { SSH_TIK_NAGEKEO } from '../data/sshKominfo';

const STORAGE_KEY = 'cached_master_ssh_items';
const FIRESTORE_DOC_PATH = ['appConfig', 'masterSshItems'];

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export const DEFAULT_SSH_ITEMS: SshItem[] = SSH_TIK_NAGEKEO.map((item, idx) => ({
  ...item,
  kodeSsh: item.id ? item.id.toUpperCase() : `SSH_${idx + 1}`,
  updatedAt: new Date().toISOString()
}));

export const getAllSshItems = async (): Promise<SshItem[]> => {
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
      const items = docSnap.data().items as SshItem[];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return items;
    }
  } catch (e) {
    console.warn('Using default SSH due to slow connection or error:', e);
  }

  // 3. Fallback to default
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SSH_ITEMS));
  return DEFAULT_SSH_ITEMS;
};

export const saveAllSshItems = async (items: SshItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}

  try {
    const cleanItems = JSON.parse(JSON.stringify(items));
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    await withTimeout(setDoc(docRef, { items: cleanItems }, { merge: true }), 8000, undefined);
  } catch (e) {
    console.warn('Saved SSH items locally, Firestore sync delayed:', e);
  }
};

export const resetToDefaultSsh = async (): Promise<SshItem[]> => {
  await saveAllSshItems(DEFAULT_SSH_ITEMS);
  return DEFAULT_SSH_ITEMS;
};
