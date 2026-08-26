import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { RenjaProgram, RenjaSubKegiatan, DEFAULT_RENJA_PROGRAMS, DEFAULT_RENJA_SUB_KEGIATAN, Proposal } from '../types';

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export interface RenjaMasterData {
  programs: RenjaProgram[];
  subKegiatan: RenjaSubKegiatan[];
}

// Helper to detect and filter out legacy dummy template items
const isDummyData = (programs: RenjaProgram[], subKegiatan: RenjaSubKegiatan[]): boolean => {
  const dummyProgIds = ['prog_sda', 'prog_bm', 'prog_ck_air', 'prog_pl_limbah', 'prog_ck_gedung', 'prog_tr', 'prog_sekretariat'];
  return programs.some(p => dummyProgIds.includes(p.id)) || subKegiatan.some(s => s.id.startsWith('sub_sda_') || s.id.startsWith('sub_bm_'));
};

export const getRenjaMasterData = async (): Promise<RenjaMasterData> => {
  // Check local storage cache first
  let cachedPrograms: RenjaProgram[] = [];
  let cachedSubKegiatan: RenjaSubKegiatan[] = [];

  try {
    const rawProg = localStorage.getItem('cached_renja_programs');
    const rawSub = localStorage.getItem('cached_renja_subkegiatan');
    if (rawProg) cachedPrograms = JSON.parse(rawProg);
    if (rawSub) cachedSubKegiatan = JSON.parse(rawSub);

    // If cache has old dummy data, clear it immediately
    if (isDummyData(cachedPrograms, cachedSubKegiatan)) {
      cachedPrograms = [];
      cachedSubKegiatan = [];
      localStorage.removeItem('cached_renja_programs');
      localStorage.removeItem('cached_renja_subkegiatan');
      // Overwrite firestore dummy data with empty array
      await saveRenjaMasterData([], []);
      return { programs: [], subKegiatan: [] };
    }

    if (cachedPrograms.length > 0 || cachedSubKegiatan.length > 0) {
      // Async refresh from Firestore in background
      fetchFromFirestore();
      return { programs: cachedPrograms, subKegiatan: cachedSubKegiatan };
    }
  } catch (e) {}

  return await fetchFromFirestore();
};

const fetchFromFirestore = async (): Promise<RenjaMasterData> => {
  try {
    const docRef = doc(db, 'appConfig', 'masterRenja');
    const docSnap = await withTimeout(getDoc(docRef), 8000, null as any);

    if (docSnap && docSnap.exists()) {
      const data = docSnap.data();
      let programs: RenjaProgram[] = (data.programs && Array.isArray(data.programs)) ? data.programs : [];
      let subKegiatan: RenjaSubKegiatan[] = (data.subKegiatan && Array.isArray(data.subKegiatan)) ? data.subKegiatan : [];

      if (isDummyData(programs, subKegiatan)) {
        programs = [];
        subKegiatan = [];
        await saveRenjaMasterData([], []);
      }

      try {
        localStorage.setItem('cached_renja_programs', JSON.stringify(programs));
        localStorage.setItem('cached_renja_subkegiatan', JSON.stringify(subKegiatan));
      } catch (e) {}

      return { programs, subKegiatan };
    }
  } catch (e) {
    console.warn('Failed to load RENJA from Firestore:', e);
  }

  try {
    localStorage.setItem('cached_renja_programs', JSON.stringify([]));
    localStorage.setItem('cached_renja_subkegiatan', JSON.stringify([]));
  } catch (e) {}

  return { programs: [], subKegiatan: [] };
};

export const clearAllRenjaData = async (): Promise<void> => {
  try {
    localStorage.removeItem('cached_renja_programs');
    localStorage.removeItem('cached_renja_subkegiatan');
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'masterRenja');
    await withTimeout(
      setDoc(docRef, {
        programs: [],
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

export const saveRenjaMasterData = async (programs: RenjaProgram[], subKegiatan: RenjaSubKegiatan[]) => {
  try {
    localStorage.setItem('cached_renja_programs', JSON.stringify(programs));
    localStorage.setItem('cached_renja_subkegiatan', JSON.stringify(subKegiatan));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'masterRenja');
    await withTimeout(
      setDoc(docRef, {
        programs: JSON.parse(JSON.stringify(programs)),
        subKegiatan: JSON.parse(JSON.stringify(subKegiatan)),
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      8000,
      undefined
    );
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

  const updatedProposal: Proposal = {
    ...proposal,
    isAkomodirRenja: true,
    renjaSubKegiatanId: subKegiatanId,
    renjaSubKegiatanName: targetSub ? targetSub.namaSubKegiatan : '',
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

  await saveRenjaMasterData(updatedRenja.programs, updatedRenja.subKegiatan);

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

  await saveRenjaMasterData(updatedRenja.programs, updatedRenja.subKegiatan);

  return { updatedProposal, updatedRenja };
};
