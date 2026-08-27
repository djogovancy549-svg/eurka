import React, { useState, useEffect } from 'react';
import { 
  Proposal, 
  RenjaProgram, 
  RenjaSubKegiatan, 
  PriorityLevel, 
  PriorityCriteria, 
  PRIORITY_LEVELS 
} from '../types';
import { 
  getRenjaMasterData, 
  linkUrkToRenja, 
  unlinkUrkFromRenja, 
  RenjaMasterData 
} from '../services/renjaService';
import { getAllBidangConfigs, getNagekeoWilayah } from '../services/configService';
import { getProposalsByBidang } from '../services/proposalService';
import { 
  getAllPriorityEvaluations, 
  batchAutoScoreProposals, 
  saveProposalPriority 
} from '../services/priorityService';
import { KecamatanDesa } from '../data/nagekeoWilayah';
import { 
  formatRupiah, 
  printMatriksUrkRenja, 
  printRekapitulasiPrioritas, 
  exportCsvPrioritas 
} from '../utils';
import PriorityScoringModal from './PriorityScoringModal';
import { useRegisterRefresh } from '../context/RefreshContext';
import RefreshButton from './RefreshButton';
import { 
  GitMerge, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Link as LinkIcon, 
  Unlink, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  X, 
  Building2, 
  FileSpreadsheet, 
  CheckCircle,
  AlertTriangle,
  Layers,
  Sparkles,
  Award,
  Sliders,
  TrendingUp,
  MapPin,
  Calendar,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';

interface UrkRenjaMatrixProps {
  userEmail: string;
  userName: string;
  isAdmin?: boolean;
}

export default function UrkRenjaMatrix({ userEmail, userName, isAdmin = true }: UrkRenjaMatrixProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'priority'>('priority');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [renjaData, setRenjaData] = useState<RenjaMasterData>({ programs: [], kegiatan: [], subKegiatan: [] });
  const [wilayahList, setWilayahList] = useState<KecamatanDesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoScoring, setIsAutoScoring] = useState(false);
  const [autoScoreSuccessMsg, setAutoScoreSuccessMsg] = useState<string | null>(null);

  // Filters for Matrix & Priority
  const [selectedSumber, setSelectedSumber] = useState<string>('Semua');
  const [selectedAkomodasi, setSelectedAkomodasi] = useState<string>('Semua'); // 'Semua' | 'terakomodir' | 'belum'
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua');
  const [selectedPriorityLevel, setSelectedPriorityLevel] = useState<string>('Semua'); // 'Semua' | 'P1' | 'P2' | 'P3' | 'P4' | 'unscored'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Link/Edit to RENJA
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [targetSubId, setTargetSubId] = useState<string>('');
  const [alokasiBudget, setAlokasiBudget] = useState<number>(0);
  const [catatanAkomodasi, setCatatanAkomodasi] = useState<string>('');

  // Modal State for Priority Scoring
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [scoringProposal, setScoringProposal] = useState<Proposal | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [renjaRes, configs, wilayah, priorityEvaluations] = await Promise.all([
        getRenjaMasterData(),
        getAllBidangConfigs(),
        getNagekeoWilayah(),
        getAllPriorityEvaluations()
      ]);

      setRenjaData(renjaRes);
      setWilayahList(wilayah);

      const allProps: Proposal[] = [];
      await Promise.all(
        configs.map(async (cfg) => {
          try {
            const props = await getProposalsByBidang(cfg.id, cfg.sheetId);
            allProps.push(...props);
          } catch (e) {}
        })
      );

      // Merge latest priority evaluations
      const mergedWithPriority = allProps.map(p => {
        const evalData = priorityEvaluations[p.id];
        if (evalData) {
          return {
            ...p,
            priorityLevel: evalData.priorityLevel,
            priorityScore: evalData.totalScore,
            priorityCriteria: evalData
          };
        }
        return p;
      });

      setProposals(mergedWithPriority);
    } catch (e) {
      console.error('Error loading Matrix/Priority data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Register with global refresh button in top navigation bar
  useRegisterRefresh('urk-renja-matrix', loadData);

  const openLinkModal = (prop: Proposal) => {
    setSelectedProposal(prop);
    setTargetSubId(prop.renjaSubKegiatanId || '');
    setAlokasiBudget(prop.renjaPaguAlokasi || prop.estimatedBudget || 0);
    setCatatanAkomodasi(prop.catatanAkomodasiRenja || '');
    setIsLinkModalOpen(true);
  };

  const handleSaveLinkage = async () => {
    if (!selectedProposal || !targetSubId) return;

    const { updatedProposal, updatedRenja } = await linkUrkToRenja(
      selectedProposal,
      targetSubId,
      renjaData,
      alokasiBudget,
      catatanAkomodasi
    );

    setRenjaData(updatedRenja);
    setProposals(prev => prev.map(p => p.id === updatedProposal.id ? updatedProposal : p));
    setIsLinkModalOpen(false);
  };

  const handleUnlink = async (prop: Proposal) => {
    if (!window.confirm(`Lepaskan usulan "${prop.projectName}" dari RENJA OPD?`)) return;

    const { updatedProposal, updatedRenja } = await unlinkUrkFromRenja(prop, renjaData);
    setRenjaData(updatedRenja);
    setProposals(prev => prev.map(p => p.id === updatedProposal.id ? updatedProposal : p));
  };

  const openPriorityModal = (prop: Proposal) => {
    setScoringProposal(prop);
    setIsPriorityModalOpen(true);
  };

  const handlePrioritySaved = (proposalId: string, criteria: PriorityCriteria) => {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          priorityLevel: criteria.priorityLevel,
          priorityScore: criteria.totalScore,
          priorityCriteria: criteria
        };
      }
      return p;
    }));
  };

  const handleBatchAutoScore = async () => {
    setIsAutoScoring(true);
    try {
      const { scoredCount, updatedMap } = await batchAutoScoreProposals(
        proposals,
        userEmail,
        userName
      );

      // Re-map proposals
      setProposals(prev => prev.map(p => {
        const evalData = updatedMap[p.id];
        if (evalData) {
          return {
            ...p,
            priorityLevel: evalData.priorityLevel,
            priorityScore: evalData.totalScore,
            priorityCriteria: evalData
          };
        }
        return p;
      }));

      setAutoScoreSuccessMsg(`Berhasil melakukan scoring otomatis objektif untuk ${scoredCount} usulan!`);
      setTimeout(() => setAutoScoreSuccessMsg(null), 4000);
    } catch (e) {
      console.error('Batch auto-score error:', e);
      alert('Gagal menjalankan scoring otomatis');
    } finally {
      setIsAutoScoring(false);
    }
  };

  // Filtered proposals
  const filteredProposals = proposals.filter(p => {
    if (selectedSumber !== 'Semua') {
      const src = p.sumberUsulan || p.jenisUsulan || '';
      if (!src.toLowerCase().includes(selectedSumber.toLowerCase())) return false;
    }

    if (activeTab === 'matrix') {
      if (selectedAkomodasi === 'terakomodir' && !p.isAkomodirRenja) return false;
      if (selectedAkomodasi === 'belum' && p.isAkomodirRenja) return false;
    }

    if (activeTab === 'priority') {
      if (selectedPriorityLevel !== 'Semua') {
        if (selectedPriorityLevel === 'unscored') {
          if (p.priorityScore !== undefined && p.priorityScore !== null) return false;
        } else if (p.priorityLevel !== selectedPriorityLevel) {
          return false;
        }
      }
    }

    if (selectedKecamatan !== 'Semua' && p.kecamatan !== selectedKecamatan) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.projectName || '').toLowerCase().includes(q);
      const matchLoc = (p.location || '').toLowerCase().includes(q);
      const matchDesa = (p.desa || '').toLowerCase().includes(q);
      const matchKec = (p.kecamatan || '').toLowerCase().includes(q);
      const matchProg = (p.renjaProgramName || '').toLowerCase().includes(q);
      const matchSub = (p.renjaSubKegiatanName || '').toLowerCase().includes(q);
      return matchName || matchLoc || matchDesa || matchKec || matchProg || matchSub;
    }

    return true;
  });

  // Sorted by priority score descending for Priority tab
  const rankedProposals = [...filteredProposals].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  // Analytics Metrics
  const totalCount = proposals.length;
  const linkedCount = proposals.filter(p => p.isAkomodirRenja).length;
  const unlinkedCount = totalCount - linkedCount;
  const percentAccommodated = totalCount > 0 ? Math.round((linkedCount / totalCount) * 100) : 0;

  const totalUrkBudget = proposals.reduce((a, b) => a + (b.estimatedBudget || 0), 0);
  const totalAccommodatedBudget = proposals
    .filter(p => p.isAkomodirRenja)
    .reduce((a, b) => a + (b.renjaPaguAlokasi || b.estimatedBudget || 0), 0);

  // Priority specific counts & budgets
  const countP1 = proposals.filter(p => p.priorityLevel === 'P1').length;
  const budgetP1 = proposals.filter(p => p.priorityLevel === 'P1').reduce((a, b) => a + (b.estimatedBudget || 0), 0);

  const countP2 = proposals.filter(p => p.priorityLevel === 'P2').length;
  const budgetP2 = proposals.filter(p => p.priorityLevel === 'P2').reduce((a, b) => a + (b.estimatedBudget || 0), 0);

  const countP3 = proposals.filter(p => p.priorityLevel === 'P3').length;
  const budgetP3 = proposals.filter(p => p.priorityLevel === 'P3').reduce((a, b) => a + (b.estimatedBudget || 0), 0);

  const countP4 = proposals.filter(p => p.priorityLevel === 'P4' || !p.priorityLevel).length;
  const budgetP4 = proposals.filter(p => p.priorityLevel === 'P4' || !p.priorityLevel).reduce((a, b) => a + (b.estimatedBudget || 0), 0);

  const countScored = proposals.filter(p => p.priorityScore !== undefined && p.priorityScore !== null).length;

  return (
    <div className="space-y-6">
      {/* View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('priority')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'priority'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-blue-600" />
            <span>Skala Prioritas & Indikator Pelaksanaan</span>
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] rounded-full font-black">
              {proposals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'matrix'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitMerge className="w-4 h-4 text-teal-600" />
            <span>Matriks Penyelarasan URK ↔ RENJA</span>
            <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] rounded-full font-black">
              {linkedCount}/{totalCount}
            </span>
          </button>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <RefreshButton variant="compact" label="Segarkan" />
          {activeTab === 'priority' ? (
            <>
              {isAdmin && (
                <button
                  onClick={handleBatchAutoScore}
                  disabled={isAutoScoring}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  title="Otomatis beri skor penilaian objektif untuk semua usulan yang belum dinilai"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  {isAutoScoring ? 'Menilai...' : 'Auto-Score Massal'}
                </button>
              )}
              <button
                onClick={() => exportCsvPrioritas(proposals)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={() => printRekapitulasiPrioritas(proposals)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Skala Prioritas
              </button>
            </>
          ) : (
            <button
              onClick={() => printMatriksUrkRenja(filteredProposals, selectedSumber !== 'Semua' ? `Sumber: ${selectedSumber}` : 'Semua Sumber Usulan')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Matriks Penyelarasan
            </button>
          )}
        </div>
      </div>

      {autoScoreSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {autoScoreSuccessMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: SKALA PRIORITAS & INDIKATOR PELAKSANAAN (NEW CORE FEATURE)       */}
      {/* ========================================================================= */}
      {activeTab === 'priority' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold uppercase tracking-wider border border-blue-400/30">
                <Award className="w-3.5 h-3.5" /> Indikator & Urutan Pelaksanaan Pembangunan
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Penentuan Skala Prioritas Usulan (e-URK DPUPR Nagekeo)
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                Membantu Kepala Dinas dan Tim Anggaran Pemerintah Daerah (TAPD) menentukan 
                <strong> urutan pelaksanaan usulan mana yang harus terlebih dahulu dikerjakan</strong> berdasarkan 
                4 parameter objektif: Tingkat Kedaruratan/Urgensi (30%), Kesiapan Dokumen/Lahan (25%), Dampak Sosio-Ekonomi (25%), dan Keselarasan RPJMD (20%).
              </p>
            </div>
          </div>

          {/* 4 Priority Classification Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* P1 */}
            <div className="bg-white rounded-2xl p-4.5 border border-red-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-black border border-red-300">
                    Prioritas 1 (Utama)
                  </span>
                  <span className="text-[10px] font-bold text-red-600">Skor 80 - 100</span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {countP1} <span className="text-xs font-semibold text-slate-500">Usulan</span>
                </div>
                <div className="text-xs font-extrabold text-red-700 mt-0.5">
                  {formatRupiah(budgetP1)}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-red-100 text-[10px] font-bold text-red-900 flex items-center gap-1">
                <Zap className="w-3 h-3 text-red-600" />
                Tahap 1: Wajib Masuk DPA Murni
              </div>
            </div>

            {/* P2 */}
            <div className="bg-white rounded-2xl p-4.5 border border-amber-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black border border-amber-300">
                    Prioritas 2 (Tinggi)
                  </span>
                  <span className="text-[10px] font-bold text-amber-600">Skor 65 - 79</span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {countP2} <span className="text-xs font-semibold text-slate-500">Usulan</span>
                </div>
                <div className="text-xs font-extrabold text-amber-700 mt-0.5">
                  {formatRupiah(budgetP2)}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-amber-100 text-[10px] font-bold text-amber-900 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-600" />
                Tahap 2: DPA Induk Definitif
              </div>
            </div>

            {/* P3 */}
            <div className="bg-white rounded-2xl p-4.5 border border-blue-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black border border-blue-300">
                    Prioritas 3 (Sedang)
                  </span>
                  <span className="text-[10px] font-bold text-blue-600">Skor 50 - 64</span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {countP3} <span className="text-xs font-semibold text-slate-500">Usulan</span>
                </div>
                <div className="text-xs font-extrabold text-blue-700 mt-0.5">
                  {formatRupiah(budgetP3)}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-blue-100 text-[10px] font-bold text-blue-900 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />
                Tahap 3: Pelaksanaan Reguler
              </div>
            </div>

            {/* P4 */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300">
                    Prioritas 4 (Cadangan)
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Skor &lt; 50</span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {countP4} <span className="text-xs font-semibold text-slate-500">Usulan</span>
                </div>
                <div className="text-xs font-extrabold text-slate-700 mt-0.5">
                  {formatRupiah(budgetP4)}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Tahap 4: Backlog / Perubahan APBD
              </div>
            </div>
          </div>

          {/* Filter Bar for Priority Table */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Priority Filter */}
              <select
                value={selectedPriorityLevel}
                onChange={e => setSelectedPriorityLevel(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Skala Prioritas ({totalCount})</option>
                <option value="P1">Prioritas 1 - Utama ({countP1})</option>
                <option value="P2">Prioritas 2 - Tinggi ({countP2})</option>
                <option value="P3">Prioritas 3 - Sedang ({countP3})</option>
                <option value="P4">Prioritas 4 - Cadangan ({countP4})</option>
                <option value="unscored">Belum Dinilai ({totalCount - countScored})</option>
              </select>

              {/* Sumber Usulan Filter */}
              <select
                value={selectedSumber}
                onChange={e => setSelectedSumber(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Sumber Usulan</option>
                <option value="Musrenbang Desa">Musrenbang Desa</option>
                <option value="Musrenbang Kecamatan">Musrenbang Kecamatan</option>
                <option value="POKIR">POKIR DPRD</option>
                <option value="RENJA">RENJA Dinas</option>
              </select>

              {/* Kecamatan Filter */}
              <select
                value={selectedKecamatan}
                onChange={e => setSelectedKecamatan(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Kecamatan</option>
                {wilayahList.map(w => (
                  <option key={w.kecamatan} value={w.kecamatan}>{w.kecamatan}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Usulan, Desa, Lokasi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority Ranking Table */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="font-semibold text-sm">Menghitung Skala Prioritas Usulan...</p>
            </div>
          ) : rankedProposals.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Tidak ada data usulan sesuai kriteria filter</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian di atas.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="p-3.5 w-12 text-center">Rank</th>
                      <th className="p-3.5 w-36 text-center">Skala Prioritas</th>
                      <th className="p-3.5 w-24 text-center">Total Skor</th>
                      <th className="p-3.5">Nama Usulan & Lokasi</th>
                      <th className="p-3.5 w-32 text-right">Kebutuhan Biaya</th>
                      <th className="p-3.5 w-44">4 Parameter Kriteria</th>
                      <th className="p-3.5 w-40">Indikator Pelaksanaan</th>
                      <th className="p-3.5 w-28 text-center">Aksi Verifikator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankedProposals.map((prop, idx) => {
                      const pLevel = prop.priorityLevel || 'P4';
                      const meta = PRIORITY_LEVELS[pLevel];
                      const c = prop.priorityCriteria;
                      const hasEvaluation = prop.priorityScore !== undefined && prop.priorityScore !== null;

                      return (
                        <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Rank */}
                          <td className="p-3.5 align-middle text-center font-black text-slate-700">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                              idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              idx === 1 ? 'bg-slate-200 text-slate-800' :
                              idx === 2 ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              #{idx + 1}
                            </span>
                          </td>

                          {/* Priority Badge */}
                          <td className="p-3.5 align-middle text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${meta.badgeClass} shadow-2xs`}>
                              <Award className="w-3 h-3" />
                              {meta.shortLabel}
                            </span>
                          </td>

                          {/* Total Score */}
                          <td className="p-3.5 align-middle text-center">
                            {hasEvaluation ? (
                              <div>
                                <div className="text-base font-black text-slate-900 font-mono">
                                  {prop.priorityScore}
                                </div>
                                <div className="w-16 bg-slate-200 h-1.5 rounded-full mx-auto mt-0.5 overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      pLevel === 'P1' ? 'bg-red-500' :
                                      pLevel === 'P2' ? 'bg-amber-500' :
                                      pLevel === 'P3' ? 'bg-blue-500' : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${prop.priorityScore || 0}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold italic">Belum Dinilai</span>
                            )}
                          </td>

                          {/* Usulan & Lokasi */}
                          <td className="p-3.5 align-top">
                            <div className="font-extrabold text-slate-900 text-sm">{prop.projectName}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">
                              {prop.justification || '-'}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-500" />
                                {prop.desa ? `${prop.desa}, ` : ''}{prop.kecamatan || prop.location || '-'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                                {prop.sumberUsulan || 'URK'}
                              </span>
                              {prop.isAkomodirRenja && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" /> Masuk RENJA
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Pagu Kebutuhan */}
                          <td className="p-3.5 align-top text-right font-extrabold text-slate-900">
                            <div className="text-sm font-black text-slate-900">
                              {formatRupiah(prop.estimatedBudget || 0)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              T.A. {prop.tahunUsulan || '2025'}
                            </div>
                          </td>

                          {/* 4 Parameter Breakdown */}
                          <td className="p-3.5 align-top">
                            {c ? (
                              <div className="grid grid-cols-2 gap-1 text-[10px]">
                                <span className="bg-red-50 text-red-800 px-1.5 py-0.5 rounded font-semibold">
                                  Urgensi: <strong>{c.urgensiKondisi}/5</strong>
                                </span>
                                <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                                  Kesiapan: <strong>{c.kesiapanDokumen}/5</strong>
                                </span>
                                <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                                  Dampak: <strong>{c.dampakManfaat}/5</strong>
                                </span>
                                <span className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                                  RPJMD: <strong>{c.keselarasanRpjmd}/5</strong>
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Standar Default</span>
                            )}
                          </td>

                          {/* Indikator Pelaksanaan */}
                          <td className="p-3.5 align-top">
                            <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              {meta.executionPhase}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                              {c?.justifikasiTeknis || meta.description}
                            </p>
                          </td>

                          {/* Aksi Verifikator */}
                          <td className="p-3.5 align-middle text-center">
                            <button
                              onClick={() => openPriorityModal(prop)}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs border border-blue-200 transition-all shadow-2xs"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              {hasEvaluation ? 'Ubah Skor' : 'Beri Nilai'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: MATRIKS PENYELARASAN URK ↔ RENJA OPD                              */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider border border-teal-400/30">
                  <GitMerge className="w-3.5 h-3.5" /> Matriks Penyelarasan Aspirasi & Dokumen Dinas
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Matriks Keterkaitan e-URK ↔ RENJA OPD
                </h1>
                <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                  Memastikan usulan aspirasi dari Musrenbang Desa, Musrenbang Kecamatan, dan Pokir DPRD 
                  diselaraskan dan terpetakan ke dalam Program dan Sub-Kegiatan resmi Dinas PUPR.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => printMatriksUrkRenja(filteredProposals, selectedSumber !== 'Semua' ? `Sumber: ${selectedSumber}` : 'Semua Sumber Usulan')}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border border-white/20 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Cetak Matriks Penyelarasan
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Tingkat Akomodasi URK ke RENJA</span>
                  <span className="text-emerald-600">{percentAccommodated}%</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">
                  {linkedCount} <span className="text-sm font-medium text-slate-500">dari {totalCount} Usulan</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${percentAccommodated}%` }} 
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span>Terakomodir: <strong className="text-emerald-700">{linkedCount}</strong></span>
                <span>Belum Terakomodir: <strong className="text-amber-600">{unlinkedCount}</strong></span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Penyelarasan Anggaran</span>
                <div className="text-2xl font-extrabold text-indigo-950 mt-2">
                  {formatRupiah(totalAccommodatedBudget)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Dari total usulan Rp {formatRupiah(totalUrkBudget)}
                </p>
              </div>
              <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span>Terserap di Renja:</span>
                <strong className="text-indigo-700">
                  {totalUrkBudget > 0 ? `${((totalAccommodatedBudget / totalUrkBudget) * 100).toFixed(1)}%` : '0%'}
                </strong>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rasio Per Sumber Usulan</span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Musrenbang (Desa/Kec):</span>
                  <span className="font-bold text-slate-900">
                    {proposals.filter(p => (p.sumberUsulan || '').includes('Musrenbang') && p.isAkomodirRenja).length}/{proposals.filter(p => (p.sumberUsulan || '').includes('Musrenbang')).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">POKIR DPRD:</span>
                  <span className="font-bold text-slate-900">
                    {proposals.filter(p => (p.sumberUsulan || '').includes('POKIR') && p.isAkomodirRenja).length}/{proposals.filter(p => (p.sumberUsulan || '').includes('POKIR')).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedSumber}
                onChange={e => setSelectedSumber(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Sumber Usulan</option>
                <option value="Musrenbang Desa">Musrenbang Desa</option>
                <option value="Musrenbang Kecamatan">Musrenbang Kecamatan</option>
                <option value="POKIR">POKIR DPRD</option>
                <option value="RENJA">RENJA Dinas</option>
              </select>

              <select
                value={selectedAkomodasi}
                onChange={e => setSelectedAkomodasi(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Status Keterkaitan</option>
                <option value="terakomodir">✅ Sudah Masuk RENJA</option>
                <option value="belum">⏳ Belum Masuk RENJA</option>
              </select>

              <select
                value={selectedKecamatan}
                onChange={e => setSelectedKecamatan(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Kecamatan</option>
                {wilayahList.map(w => (
                  <option key={w.kecamatan} value={w.kecamatan}>{w.kecamatan}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Usulan, Desa, atau Renja..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Matrix Table */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="font-semibold text-sm">Memuat Matriks Keterkaitan URK ↔ RENJA...</p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
              <GitMerge className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Tidak ada data usulan yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian di atas.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3 w-48 bg-sky-50 text-sky-900 border-r border-sky-100">Sumber & Wilayah URK</th>
                      <th className="p-3 bg-sky-50 text-sky-900 border-r border-sky-100">Usulan Rencana Kerja (Aspirasi)</th>
                      <th className="p-3 w-28 bg-sky-50 text-sky-900 text-right border-r border-sky-100">Pagu Usulan</th>
                      <th className="p-3 w-36 text-center">Status Linkage</th>
                      <th className="p-3 bg-amber-50 text-amber-900 border-r border-amber-100">Program RENJA OPD</th>
                      <th className="p-3 bg-amber-50 text-amber-900 border-r border-amber-100">Sub-Kegiatan RENJA Pengampu</th>
                      <th className="p-3 w-28 bg-amber-50 text-amber-900 text-right border-r border-amber-100">Alokasi Renja</th>
                      <th className="p-3 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProposals.map((prop, idx) => {
                      const pengusulText = Array.isArray(prop.pengusulPokir) && prop.pengusulPokir.length > 0
                        ? prop.pengusulPokir.join(', ')
                        : (prop.submittedBy || '-');

                      return (
                        <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 align-top text-center font-bold text-slate-500">{idx + 1}</td>
                          
                          {/* Sumber & Wilayah */}
                          <td className="p-3 align-top bg-sky-50/30 border-r border-sky-100/60">
                            <div className="font-bold text-sky-950">{prop.sumberUsulan || prop.jenisUsulan || 'URK'}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{pengusulText}</div>
                            <div className="text-[10px] font-semibold text-slate-700 mt-1">
                              {prop.desa ? `${prop.desa}, ` : ''}{prop.kecamatan || '-'}
                            </div>
                          </td>

                          {/* Usulan URK */}
                          <td className="p-3 align-top bg-sky-50/30 border-r border-sky-100/60">
                            <div className="font-bold text-slate-900 text-sm">{prop.projectName}</div>
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 italic">
                              {prop.justification || '-'}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                Lokasi: {prop.location || '-'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                                SIPD: {(prop.sipdStatus || 'draft').toUpperCase()}
                              </span>
                              {prop.priorityLevel && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${PRIORITY_LEVELS[prop.priorityLevel].badgeClass}`}>
                                  {prop.priorityLevel} ({prop.priorityScore} Pts)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Pagu Usulan */}
                          <td className="p-3 align-top bg-sky-50/30 text-right font-extrabold text-slate-900 border-r border-sky-100/60">
                            {formatRupiah(prop.estimatedBudget || 0)}
                          </td>

                          {/* Status Linkage Badge */}
                          <td className="p-3 align-top text-center">
                            {prop.isAkomodirRenja ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-300 shadow-sm">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> TERAKOMODIR
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" /> BANK DATA URK
                              </div>
                            )}
                          </td>

                          {/* Program Renja */}
                          <td className="p-3 align-top bg-amber-50/30 border-r border-amber-100/60">
                            {prop.isAkomodirRenja && prop.renjaProgramName ? (
                              <div>
                                <div className="font-bold text-slate-900">{prop.renjaProgramName}</div>
                                {prop.catatanAkomodasiRenja && (
                                  <div className="text-[10px] text-amber-800 mt-1 italic">
                                    Note: {prop.catatanAkomodasiRenja}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Belum dipetakan ke Program</span>
                            )}
                          </td>

                          {/* Sub-Kegiatan Renja */}
                          <td className="p-3 align-top bg-amber-50/30 border-r border-amber-100/60">
                            {prop.isAkomodirRenja && prop.renjaSubKegiatanName ? (
                              <div className="font-semibold text-blue-900">
                                {prop.renjaSubKegiatanName}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Belum dihubungkan ke Sub-Kegiatan</span>
                            )}
                          </td>

                          {/* Alokasi Renja */}
                          <td className="p-3 align-top bg-amber-50/30 text-right font-extrabold text-emerald-700 border-r border-amber-100/60">
                            {prop.isAkomodirRenja ? formatRupiah(prop.renjaPaguAlokasi || prop.estimatedBudget || 0) : '-'}
                          </td>

                          {/* Aksi */}
                          <td className="p-3 align-top text-center">
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => openLinkModal(prop)}
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-sm transition-all"
                              >
                                {prop.isAkomodirRenja ? 'Ubah Link' : '+ Tautkan'}
                              </button>
                              {prop.isAkomodirRenja && (
                                <button
                                  onClick={() => handleUnlink(prop)}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-semibold text-[9px] transition-all"
                                >
                                  Lepas Link
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Tautkan / Akomodir Usulan URK ke Sub-Kegiatan RENJA */}
      {isLinkModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-blue-600" /> Penyelarasan Usulan ke RENJA OPD
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                  Usulan: <strong>{selectedProposal.projectName}</strong> ({formatRupiah(selectedProposal.estimatedBudget)})
                </p>
              </div>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Sub-Kegiatan RENJA Pengampu (Dinas PUPR)
                </label>
                <select
                  value={targetSubId}
                  onChange={e => setTargetSubId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Pilih Sub-Kegiatan RENJA --</option>
                  {renjaData.subKegiatan.map(sub => {
                    return (
                      <option key={sub.id} value={sub.id}>
                        [{sub.bidangPengampu}] {sub.kodeSubKegiatan} - {sub.namaSubKegiatan} (Pagu: {formatRupiah(sub.paguSubKegiatan)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pagu Alokasi Anggaran dalam RENJA (Rp)
                </label>
                <input
                  type="number"
                  value={alokasiBudget}
                  onChange={e => setAlokasiBudget(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Akomodasi / Keterkaitan Teknis
                </label>
                <textarea
                  rows={2}
                  value={catatanAkomodasi}
                  onChange={e => setCatatanAkomodasi(e.target.value)}
                  placeholder="Contoh: Diakomodir sebagai prioritas 1 pada anggaran DAK Fisik 2025"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!targetSubId}
                  onClick={handleSaveLinkage}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Simpan Penyelarasan RENJA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Penilaian Skala Prioritas */}
      {isPriorityModalOpen && scoringProposal && (
        <PriorityScoringModal
          isOpen={isPriorityModalOpen}
          onClose={() => setIsPriorityModalOpen(false)}
          proposal={scoringProposal}
          userEmail={userEmail}
          userName={userName}
          onPrioritySaved={handlePrioritySaved}
        />
      )}
    </div>
  );
}
