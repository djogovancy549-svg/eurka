import React, { useState, useEffect } from 'react';
import { 
  Proposal, 
  PriorityCriteria, 
  PriorityLevel, 
  PRIORITY_LEVELS, 
  computePriorityScore 
} from '../types';
import { saveProposalPriority } from '../services/priorityService';
import { formatRupiah } from '../utils';
import { 
  X, 
  Award, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Save, 
  Loader2, 
  Info, 
  Layers, 
  MapPin, 
  DollarSign, 
  ShieldCheck,
  TrendingUp,
  FileText
} from 'lucide-react';

interface PriorityScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  userEmail: string;
  userName: string;
  sheetId?: string;
  onPrioritySaved?: (proposalId: string, criteria: PriorityCriteria) => void;
}

export default function PriorityScoringModal({
  isOpen,
  onClose,
  proposal,
  userEmail,
  userName,
  sheetId,
  onPrioritySaved
}: PriorityScoringModalProps) {
  if (!isOpen || !proposal) return null;

  const existingCrit = proposal.priorityCriteria;

  const [urgensi, setUrgensi] = useState<number>(existingCrit?.urgensiKondisi || 3);
  const [kesiapan, setKesiapan] = useState<number>(existingCrit?.kesiapanDokumen || 3);
  const [dampak, setDampak] = useState<number>(existingCrit?.dampakManfaat || 3);
  const [rpjmd, setRpjmd] = useState<number>(existingCrit?.keselarasanRpjmd || 3);
  const [justifikasi, setJustifikasi] = useState<string>(existingCrit?.justifikasiTeknis || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (proposal) {
      if (proposal.priorityCriteria) {
        setUrgensi(proposal.priorityCriteria.urgensiKondisi || 3);
        setKesiapan(proposal.priorityCriteria.kesiapanDokumen || 3);
        setDampak(proposal.priorityCriteria.dampakManfaat || 3);
        setRpjmd(proposal.priorityCriteria.keselarasanRpjmd || 3);
        setJustifikasi(proposal.priorityCriteria.justifikasiTeknis || '');
      } else {
        // default based on proposal properties
        setUrgensi(3);
        setKesiapan(3);
        setDampak(3);
        setRpjmd(3);
        setJustifikasi('');
      }
    }
  }, [proposal]);

  const { totalScore, level } = computePriorityScore(urgensi, kesiapan, dampak, rpjmd);
  const levelMeta = PRIORITY_LEVELS[level];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const criteria: PriorityCriteria = {
        urgensiKondisi: urgensi,
        kesiapanDokumen: kesiapan,
        dampakManfaat: dampak,
        keselarasanRpjmd: rpjmd,
        totalScore,
        priorityLevel: level,
        justifikasiTeknis: justifikasi.trim(),
        evaluatedBy: userName || userEmail,
        evaluatedAt: new Date().toISOString()
      };

      await saveProposalPriority(
        proposal.id,
        criteria,
        userEmail,
        userName,
        sheetId,
        proposal.rowIndex
      );

      if (onPrioritySaved) {
        onPrioritySaved(proposal.id, criteria);
      }
      onClose();
    } catch (e) {
      console.error('Error saving priority score:', e);
      alert('Gagal menyimpan penilaian skala prioritas');
    } finally {
      setIsSaving(false);
    }
  };

  const getUrgencyDescription = (val: number) => {
    switch (val) {
      case 1: return '1 - Sangat Ringan / Pemeliharaan Rutin';
      case 2: return '2 - Ringan / Peningkatan Non-Darurat';
      case 3: return '3 - Sedang / Mengganggu Kenyamanan & Pelayanan Publik';
      case 4: return '4 - Berat / Menghambat Arus Transportasi & Bahaya';
      case 5: return '5 - Kritis / Darurat Bencana / Akses Terputus / Keselamatan Jiwa';
      default: return '';
    }
  };

  const getReadinessDescription = (val: number) => {
    switch (val) {
      case 1: return '1 - Belum Ada Dokumen Teknis & Lahan Belum Jelas';
      case 2: return '2 - Usulan Baru Awal, Lahan Belum Hibah Resmi';
      case 3: return '3 - Lahan Bebas Masalah, Dokumen DED Sedang Disiapkan';
      case 4: return '4 - Lahan Clear & Clean, Dokumen DED/RAB Lengkap';
      case 5: return '5 - Sangat Lengkap (DED, RAB, HPS, Izin Lingkungan, Hibah Sah)';
      default: return '';
    }
  };

  const getImpactDescription = (val: number) => {
    switch (val) {
      case 1: return '1 - Skala Lingkungan Mikro (< 200 jiwa)';
      case 2: return '2 - Skala Dusun / RT (200 - 500 jiwa)';
      case 3: return '3 - Skala 1 Desa / Kelurahan (500 - 2.000 jiwa)';
      case 4: return '4 - Menghubungkan Antar-Desa / Pusat Ekonomi (2.000 - 5.000 jiwa)';
      case 5: return '5 - Poros Strategis Antar-Kecamatan / Pariwisata / RSUD (> 5.000 jiwa)';
      default: return '';
    }
  };

  const getRpjmdDescription = (val: number) => {
    switch (val) {
      case 1: return '1 - Kurang Selaras / Usulan Tambahan Sekunder';
      case 2: return '2 - Mendukung Kegiatan Reguler Dinas';
      case 3: return '3 - Mendukung Sasaran Renja & Indikator OPD';
      case 4: return '4 - Mendukung Prioritas Daerah & Konektivitas Utama';
      case 5: return '5 - Sangat Prioritas (Kawasan Stunting, Kemiskinan Ekstrem, Bencana, Visi Bupati)';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-bold tracking-wider uppercase border border-blue-400/30">
                  Rubrik Penilaian Objektif
                </span>
                <span className="text-slate-400 text-xs font-semibold">Tahun Anggaran {proposal.tahunUsulan || '2025'}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                Penentuan Skala Prioritas Pelaksanaan
              </h2>
              <p className="text-xs text-slate-300 truncate max-w-lg">
                {proposal.projectName || 'Nama Usulan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Proposal Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[11px]">Lokasi Usulan:</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                {proposal.desa ? `Desa ${proposal.desa}, ` : ''}{proposal.kecamatan ? `Kec. ${proposal.kecamatan}` : proposal.location || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[11px]">Kebutuhan Anggaran:</span>
              <span className="font-extrabold text-blue-700 block mt-0.5">
                {formatRupiah(proposal.estimatedBudget || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[11px]">Sumber Aspirasi:</span>
              <span className="font-bold text-slate-800 block mt-0.5">
                {proposal.sumberUsulan || 'Musrenbang Desa / Kelurahan'}
              </span>
            </div>
          </div>

          {/* Real-time Priority Score Preview Banner */}
          <div className={`p-4.5 rounded-2xl border ${levelMeta.colorClass} shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/90 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center shrink-0">
                <span className="text-2xl font-black leading-none text-slate-900">{totalScore}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">/ 100 Skor</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${levelMeta.badgeClass}`}>
                    {levelMeta.label}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1">
                  {levelMeta.description}
                </p>
                <div className="text-[11px] font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  Rekomendasi Pelaksanaan: <span className="underline decoration-blue-500 font-extrabold">{levelMeta.executionPhase}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Criteria Scoring Sliders */}
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                4 Parameter Penilaian Bobot Kriteria
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Total Bobot: 100%</span>
            </div>

            {/* 1. Urgensi & Kerusakan Fisik (30%) */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold flex items-center justify-center">1</span>
                  Tingkat Urgensi & Kerusakan Lapangan
                </label>
                <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-extrabold">
                  Bobot 30% &bull; Nilai: {urgensi} / 5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Menilai tingkat kedaruratan kerusakan fisik, bahaya keselamatan, atau kelumpuhan akses jalan/jembatan/air.
              </p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setUrgensi(val)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                      urgensi === val
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-102'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Tingkat {val}
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-bold text-red-800 bg-red-50/70 p-2 rounded-xl border border-red-100">
                {getUrgencyDescription(urgensi)}
              </div>
            </div>

            {/* 2. Kesiapan Dokumen & Lahan (25%) */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center">2</span>
                  Kesiapan Dokumen Teknis & Status Lahan (Readiness)
                </label>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-extrabold">
                  Bobot 25% &bull; Nilai: {kesiapan} / 5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Menilai ketersediaan DED, RAB, dokumen lelang, izin lingkungan, dan bebas sengketa lahan / hibah desa.
              </p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setKesiapan(val)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                      kesiapan === val
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-102'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Tingkat {val}
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                {getReadinessDescription(kesiapan)}
              </div>
            </div>

            {/* 3. Penerima Manfaat & Dampak Sosial-Ekonomi (25%) */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center">3</span>
                  Penerima Manfaat & Akses Pelayanan Publik
                </label>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-extrabold">
                  Bobot 25% &bull; Nilai: {dampak} / 5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Menilai jumlah populasi terdampak, konektivitas sentra pertanian, pasar, sekolah, puskesmas, dan pariwisata.
              </p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setDampak(val)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                      dampak === val
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Tingkat {val}
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-bold text-blue-800 bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                {getImpactDescription(dampak)}
              </div>
            </div>

            {/* 4. Keselarasan RPJMD & Isu Strategis Daerah (20%) */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center">4</span>
                  Keselarasan RPJMD & Isu Strategis Kabupaten Nagekeo
                </label>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-extrabold">
                  Bobot 20% &bull; Nilai: {rpjmd} / 5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Menilai keselarasan dengan penanganan stunting, kemiskinan ekstrem, ketahanan pangan/air, dan visi Bupati Nagekeo.
              </p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setRpjmd(val)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                      rpjmd === val
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-102'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Tingkat {val}
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-bold text-purple-800 bg-purple-50/70 p-2 rounded-xl border border-purple-100">
                {getRpjmdDescription(rpjmd)}
              </div>
            </div>
          </div>

          {/* Justifikasi Teknis Tim Verifikator */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Justifikasi Teknis & Catatan Rekomendasi Pelaksanaan:
            </label>
            <textarea
              value={justifikasi}
              onChange={(e) => setJustifikasi(e.target.value)}
              rows={2}
              placeholder="Contoh: Sangat mendesak karena gorong-gorong ambles memutus jalur utama angkutan hasil bumi desa..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Penilai: <span className="font-bold text-slate-800">{userName || userEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Skala Prioritas ({level})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
