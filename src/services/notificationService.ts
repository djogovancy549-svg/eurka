import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppNotification } from '../types';

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_welcome',
    title: 'Selamat Datang di e-URK DPUPR Nagekeo',
    message: 'Sistem Informasi e-URK, RENJA, dan DPA DPUPR Nagekeo siap digunakan untuk perencanaan dan monitoring anggaran terintegrasi.',
    type: 'system_info',
    targetRole: 'all',
    readBy: [],
    createdAt: new Date().toISOString()
  }
];

export const getNotifications = async (userEmail: string, isAdmin: boolean): Promise<AppNotification[]> => {
  let cachedNotifs: AppNotification[] = [];

  try {
    const cached = localStorage.getItem('cached_app_notifications');
    if (cached) {
      cachedNotifs = JSON.parse(cached);
    }
  } catch (e) {}

  const fromDb = await fetchFromFirestore();
  const map = new Map<string, AppNotification>();
  (fromDb || []).forEach(n => map.set(n.id, n));
  (cachedNotifs || []).forEach(n => {
    if (!map.has(n.id)) map.set(n.id, n);
  });
  const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  try {
    localStorage.setItem('cached_app_notifications', JSON.stringify(merged));
  } catch (e) {}

  return filterNotifsForUser(merged, userEmail, isAdmin);
};

const filterNotifsForUser = (notifs: AppNotification[], userEmail: string, isAdmin: boolean): AppNotification[] => {
  return notifs
    .filter(n => {
      if (!n) return false;
      if (n.targetRole === 'all') return true;
      if (n.targetRole === 'admin' && isAdmin) return true;
      if (n.targetRole === 'user') return true;
      if (n.targetUserEmail && userEmail && n.targetUserEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const fetchFromFirestore = async (): Promise<AppNotification[]> => {
  try {
    const docRef = doc(db, 'appConfig', 'notifications');
    const docSnap = await withTimeout(getDoc(docRef), 8000, null as any);

    if (docSnap && docSnap.exists() && docSnap.data().items) {
      const items = docSnap.data().items as AppNotification[];
      try {
        localStorage.setItem('cached_app_notifications', JSON.stringify(items));
      } catch (e) {}
      return items;
    }
  } catch (e) {
    console.warn('Failed to load notifications from Firestore:', e);
  }

  try {
    localStorage.setItem('cached_app_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
  } catch (e) {}

  return DEFAULT_NOTIFICATIONS;
};

export const addNotification = async (notif: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'> & { id?: string }): Promise<void> => {
  const newNotif: AppNotification = {
    ...notif,
    id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    readBy: []
  };

  let allNotifs: AppNotification[] = [];
  try {
    const cached = localStorage.getItem('cached_app_notifications');
    if (cached) allNotifs = JSON.parse(cached);
  } catch (e) {}

  // Keep max 100 recent notifications
  allNotifs = [newNotif, ...allNotifs.filter(n => n.id !== newNotif.id)].slice(0, 100);

  try {
    localStorage.setItem('cached_app_notifications', JSON.stringify(allNotifs));
    window.dispatchEvent(new Event('app_notifications_updated'));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'notifications');
    await withTimeout(
      setDoc(docRef, {
        items: JSON.parse(JSON.stringify(allNotifs)),
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      8000,
      undefined
    );
  } catch (e) {
    console.warn('Failed to push notification to Firestore:', e);
  }
};

export const markNotificationAsRead = async (notificationId: string, userEmail: string): Promise<void> => {
  let allNotifs: AppNotification[] = [];
  try {
    const cached = localStorage.getItem('cached_app_notifications');
    if (cached) allNotifs = JSON.parse(cached);
  } catch (e) {}

  allNotifs = allNotifs.map(n => {
    if (n.id === notificationId) {
      const readSet = new Set(n.readBy || []);
      readSet.add(userEmail);
      return { ...n, readBy: Array.from(readSet) };
    }
    return n;
  });

  try {
    localStorage.setItem('cached_app_notifications', JSON.stringify(allNotifs));
    window.dispatchEvent(new Event('app_notifications_updated'));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'notifications');
    await withTimeout(
      setDoc(docRef, {
        items: JSON.parse(JSON.stringify(allNotifs)),
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      8000,
      undefined
    );
  } catch (e) {}
};

export const markAllNotificationsAsRead = async (userEmail: string, isAdmin: boolean): Promise<void> => {
  let allNotifs: AppNotification[] = [];
  try {
    const cached = localStorage.getItem('cached_app_notifications');
    if (cached) allNotifs = JSON.parse(cached);
  } catch (e) {}

  allNotifs = allNotifs.map(n => {
    const isTarget = n.targetRole === 'all' || (n.targetRole === 'admin' && isAdmin) || (n.targetRole === 'user' && !isAdmin) || (n.targetUserEmail === userEmail);
    if (isTarget) {
      const readSet = new Set(n.readBy || []);
      readSet.add(userEmail);
      return { ...n, readBy: Array.from(readSet) };
    }
    return n;
  });

  try {
    localStorage.setItem('cached_app_notifications', JSON.stringify(allNotifs));
    window.dispatchEvent(new Event('app_notifications_updated'));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'notifications');
    await withTimeout(
      setDoc(docRef, {
        items: JSON.parse(JSON.stringify(allNotifs)),
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      8000,
      undefined
    );
  } catch (e) {}
};

export const clearNotifications = async (): Promise<void> => {
  try {
    localStorage.setItem('cached_app_notifications', JSON.stringify([]));
    window.dispatchEvent(new Event('app_notifications_updated'));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'notifications');
    await withTimeout(
      setDoc(docRef, {
        items: [],
        updatedAt: new Date().toISOString()
      }),
      8000,
      undefined
    );
  } catch (e) {}
};
