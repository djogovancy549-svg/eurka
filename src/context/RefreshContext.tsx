import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

type RefreshHandler = () => Promise<void> | void;

interface RefreshContextType {
  refreshKey: number;
  isRefreshing: boolean;
  lastRefreshedAt: Date | null;
  refreshSuccessMsg: string | null;
  triggerRefresh: (customMessage?: string) => Promise<void>;
  registerRefreshHandler: (id: string, handler: RefreshHandler) => void;
  unregisterRefreshHandler: (id: string) => void;
  notifyGlobalSync: () => Promise<void>;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(new Date());
  const [refreshSuccessMsg, setRefreshSuccessMsg] = useState<string | null>(null);
  
  const handlersRef = useRef<Map<string, RefreshHandler>>(new Map());
  const localLastSyncRef = useRef<number>(0);

  const registerRefreshHandler = useCallback((id: string, handler: RefreshHandler) => {
    handlersRef.current.set(id, handler);
  }, []);

  const unregisterRefreshHandler = useCallback((id: string) => {
    handlersRef.current.delete(id);
  }, []);

  const triggerRefresh = useCallback(async (customMessage?: string) => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshSuccessMsg(null);

    const startTime = Date.now();
    try {
      // Execute all registered page/module handlers
      const currentHandlers: RefreshHandler[] = Array.from(handlersRef.current.values());
      if (currentHandlers.length > 0) {
        await Promise.all(
          currentHandlers.map(async (fn: RefreshHandler) => {
            try {
              if (typeof fn === 'function') {
                await fn();
              }
            } catch (err) {
              console.error('Refresh handler error:', err);
            }
          })
        );
      }

      // Ensure at least 400ms for smooth spinning feedback
      const elapsed = Date.now() - startTime;
      if (elapsed < 400) {
        await new Promise((resolve) => setTimeout(resolve, 400 - elapsed));
      }

      setRefreshKey((prev) => prev + 1);
      setLastRefreshedAt(new Date());
      
      const msg = customMessage || 'Data berhasil disegarkan & disinkronkan tanpa reload halaman!';
      setRefreshSuccessMsg(msg);
      setTimeout(() => {
        setRefreshSuccessMsg(null);
      }, 4000);
    } catch (err) {
      console.error('Error during global refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const notifyGlobalSync = useCallback(async () => {
    try {
      const docRef = doc(db, 'appConfig', 'globalSyncState');
      const now = Date.now();
      localLastSyncRef.current = now; // update local ref first to ignore this specific trigger on this current screen
      await setDoc(docRef, { lastUpdated: now });
    } catch (err) {
      console.error('Failed to notify global sync:', err);
    }
  }, []);

  useEffect(() => {
    const docRef = doc(db, 'appConfig', 'globalSyncState');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const serverTimestamp = data?.lastUpdated || 0;
        if (serverTimestamp && serverTimestamp > localLastSyncRef.current) {
          localLastSyncRef.current = serverTimestamp;
          // Trigger local refresh across the current UI
          triggerRefresh('Sistem terdeteksi berubah! Menyegarkan otomatis...');
        }
      }
    }, (error) => {
      console.warn('Real-time global sync listener warning:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [triggerRefresh]);

  return (
    <RefreshContext.Provider
      value={{
        refreshKey,
        isRefreshing,
        lastRefreshedAt,
        refreshSuccessMsg,
        triggerRefresh,
        registerRefreshHandler,
        unregisterRefreshHandler,
        notifyGlobalSync,
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

/**
 * Convenient hook for components/dashboards to register their local data fetchers
 * into the global Refresh action bar.
 */
export function useRegisterRefresh(
  id: string,
  handler: () => Promise<void> | void,
  deps: React.DependencyList = []
) {
  const { registerRefreshHandler, unregisterRefreshHandler } = useRefresh();

  useEffect(() => {
    registerRefreshHandler(id, handler);
    return () => {
      unregisterRefreshHandler(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, registerRefreshHandler, unregisterRefreshHandler, ...deps]);
}
