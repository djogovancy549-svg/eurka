import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { RenjaProgram, RenjaKegiatan, RenjaSubKegiatan, Proposal } from '../types';
import { triggerGlobalSync } from './syncService';

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export interface RenjaMasterData {
  programs: RenjaProgram[];
  kegiatan: RenjaKegiatan[];
  subKegiatan: RenjaSubKegiatan[];
}

/**
 * Sanitizes and fixes any misplaced items in masterRenja (e.g. if subKegiatan was saved into kegiatan or vice versa)
 */
export const sanitizeRenjaData = (data: RenjaMasterData): RenjaMasterData => {
  const rawProg = data.programs || [];
  const rawKeg = data.kegiatan || [];
  const rawSub = data.subKegiatan || [];

  const realKeg: RenjaKegiatan[] = [];
  const realSub: RenjaSubKegiatan[] = [];

  // Sort out rawKeg
  rawKeg.forEach((item: any) => {
    if (item.kodeSubKegiatan || item.namaSubKegiatan) {
      realSub.push(item as RenjaSubKegiatan);
    } else {
      realKeg.push(item as RenjaKegiatan);
    }
  });

  // Sort out rawSub
  rawSub.forEach((item: any) => {
    if (item.kodeSubKegiatan || item.namaSubKegiatan) {
      if (!realSub.some(s => s.id === item.id)) {
        realSub.push(item as RenjaSubKegiatan);
      }
    } else if (item.kodeKegiatan || item.namaKegiatan) {
      if (!realKeg.some(k => k.id === item.id)) {
        realKeg.push(item as RenjaKegiatan);
      }
    }
  });

  return {
    programs: rawProg,
    kegiatan: realKeg,
    subKegiatan: realSub
  };
};

export const getRenjaMasterData = async (): Promise<RenjaMasterData> => {
  // 1. Try Firestore first
  try {
    const docRef = doc(db, 'appConfig', 'masterRenja');
    const docSnap = await withTimeout(getDoc(docRef), 4000, null as any);

    if (docSnap && docSnap.exists()) {
      const data = docSnap.data();
      const sanitized = sanitizeRenjaData({
        programs: (data.programs && Array.isArray(data.programs)) ? data.programs : [],
        kegiatan: (data.kegiatan && Array.isArray(data.kegiatan)) ? data.kegiatan : [],
        subKegiatan: (data.subKegiatan && Array.isArray(data.subKegiatan)) ? data.subKegiatan : []
      });

      try {
        localStorage.setItem('cached_renja_programs', JSON.stringify(sanitized.programs));
        localStorage.setItem('cached_renja_kegiatan', JSON.stringify(sanitized.kegiatan));
        localStorage.setItem('cached_renja_subkegiatan', JSON.stringify(sanitized.subKegiatan));
      } catch (e) {}

      return sanitized;
    }
  } catch (e) {
    console.warn('Failed to load RENJA from Firestore:', e);
  }

  // 2. Fallback to local storage cache
  try {
    const rawProg = localStorage.getItem('cached_renja_programs');
    const rawKeg = localStorage.getItem('cached_renja_kegiatan');
    const rawSub = localStorage.getItem('cached_renja_subkegiatan');
    if (rawProg || rawKeg || rawSub) {
      return sanitizeRenjaData({
        programs: rawProg ? JSON.parse(rawProg) : [],
        kegiatan: rawKeg ? JSON.parse(rawKeg) : [],
        subKegiatan: rawSub ? JSON.parse(rawSub) : []
      });
    }
  } catch (e) {}

  return { programs: [], kegiatan: [], subKegiatan: [] };
};

export const subscribeRenjaMasterData = (callback: (data: RenjaMasterData) => void) => {
  try {
    const docRef = doc(db, 'appConfig', 'masterRenja');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const sanitized = sanitizeRenjaData({
          programs: (data.programs && Array.isArray(data.programs)) ? data.programs : [],
          kegiatan: (data.kegiatan && Array.isArray(data.kegiatan)) ? data.kegiatan : [],
          subKegiatan: (data.subKegiatan && Array.isArray(data.subKegiatan)) ? data.subKegiatan : []
        });

        try {
          localStorage.setItem('cached_renja_programs', JSON.stringify(sanitized.programs));
          localStorage.setItem('cached_renja_kegiatan', JSON.stringify(sanitized.kegiatan));
          localStorage.setItem('cached_renja_subkegiatan', JSON.stringify(sanitized.subKegiatan));
        } catch (e) {}

        callback(sanitized);
      }
    }, (err) => {
      console.warn('onSnapshot error for masterRenja:', err);
    });
  } catch (e) {
    return () => {};
  }
};

export const clearAllRenjaData = async (): Promise<void> => {
  try {
    localStorage.removeItem('cached_renja_programs');
    localStorage.removeItem('cached_renja_kegiatan');
    localStorage.removeItem('cached_renja_subkegiatan');
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'masterRenja');
    await withTimeout(
      setDoc(docRef, {
        programs: [],
        kegiatan: [],
        subKegiatan: [],
        updatedAt: new Date().toISOString()
      }),
      8000,
      undefined
    );
  } catch (e) {
    console.warn('Error clearing Firestore RENJA:', e);
  }
};

export const saveRenjaMasterData = async (programs: RenjaProgram[], kegiatan: RenjaKegiatan[], subKegiatan: RenjaSubKegiatan[]) => {
  const sanitized = sanitizeRenjaData({ programs, kegiatan, subKegiatan });

  try {
    localStorage.setItem('cached_renja_programs', JSON.stringify(sanitized.programs));
    localStorage.setItem('cached_renja_kegiatan', JSON.stringify(sanitized.kegiatan));
    localStorage.setItem('cached_renja_subkegiatan', JSON.stringify(sanitized.subKegiatan));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'masterRenja');
    await withTimeout(
      setDoc(docRef, {
        programs: JSON.parse(JSON.stringify(sanitized.programs)),
        kegiatan: JSON.parse(JSON.stringify(sanitized.kegiatan)),
        subKegiatan: JSON.parse(JSON.stringify(sanitized.subKegiatan)),
        updatedAt: new Date().toISOString()
      }),
      8000,
      undefined
    );
    await triggerGlobalSync();
  } catch (e) {
    console.warn('Saved RENJA locally, Firestore sync delayed:', e);
  }
};

export const linkUrkToRenja = async (
  proposal: Proposal,
  subKegiatanId: string,
  renjaData: RenjaMasterData,
  paguAlokasi?: number,
  catatan?: string
): Promise<{ updatedProposal: Proposal; updatedRenja: RenjaMasterData }> => {
  const targetSub = renjaData.subKegiatan.find(s => s.id === subKegiatanId);
  const targetProg = targetSub ? renjaData.programs.find(p => p.id === targetSub.programId) : null;
  const targetKeg = targetSub && targetSub.kegiatanId ? renjaData.kegiatan.find(k => k.id === targetSub.kegiatanId) : null;

  const updatedProposal: Proposal = {
    ...proposal,
    isAkomodirRenja: true,
    renjaSubKegiatanId: subKegiatanId,
    renjaSubKegiatanName: targetSub ? targetSub.namaSubKegiatan : '',
    renjaKegiatanId: targetKeg ? targetKeg.id : targetSub?.kegiatanId,
    renjaKegiatanName: targetKeg ? targetKeg.namaKegiatan : targetSub?.namaKegiatan,
    renjaProgramId: targetProg ? targetProg.id : '',
    renjaProgramName: targetProg ? targetProg.namaProgram : '',
    renjaPaguAlokasi: paguAlokasi !== undefined ? paguAlokasi : (proposal.estimatedBudget || 0),
    catatanAkomodasiRenja: catatan || proposal.catatanAkomodasiRenja || ''
  };

  const updatedSubKegiatan = renjaData.subKegiatan.map(sub => {
    let list = sub.linkedProposalIds ? [...sub.linkedProposalIds] : [];
    if (sub.id === subKegiatanId) {
      if (!list.includes(proposal.id)) list.push(proposal.id);
    } else {
      list = list.filter(id => id !== proposal.id);
    }
    return { ...sub, linkedProposalIds: list };
  });

  const updatedRenja: RenjaMasterData = {
    ...renjaData,
    subKegiatan: updatedSubKegiatan
  };

  await saveRenjaMasterData(updatedRenja.programs, updatedRenja.kegiatan || [], updatedRenja.subKegiatan);

  return { updatedProposal, updatedRenja };
};

export const unlinkUrkFromRenja = async (
  proposal: Proposal,
  renjaData: RenjaMasterData
): Promise<{ updatedProposal: Proposal; updatedRenja: RenjaMasterData }> => {
  const updatedProposal: Proposal = {
    ...proposal,
    isAkomodirRenja: false,
    renjaSubKegiatanId: undefined,
    renjaSubKegiatanName: undefined,
    renjaKegiatanId: undefined,
    renjaKegiatanName: undefined,
    renjaProgramId: undefined,
    renjaProgramName: undefined,
    renjaPaguAlokasi: undefined,
    catatanAkomodasiRenja: undefined
  };

  const updatedSubKegiatan = renjaData.subKegiatan.map(sub => ({
    ...sub,
    linkedProposalIds: sub.linkedProposalIds ? sub.linkedProposalIds.filter(id => id !== proposal.id) : []
  }));

  const updatedRenja: RenjaMasterData = {
    ...renjaData,
    subKegiatan: updatedSubKegiatan
  };

  await saveRenjaMasterData(updatedRenja.programs, updatedRenja.kegiatan || [], updatedRenja.subKegiatan);

  return { updatedProposal, updatedRenja };
};
