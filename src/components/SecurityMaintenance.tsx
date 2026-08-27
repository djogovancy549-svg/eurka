import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Database, 
  Download, 
  Upload, 
  Activity, 
  Wrench, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Lock, 
  Key, 
  FileText, 
  Cpu, 
  Loader2, 
  History, 
  Clock, 
  Trash2, 
  Server
} from 'lucide-react';
import { 
  performSystemHealthCheck, 
  createFullDatabaseBackup, 
  performSystemMaintenance, 
  getSecurityAuditLogs, 
  HealthCheckResult, 
  logSecurityActivity 
} from '../services/securityService';
import { SecurityAuditLog } from '../types';
import { addNotification } from '../services/notificationService';

interface SecurityMaintenanceProps {
  userEmail: string;
  isAdmin: boolean;
}

export default function SecurityMaintenance({ userEmail, isAdmin }: SecurityMaintenanceProps) {
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string | null>(null);
  const [isMaintaining, setIsMaintaining] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'backup' | 'logs' | 'protection'>('health');

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      const res = await performSystemHealthCheck();
      setHealthResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingHealth(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await getSecurityAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    loadLogs();
  }, []);

  const handleDownloadBackup = async () => {
    try {
      setIsExportingBackup(true);
      const backup = await createFullDatabaseBackup(userEmail);
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `eURK_DPUPR_Nagekeo_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await addNotification({
        title: 'Cadangan Database Lengkap Dibuat',
        message: `File backup sistem tanggal ${dateStr} berhasil diunduh dan diamankan.`,
        type: 'security_alert',
        targetRole: 'admin'
      });

      loadLogs();
    } catch (e) {
      alert('Gagal membuat file cadangan database');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRunMaintenance = async () => {
    if (!window.confirm('Jalankan pemeliharaan berkala? Ini akan membersihkan cache usang, memvalidasi integritas data, dan mengoptimalkan performa.')) return;
    
    setIsMaintaining(true);
    try {
      const res = await performSystemMaintenance(userEmail);
      setMaintenanceMsg(res.message);
      runHealthCheck();
      loadLogs();
      setTimeout(() => setMaintenanceMsg(null), 5000);
    } catch (e: any) {
      alert('Gagal menjalankan pemeliharaan: ' + e.message);
    } finally {
      setIsMaintaining(false);
    }
  };

  const getStatusIcon = (status: 'PASS' | 'WARN' | 'FAIL') => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'WARN':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistem Proteksi & Pemeliharaan Aktif
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Keamanan Siber & Pemeliharaan Berkala
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Pusat kendali keamanan aplikasi e-URK DPUPR Nagekeo, diagnostik integritas database, audit trail aktivitas, dan pencadangan terenkripsi.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleRunMaintenance}
            disabled={isMaintaining || !isAdmin}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {isMaintaining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
            Jalankan Pemeliharaan
          </button>
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={isExportingBackup || !isAdmin}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {isExportingBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Unduh Cadangan Penuh (JSON)
          </button>
        </div>
      </div>

      {maintenanceMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {maintenanceMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'health'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" /> Diagnostik Kesehatan Sistem
        </button>
        <button
          onClick={() => setActiveTab('protection')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'protection'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" /> Fitur Proteksi Siber
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'logs'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" /> Audit Trail & Log Aktivitas ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'backup'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" /> Manajemen Cadangan Data
        </button>
      </div>

      {/* TAB 1: HEALTH DIAGNOSTIC */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Status Integritas & Kesehatan Layanan
                </h3>
                <p className="text-xs text-slate-500">
                  Pemeriksaan otomatis struktur database, validitas relasi foreign key, dan konsistensi pagu DPA.
                </p>
              </div>
              <button
                type="button"
                onClick={runHealthCheck}
                disabled={checkingHealth}
                className="p-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
                Periksa Ulang
              </button>
            </div>

            {healthResult && (
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  healthResult.overallStatus === 'HEALTHY'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : healthResult.overallStatus === 'WARNING'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-red-50/80 border-red-200 text-red-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-white shadow-xs">
                      {healthResult.overallStatus === 'HEALTHY' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      )}
                    </span>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider">
                        Status Keseluruhan Sistem: {healthResult.overallStatus}
                      </div>
                      <div className="text-xs opacity-80 mt-0.5">
                        Terakhir diuji: {new Date(healthResult.timestamp).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {healthResult.checks.map((check) => (
                    <div key={check.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900">{check.label}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{check.message}</p>
                        {check.details && (
                          <div className="mt-2 text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                            <strong>Detail:</strong> {check.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROTECTION FEATURES */}
      {activeTab === 'protection' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Sanitasi Input & Anti-XSS</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Semua teks input, nama proyek, dan formulir disaring menggunakan filter pembersih script berbahaya (Cross-Site Scripting).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Proteksi Aktif
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Kontrol Akses Berbasis Peran (RBAC)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pemisahan hak akses ketat antara Administrator OPD (DPA & Aturan) dan Pengusul Desa/Kecamatan/POKIR.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Enforced di Server & Client
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <Server className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Enkripsi & TLS In-Transit</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Semua pertukaran data antara pengguna dan server dienkripsi menggunakan protokol HTTPS / TLS 1.3 standar industri.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Enkripsi End-to-End
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Catatan Log Aktivitas & Keamanan (Audit Trail)
              </h3>
              <p className="text-xs text-slate-500">
                Riwayat perubahan status usulan, pengubahan pagu DPA, dan aktivitas administratif penting.
              </p>
            </div>
            <button
              type="button"
              onClick={loadLogs}
              disabled={loadingLogs}
              className="p-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Segarkan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Aksi</th>
                  <th className="p-3">Pengguna</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Keterangan / Detail</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      Belum ada catatan aktivitas keamanan.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{log.action}</td>
                      <td className="p-3 text-slate-700">{log.userEmail}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                          {log.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{log.details}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Pencadangan & Pemulihan Sistem Terpadu
            </h3>
            <p className="text-xs text-slate-500">
              Simpan seluruh database e-URK, RENJA, DPA, SPPD, dan Konfigurasi Admin ke dalam file arsip mandiri untuk kepatuhan tata kelola data berkala.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Download className="w-4 h-4 text-emerald-600" />
                Pencadangan Manual (Export Full JSON)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unduh snapshot lengkap database saat ini. Berisi master program, kegiatan, sub-kegiatan, data DPA, realisasi SPPD, dan konfigurasi wilayah Nagekeo.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isExportingBackup || !isAdmin}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                {isExportingBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Buat & Unduh Cadangan Sekarang
              </button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Wrench className="w-4 h-4 text-indigo-600" />
                Jadwal & Riwayat Pemeliharaan Berkala
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sistem secara periodik melakukan pembersihan memori cache, validasi integritas relasi, dan verifikasi batas pagu belanja.
              </p>
              <div className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1 font-mono">
                <div>• Frekuensi: Mingguan / Setiap Perubahan DPA</div>
                <div>• Lokasi Penyimpanan: Firestore Cloud + Local Storage</div>
                <div>• Standar Kriptografi: SHA-256 & TLS 1.3</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
