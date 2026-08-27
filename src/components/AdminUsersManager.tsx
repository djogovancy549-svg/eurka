import React, { useState, useEffect } from 'react';
import { getDynamicAdminEmails, saveDynamicAdminEmails } from '../services/configService';
import { useRefresh } from '../context/RefreshContext';
import { logSecurityActivity } from '../services/securityService';
import { ADMIN_EMAILS } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle, 
  Loader2, 
  Mail, 
  ShieldCheck,
  AlertTriangle 
} from 'lucide-react';

interface AdminUsersManagerProps {
  userEmail: string;
  isAdmin: boolean;
}

export default function AdminUsersManager({ userEmail, isAdmin }: AdminUsersManagerProps) {
  const { notifyGlobalSync } = useRefresh();
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [newEmail, setNewEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const data = await getDynamicAdminEmails();
      setEmails(data);
    } catch (err) {
      console.error('Gagal mengambil daftar email admin', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const emailToTrim = newEmail.trim().toLowerCase();
    if (!emailToTrim) {
      setErrorMsg('Email tidak boleh kosong.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToTrim)) {
      setErrorMsg('Format email tidak valid.');
      return;
    }

    // Check if already static admin
    if (ADMIN_EMAILS.includes(emailToTrim)) {
      setErrorMsg('Email ini adalah Administrator Utama statis (tidak perlu ditambahkan lagi).');
      return;
    }

    // Check if already in dynamic list
    if (emails.includes(emailToTrim)) {
      setErrorMsg('Email ini sudah terdaftar sebagai Administrator.');
      return;
    }

    // Check limit
    if (emails.length >= 50) {
      setErrorMsg('Batas kuota maksimal Administrator tercapai (maksimal 50 admin).');
      return;
    }

    setIsSaving(true);
    const updatedList = [...emails, emailToTrim];

    try {
      await saveDynamicAdminEmails(updatedList);
      setEmails(updatedList);
      setNewEmail('');
      setSuccessMsg(`Berhasil menambahkan "${emailToTrim}" sebagai Administrator.`);
      
      // Audit Log
      await logSecurityActivity(
        'ADMIN_USER_ADDED',
        userEmail,
        'Administrator',
        'security',
        `Menambahkan email admin baru: ${emailToTrim}`
      );

      // Notify other clients real-time
      await notifyGlobalSync();

      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan email admin ke Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmail = async (emailToDelete: string) => {
    if (!isAdmin) return;

    if (!window.confirm(`Apakah Anda yakin ingin menghapus hak akses Administrator untuk "${emailToDelete}"?`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(true);

    const updatedList = emails.filter(e => e !== emailToDelete);

    try {
      await saveDynamicAdminEmails(updatedList);
      setEmails(updatedList);
      setSuccessMsg(`Berhasil mencabut hak akses Administrator untuk "${emailToDelete}".`);

      // Audit Log
      await logSecurityActivity(
        'ADMIN_USER_REMOVED',
        userEmail,
        'Administrator',
        'security',
        `Mencabut hak akses admin untuk: ${emailToDelete}`
      );

      // Notify other clients real-time
      await notifyGlobalSync();

      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghapus email admin dari Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalRegisteredAdmins = emails.length;
  const quotaPercentage = Math.min((totalRegisteredAdmins / 50) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Overview & Form Card */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 border-b-4 border-b-indigo-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-extrabold text-slate-800">Kelola Akun Administrator</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan email Google pengguna lain untuk diberikan hak akses penuh sebagai Administrator sistem (maksimal 50 admin).
            </p>
          </div>

          {/* Quota Gauge */}
          <div className="bg-indigo-50 px-4 py-2.5 rounded-2xl border border-indigo-100 flex flex-col justify-center min-w-[160px]">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-700 mb-1">
              <span>Kuota Terpakai</span>
              <span>{totalRegisteredAdmins} / 50</span>
            </div>
            <div className="w-full bg-indigo-200/50 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  quotaPercentage > 85 ? 'bg-rose-500' : quotaPercentage > 60 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${quotaPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form to add */}
        {isAdmin ? (
          <form onSubmit={handleAddEmail} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                disabled={isSaving || loading}
                placeholder="Masukkan email Gmail admin baru (contoh: budi@gmail.com)"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving || loading || totalRegisteredAdmins >= 50}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tambah Admin
            </button>
          </form>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-xs flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Hanya Administrator Utama yang diizinkan menambahkan atau mengelola daftar email admin.</span>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs flex gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}
      </div>

      {/* List Card */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Pengguna Berwenang Admin</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-slate-500">Memuat database administrator...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Core Hardcoded Admins */}
            {ADMIN_EMAILS.map((coreEmail, idx) => (
              <div key={`core-${idx}`} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-extrabold text-sm shadow-xs">
                    U
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{coreEmail}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Ditentukan di Sistem (Statis)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3 h-3" /> Administrator Utama
                  </span>
                </div>
              </div>
            ))}

            {/* Dynamic Admins from Firestore */}
            {emails.map((dynamicEmail, idx) => (
              <div key={`dyn-${idx}`} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-extrabold text-sm shadow-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{dynamicEmail}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Terdaftar secara dinamis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3 h-3 text-slate-500" /> Admin Tambahan
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleDeleteEmail(dynamicEmail)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      title="Cabut Akses Admin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {emails.length === 0 && (
              <div className="px-6 py-8 text-center text-xs text-slate-400 font-semibold italic">
                Belum ada administrator tambahan yang didaftarkan.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
