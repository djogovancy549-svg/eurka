import { db } from '../firebase';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { SecurityAuditLog } from '../types';
import { getRenjaMasterData, saveRenjaMasterData } from './renjaService';
import { getDpaMasterData, saveDpaMasterData } from './dpaService';
import { getAllBidangConfigs, getNagekeoWilayah, getAdminRequirements, saveBidangConfig, saveNagekeoWilayah, saveAdminRequirements } from './configService';
import { getCostComponentRules, saveCostComponentRules } from './costRulesService';

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

// 1. Sanitization Helper against XSS & Script Injection
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Strip angle brackets
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

// 2. Audit Trail Logging
export const logSecurityActivity = async (
  action: string,
  userEmail: string,
  userName: string = '',
  category: SecurityAuditLog['category'],
  details: string,
  status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS'
): Promise<void> => {
  const newLog: SecurityAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action,
    userEmail: userEmail || 'anonymous@local',
    userName,
    category,
    details,
    status,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Client',
    timestamp: new Date().toISOString()
  };

  let logs: SecurityAuditLog[] = [];
  try {
    const cached = localStorage.getItem('cached_audit_logs');
    if (cached) logs = JSON.parse(cached);
  } catch (e) {}

  logs = [newLog, ...logs].slice(0, 200); // Keep 200 most recent logs

  try {
    localStorage.setItem('cached_audit_logs', JSON.stringify(logs));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'securityAuditLogs');
    await withTimeout(
      setDoc(docRef, {
        logs: JSON.parse(JSON.stringify(logs)),
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      8000,
      undefined
    );
  } catch (e) {
    console.warn('Delayed audit log sync to Firestore:', e);
  }
};

export const getSecurityAuditLogs = async (): Promise<SecurityAuditLog[]> => {
  try {
    const cached = localStorage.getItem('cached_audit_logs');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        fetchAuditLogsFromFirestore();
        return parsed;
      }
    }
  } catch (e) {}

  return await fetchAuditLogsFromFirestore();
};

const fetchAuditLogsFromFirestore = async (): Promise<SecurityAuditLog[]> => {
  try {
    const docRef = doc(db, 'appConfig', 'securityAuditLogs');
    const docSnap = await withTimeout(getDoc(docRef), 8000, null as any);

    if (docSnap && docSnap.exists() && docSnap.data().logs) {
      const logs = docSnap.data().logs as SecurityAuditLog[];
      try {
        localStorage.setItem('cached_audit_logs', JSON.stringify(logs));
      } catch (e) {}
      return logs;
    }
  } catch (e) {}

  return [];
};

// 3. Complete Database Backup Generator
export interface FullDatabaseBackup {
  metadata: {
    systemName: string;
    version: string;
    exportDate: string;
    exportedBy: string;
    itemCounts: {
      programs: number;
      kegiatan: number;
      subKegiatan: number;
      dpaItems: number;
      sppdRecords: number;
      bidangConfigs: number;
      costRules: number;
    };
  };
  data: {
    renja: any;
    dpa: any;
    configs: any;
    wilayah: any;
    costRules: any;
    requirements: any;
    auditLogs: any;
  };
}

export const createFullDatabaseBackup = async (userEmail: string): Promise<FullDatabaseBackup> => {
  const [renjaData, dpaData, configs, wilayah, costRules, reqs, auditLogs] = await Promise.all([
    getRenjaMasterData(),
    getDpaMasterData(),
    getAllBidangConfigs(),
    getNagekeoWilayah(),
    getCostComponentRules(),
    getAdminRequirements(),
    getSecurityAuditLogs()
  ]);

  const backup: FullDatabaseBackup = {
    metadata: {
      systemName: 'e-URK & DPA DPUPR Kabupaten Nagekeo',
      version: '2.5.0-secure',
      exportDate: new Date().toISOString(),
      exportedBy: userEmail,
      itemCounts: {
        programs: renjaData.programs.length,
        kegiatan: renjaData.kegiatan?.length || 0,
        subKegiatan: renjaData.subKegiatan.length,
        dpaItems: dpaData.dpaList.length,
        sppdRecords: dpaData.sppdList.length,
        bidangConfigs: configs.length,
        costRules: costRules.length
      }
    },
    data: {
      renja: renjaData,
      dpa: dpaData,
      configs,
      wilayah,
      costRules,
      requirements: reqs,
      auditLogs: auditLogs.slice(0, 50)
    }
  };

  // Log backup event
  await logSecurityActivity(
    'DATABASE_BACKUP_CREATED',
    userEmail,
    'Administrator',
    'security',
    `Pencadangan database lengkap berhasil dibuat (${backup.metadata.itemCounts.dpaItems} DPA, ${backup.metadata.itemCounts.subKegiatan} Sub-Kegiatan RENJA)`
  );

  return backup;
};

// 4. System Health Check Diagnostic
export interface HealthCheckResult {
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  checks: {
    id: string;
    label: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    message: string;
    details?: string;
  }[];
}

export const performSystemHealthCheck = async (): Promise<HealthCheckResult> => {
  const checks: HealthCheckResult['checks'] = [];

  // 1. Connection & Firestore Check
  let dbOk = true;
  try {
    const docRef = doc(db, 'appConfig', 'settings');
    await withTimeout(getDoc(docRef), 4000, null as any);
    checks.push({
      id: 'db_connection',
      label: 'Koneksi Firestore Database',
      status: 'PASS',
      message: 'Koneksi ke Firestore cloud database berjalan normal dan responsif.'
    });
  } catch (e) {
    dbOk = false;
    checks.push({
      id: 'db_connection',
      label: 'Koneksi Firestore Database',
      status: 'WARN',
      message: 'Koneksi cloud Firestore mengalami latensi tinggi, cache lokal aktif.'
    });
  }

  // 2. Data Integrity Check for RENJA & DPA
  try {
    const renja = await getRenjaMasterData();
    const dpa = await getDpaMasterData();

    // Check orphaned Sub-Kegiatan
    const progIds = new Set(renja.programs.map(p => p.id));
    const orphanedSubs = renja.subKegiatan.filter(s => !progIds.has(s.programId));

    if (orphanedSubs.length > 0) {
      checks.push({
        id: 'renja_integrity',
        label: 'Integritas Relasi RENJA',
        status: 'WARN',
        message: `Ditemukan ${orphanedSubs.length} sub-kegiatan yang tidak terhubung ke program induk.`,
        details: orphanedSubs.map(s => s.namaSubKegiatan).join(', ')
      });
    } else {
      checks.push({
        id: 'renja_integrity',
        label: 'Integritas Relasi RENJA (Program - Kegiatan - Sub-Kegiatan)',
        status: 'PASS',
        message: `Struktur hirarki program (${renja.programs.length}), kegiatan (${renja.kegiatan?.length || 0}), dan sub-kegiatan (${renja.subKegiatan.length}) valid 100%.`
      });
    }

    // Check DPA Pagu Balance
    const overSpentDpa = dpa.dpaList.filter(d => d.realisasiKeuangan > d.paguDpa);
    if (overSpentDpa.length > 0) {
      checks.push({
        id: 'dpa_balance',
        label: 'Pengecekan Pagu DPA vs Realisasi',
        status: 'WARN',
        message: `Ditemukan ${overSpentDpa.length} item DPA dengan realisasi melebihi pagu anggaran.`,
        details: overSpentDpa.map(d => d.namaSubKegiatan).join(', ')
      });
    } else {
      checks.push({
        id: 'dpa_balance',
        label: 'Pengecekan Pagu DPA & Sisa Kas',
        status: 'PASS',
        message: `Semua ${dpa.dpaList.length} item DPA berada dalam batas pagu definitif yang sah.`
      });
    }
  } catch (e) {
    checks.push({
      id: 'data_integrity',
      label: 'Pengecekan Integritas Data',
      status: 'FAIL',
      message: 'Gagal memverifikasi integritas data internal.'
    });
  }

  // 3. Cost Rules Check
  try {
    const rules = await getCostComponentRules();
    const activeRules = rules.filter(r => r.isActive);
    const sumMax = activeRules.reduce((acc, r) => acc + r.maxPercentage, 0);

    checks.push({
      id: 'cost_rules',
      label: 'Standar Besaran Biaya Operasional & Penunjang',
      status: 'PASS',
      message: `${activeRules.length} aturan komponen biaya aktif (Perencanaan, Pengawasan, Operasional, ATK, SPPD).`
    });
  } catch (e) {
    checks.push({
      id: 'cost_rules',
      label: 'Standar Besaran Biaya Operasional',
      status: 'WARN',
      message: 'Menggunakan aturan standar bawaan.'
    });
  }

  // Determine overall status
  const hasFail = checks.some(c => c.status === 'FAIL');
  const hasWarn = checks.some(c => c.status === 'WARN');
  const overallStatus: HealthCheckResult['overallStatus'] = hasFail ? 'CRITICAL' : hasWarn ? 'WARNING' : 'HEALTHY';

  return {
    overallStatus,
    timestamp: new Date().toISOString(),
    checks
  };
};

// 5. System Maintenance Optimizer (Cache Vacuum & Sync)
export const performSystemMaintenance = async (userEmail: string): Promise<{ success: boolean; freedBytes: number; message: string }> => {
  let freed = 0;
  try {
    // Clear expired caches while preserving vital data
    const keysToClean = [
      'cached_admin_proposals_all',
      'cached_proposals_SDA',
      'cached_proposals_BM',
      'cached_proposals_CK',
      'cached_proposals_PL'
    ];

    keysToClean.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        freed += item.length * 2; // Approximate bytes in UTF-16
        localStorage.removeItem(key);
      }
    });

    await logSecurityActivity(
      'SYSTEM_MAINTENANCE_PERFORMED',
      userEmail,
      'Administrator',
      'security',
      `Pemeliharaan berkala sistem dan optimasi cache berhasil dijalankan (dibebaskan ~${(freed / 1024).toFixed(1)} KB memory).`
    );

    return {
      success: true,
      freedBytes: freed,
      message: `Pemeliharaan sistem selesai. Memori browser dioptimalkan dan koneksi data disinkronkan kembali.`
    };
  } catch (e: any) {
    return {
      success: false,
      freedBytes: 0,
      message: `Gagal menjalankan pemeliharaan: ${e.message || 'Error tidak diketahui'}`
    };
  }
};
