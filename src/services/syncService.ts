import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Triggers a global real-time synchronization signal by updating the timestamp in Firestore.
 * All open browser sessions subscribed to this document will automatically refresh their data.
 */
export async function triggerGlobalSync(): Promise<void> {
  try {
    const docRef = doc(db, 'appConfig', 'globalSyncState');
    await setDoc(docRef, { lastUpdated: Date.now() });
  } catch (e) {
    console.warn('Failed to trigger global sync:', e);
  }
}
