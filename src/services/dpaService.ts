import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DpaItem, SppdRecord, RenjaSubKegiatan } from '../types';

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export interface DpaMasterData {
  dpaList: DpaItem[];
  sppdList: SppdRecord[];
}

export const getDpaMasterData = async (): Promise<DpaMasterData> => {
  let cachedDpa: DpaItem[] = [];
  let cachedSppd: SppdRecord[] = [];

  try {
    const rawDpa = localStorage.getItem('cached_dpa_items');
    const rawSppd = localStorage.getItem('cached_sppd_records');
    if (rawDpa) cachedDpa = JSON.parse(rawDpa);
    if (rawSppd) cachedSppd = JSON.parse(rawSppd);

    if (cachedDpa.length > 0 || cachedSppd.length > 0) {
      fetchDpaFromFirestore();
      return { dpaList: cachedDpa, sppdList: cachedSppd };
    }
  } catch (e) {}

  return await fetchDpaFromFirestore();
};

const fetchDpaFromFirestore = async (): Promise<DpaMasterData> => {
  try {
    const docRef = doc(db, 'appConfig', 'masterDpa');
    const docSnap = await withTimeout(getDoc(docRef), 8000, null as any);

    if (docSnap && docSnap.exists()) {
      const data = docSnap.data();
      const dpaList: DpaItem[] = Array.isArray(data.dpaList) ? data.dpaList : [];
      const sppdList: SppdRecord[] = Array.isArray(data.sppdList) ? data.sppdList : [];

      try {
        localStorage.setItem('cached_dpa_items', JSON.stringify(dpaList));
        localStorage.setItem('cached_sppd_records', JSON.stringify(sppdList));
      } catch (e) {}

      return { dpaList, sppdList };
    }
  } catch (e) {
    console.warn('Failed to load DPA from Firestore:', e);
  }

  return { dpaList: [], sppdList: [] };
};

export const saveDpaMasterData = async (dpaList: DpaItem[], sppdList: SppdRecord[]): Promise<boolean> => {
  try {
    localStorage.setItem('cached_dpa_items', JSON.stringify(dpaList));
    localStorage.setItem('cached_sppd_records', JSON.stringify(sppdList));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'masterDpa');
    await withTimeout(
      setDoc(docRef, {
        dpaList,
        sppdList,
        updatedAt: new Date().toISOString()
      }),
      10000,
      undefined
    );
    return true;
  } catch (e) {
    console.error('Error saving DPA & SPPD to Firestore:', e);
    return false;
  }
};

/**
 * Import and generate DPA items directly from approved RENJA Sub-Kegiatans
 */
export const importRenjaToDpa = async (
  renjaSubs: RenjaSubKegiatan[],
  existingDpa: DpaItem[],
  existingSppd: SppdRecord[],
  tahunAnggaran: string = '2025'
): Promise<{ addedCount: number; updatedDpa: DpaItem[] }> => {
  const currentMap = new Map(existingDpa.map(d => [d.kodeSubKegiatan, d]));
  let addedCount = 0;

  const updatedDpa = [...existingDpa];

  renjaSubs.forEach(sub => {
    if (!currentMap.has(sub.kodeSubKegiatan)) {
      const newDpaItem: DpaItem = {
        id: `dpa_${sub.id || Math.random().toString(36).substring(2, 9)}`,
        tahun: sub.tahun || tahunAnggaran,
        nomorDpa: `DPA/A.1/1.03.0.00.0.00.01.0000/${sub.kodeSubKegiatan.slice(-2)}/${sub.tahun || tahunAnggaran}`,
        kodeProgram: sub.programId,
        namaProgram: sub.namaSubKegiatan, // default ref
        kodeSubKegiatan: sub.kodeSubKegiatan,
        namaSubKegiatan: sub.namaSubKegiatan,
        bidangPengampu: sub.bidangPengampu,
        sumberDana: sub.sumberDana || 'DAU',
        paguDpa: Number(sub.paguSubKegiatan) || 0,
        paguSppd: Math.round((Number(sub.paguSubKegiatan) || 0) * 0.05), // default 5% estimasi perjalanan dinas
        realisasiKeuangan: 0,
        realisasiFisik: 0,
        targetKinerja: sub.targetVolume ? `${sub.targetVolume} ${sub.satuan || ''}` : '',
        keterangan: `Diimpor dari RENJA OPD (${sub.lokasi || 'Nagekeo'})`,
        updatedAt: new Date().toISOString()
      };
      updatedDpa.push(newDpaItem);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    await saveDpaMasterData(updatedDpa, existingSppd);
  }

  return { addedCount, updatedDpa };
};
