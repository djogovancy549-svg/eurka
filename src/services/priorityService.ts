import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Proposal, PriorityCriteria, PriorityLevel, computePriorityScore, PRIORITY_LEVELS } from '../types';
import { getAccessToken } from '../auth';
import { updateCell } from '../sheetsApi';
import { logSecurityActivity } from './securityService';

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export interface PriorityMap {
  [proposalId: string]: PriorityCriteria;
}

/**
 * Load all stored priority evaluations
 */
export const getAllPriorityEvaluations = async (): Promise<PriorityMap> => {
  let cached: PriorityMap = {};
  try {
    const raw = localStorage.getItem('cached_priority_evaluations');
    if (raw) {
      cached = JSON.parse(raw);
    }
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'priorityEvaluations');
    const docSnap = await withTimeout(getDoc(docRef), 6000, null as any);
    if (docSnap && docSnap.exists() && docSnap.data().evaluations) {
      const remoteData = docSnap.data().evaluations as PriorityMap;
      const merged = { ...cached, ...remoteData };
      localStorage.setItem('cached_priority_evaluations', JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn('Failed to load priority evaluations from Firestore:', e);
  }

  return cached;
};

/**
 * Save / Update priority evaluation for a proposal
 */
export const saveProposalPriority = async (
  proposalId: string,
  criteria: PriorityCriteria,
  userEmail: string,
  userName?: string,
  sheetId?: string,
  rowIndex?: number
): Promise<PriorityMap> => {
  const currentMap = await getAllPriorityEvaluations();
  const updatedMap: PriorityMap = {
    ...currentMap,
    [proposalId]: {
      ...criteria,
      evaluatedBy: userName || userEmail,
      evaluatedAt: new Date().toISOString()
    }
  };

  // 1. Save locally
  try {
    localStorage.setItem('cached_priority_evaluations', JSON.stringify(updatedMap));
  } catch (e) {}

  // 2. Save to Firestore
  try {
    const docRef = doc(db, 'appConfig', 'priorityEvaluations');
    await withTimeout(setDoc(docRef, { evaluations: updatedMap }, { merge: true }), 8000, undefined);
  } catch (e) {
    console.warn('Saved priority evaluation locally, Firestore delayed:', e);
  }

  // 3. Update Google Sheets if sheetId and rowIndex are present (Col Y = Column 25)
  if (sheetId && rowIndex) {
    try {
      const token = await getAccessToken();
      if (token) {
        const payloadStr = JSON.stringify({
          level: criteria.priorityLevel,
          score: criteria.totalScore,
          criteria: {
            u: criteria.urgensiKondisi,
            k: criteria.kesiapanDokumen,
            d: criteria.dampakManfaat,
            r: criteria.keselarasanRpjmd
          }
        });
        await updateCell(token, sheetId, `Proposals!Y${rowIndex}`, payloadStr);
      }
    } catch (sheetErr) {
      console.warn('Could not sync priority to Google Sheets:', sheetErr);
    }
  }

  // 4. Log to Security Audit Trail
  await logSecurityActivity(
    `Penetapan Skala Prioritas [${criteria.priorityLevel} - Skor: ${criteria.totalScore}]`,
    userEmail,
    userName,
    'proposal',
    `Usulan ID: ${proposalId}. Kategori: ${PRIORITY_LEVELS[criteria.priorityLevel].label}. Justifikasi: ${criteria.justifikasiTeknis || 'Standar Verifikasi'}`,
    'SUCCESS'
  );

  return updatedMap;
};

/**
 * Intelligent Auto-Scoring for Proposals based on available parameters
 */
export const calculateAutoScoreForProposal = (prop: Proposal): PriorityCriteria => {
  let urgensi = 3;
  let kesiapan = 3;
  let dampak = 3;
  let rpjmd = 3;

  // 1. Urgensi Kondisi Check
  const justText = ((prop.justification || '') + ' ' + (prop.projectName || '')).toLowerCase();
  if (
    justText.includes('ambruk') ||
    justText.includes('longsor') ||
    justText.includes('putus') ||
    justText.includes('kritis') ||
    justText.includes('darurat') ||
    justText.includes('banjir') ||
    justText.includes('bencana') ||
    justText.includes('jembatan')
  ) {
    urgensi = 5;
  } else if (
    justText.includes('rusak berat') ||
    justText.includes('tergenang') ||
    justText.includes('berlubang') ||
    justText.includes('terancam')
  ) {
    urgensi = 4;
  } else if (justText.includes('pemeliharaan') || justText.includes('rehab')) {
    urgensi = 3;
  } else if (justText.includes('pembangunan baru') || justText.includes('penataan')) {
    urgensi = 2;
  }

  // 2. Kesiapan Dokumen Check
  const reqValues = Object.values(prop.requirementsMet || {});
  const reqTotal = reqValues.length;
  const reqTrueCount = reqValues.filter(Boolean).length;
  const hasDrive = !!(prop.documentFolderUrl && prop.documentFolderUrl.length > 5);
  const hasAttachments = !!(prop.attachments && prop.attachments.length > 0);

  if (reqTrueCount === reqTotal && reqTotal >= 3 && (hasDrive || hasAttachments)) {
    kesiapan = 5;
  } else if (reqTrueCount >= 2 && (hasDrive || hasAttachments)) {
    kesiapan = 4;
  } else if (reqTrueCount >= 1) {
    kesiapan = 3;
  } else {
    kesiapan = 2;
  }

  // 3. Dampak & Manfaat Check
  const isKecamatanMusrenbang = prop.sumberUsulan?.includes('Kecamatan') || prop.sumberUsulan?.includes('POKIR');
  if (
    justText.includes('penghubung antar') ||
    justText.includes('puskesmas') ||
    justText.includes('rumah sakit') ||
    justText.includes('pasar') ||
    justText.includes('irigasi') ||
    justText.includes('air bersih')
  ) {
    dampak = 5;
  } else if (isKecamatanMusrenbang || (prop.estimatedBudget && prop.estimatedBudget > 500000000)) {
    dampak = 4;
  } else {
    dampak = 3;
  }

  // 4. Keselarasan RPJMD
  if (
    justText.includes('stunting') ||
    justText.includes('kemiskinan') ||
    justText.includes('ketahanan pangan') ||
    justText.includes('strategis')
  ) {
    rpjmd = 5;
  } else if (prop.status === 'diterima' || prop.sipdStatus === 'siap_sipd') {
    rpjmd = 4;
  } else {
    rpjmd = 3;
  }

  const { totalScore, level } = computePriorityScore(urgensi, kesiapan, dampak, rpjmd);

  return {
    urgensiKondisi: urgensi,
    kesiapanDokumen: kesiapan,
    dampakManfaat: dampak,
    keselarasanRpjmd: rpjmd,
    totalScore,
    priorityLevel: level,
    justifikasiTeknis: `Penilaian otomatis berbasis indikator kelayakan teknis, berkas dokumen, dan urgensi lapangan.`
  };
};

/**
 * Batch Auto Score Proposals that do not have evaluation yet
 */
export const batchAutoScoreProposals = async (
  proposals: Proposal[],
  userEmail: string,
  userName?: string
): Promise<{ scoredCount: number; updatedMap: PriorityMap }> => {
  const currentMap = await getAllPriorityEvaluations();
  let count = 0;
  const updatedMap = { ...currentMap };

  for (const prop of proposals) {
    if (!updatedMap[prop.id]) {
      const autoScore = calculateAutoScoreForProposal(prop);
      updatedMap[prop.id] = {
        ...autoScore,
        evaluatedBy: `${userName || userEmail} (Auto-Score)`,
        evaluatedAt: new Date().toISOString()
      };
      count++;
    }
  }

  try {
    localStorage.setItem('cached_priority_evaluations', JSON.stringify(updatedMap));
    const docRef = doc(db, 'appConfig', 'priorityEvaluations');
    await withTimeout(setDoc(docRef, { evaluations: updatedMap }, { merge: true }), 8000, undefined);
  } catch (e) {
    console.warn('Batch priority save to Firestore delayed:', e);
  }

  if (count > 0) {
    await logSecurityActivity(
      `Penetapan Skala Prioritas Otomatis Massal (${count} Usulan)`,
      userEmail,
      userName,
      'proposal',
      `Melakukan scoring kriteria objektif massal untuk ${count} usulan masyarakat/POKIR DPUPR.`,
      'SUCCESS'
    );
  }

  return { scoredCount: count, updatedMap };
};
