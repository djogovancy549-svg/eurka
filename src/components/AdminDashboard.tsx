import { IndependenceDayBanner } from './IndependenceDayBanner';
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getRows, updateCell } from '../sheetsApi';
import { getAccessToken } from '../auth';
import { useRequirements } from '../useRequirements';
import { Proposal, BidangConfig, BudgetRule, Requirement, NON_BIDANG_UNITS, defaultNonBidangRequirements, getUnitActiveRequirements, SUMBER_USULAN_OPTIONS, SipdStatus, PriorityLevel, PriorityCriteria, PRIORITY_LEVELS } from '../types';
import { getAllBidangConfigs, saveBidangConfig, deleteBidangConfig, getNagekeoWilayah } from '../services/configService';
import { parseMoney, formatRupiah, printRekapanDisetujui, printRekapanSiapSIPD, exportCsvSIPD, printRekapitulasiPrioritas, exportCsvPrioritas } from '../utils';
import { DEFAULT_NAGEKEO_WILAYAH, KecamatanDesa } from '../data/nagekeoWilayah';
import { getAllPriorityEvaluations } from '../services/priorityService';
import { useRegisterRefresh } from '../context/RefreshContext';
import PriorityScoringModal from './PriorityScoringModal';
import { Video, MapPin, DollarSign, Calendar, Info, Loader2, ExternalLink, Edit2, Settings, Save, Folder, CheckCircle, Clock, AlertTriangle, RefreshCw, XCircle, Printer, Download, Plus, Trash2, ShieldCheck, Tag, Users, Layers, X, CheckSquare, Award, Sliders } from 'lucide-react';

interface AdminDashboardProps {
  userEmail: string;
  userName: string;
}

export default function AdminDashboard({ userEmail, userName }: AdminDashboardProps) {
  const { requirements } = useRequirements();
  const [configs, setConfigs] = useState<BidangConfig[]>([]);
  const [selectedBidangId, setSelectedBidangId] = useState<string>('');
  const [selectedConfig, setSelectedConfig] = useState<BidangConfig | null>(null);
  
  // Wilayah Master
  const [wilayahList, setWilayahList] = useState<KecamatanDesa[]>(DEFAULT_NAGEKEO_WILAYAH);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasNewData, setHasNewData] = useState(false);
  const proposalsRef = useRef<Proposal[]>([]);
  
  // Config & Editing State
  const [editingConfig, setEditingConfig] = useState(false);
  const [tempSheetId, setTempSheetId] = useState('');
  const [tempFolderUrl, setTempFolderUrl] = useState('');
  const [tempPagu, setTempPagu] = useState<number>(0);
  const [tempBudgetRules, setTempBudgetRules] = useState<BudgetRule[]>([]);
  const [newRuleProgram, setNewRuleProgram] = useState('');
  const [newRulePct, setNewRulePct] = useState<number>(35);
  const [tempCustomReqs, setTempCustomReqs] = useState<Requirement[]>([]);
  const [newReqLabel, setNewReqLabel] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editingZoomId, setEditingZoomId] = useState<string | null>(null);
  const [tempZoomLink, setTempZoomLink] = useState('');
  const [savingZoom, setSavingZoom] = useState(false);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // SIPD Verification Modal
  const [verifyingSipdProposal, setVerifyingSipdProposal] = useState<Proposal | null>(null);
  const [tempSipdStatus, setTempSipdStatus] = useState<SipdStatus>('siap_sipd');
  const [tempSipdRegNo, setTempSipdRegNo] = useState('');
  const [tempSipdNotes, setTempSipdNotes] = useState('');
  const [isUpdatingSipd, setIsUpdatingSipd] = useState(false);

  // Proposal Detail Modal
  const [selectedProposalDetail, setSelectedProposalDetail] = useState<Proposal | null>(null);

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('ALL');
  const [filterDesa, setFilterDesa] = useState('ALL');
  const [filterSumber, setFilterSumber] = useState('ALL');
  const [filterSipd, setFilterSipd] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  // Priority Scoring Modal State
  const [scoringProposal, setScoringProposal] = useState<Proposal | null>(null);

  const openExternalLink = (rawUrl?: string) => {
    if (!rawUrl) {
      alert('Tautan folder belum diisi.');
      return;
    }
    let url = rawUrl.trim();
    if (url.match(/^(\d{1,3}\.){3}\d{1,3}$/) || url.includes('0.0.7.234') || url === '0.0.7.234') {
      alert(`Tautan folder tidak valid (${url}). Harap masukkan tautan Google Drive yang valid.`);
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    try {
      new URL(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      alert(`Format tautan tidak valid: ${rawUrl}`);
    }
  };

  const handleSaveZoomLink = async (proposal: Proposal) => {
    if (!selectedConfig?.sheetId || !proposal.rowIndex) return;
    setSavingZoom(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      await updateCell(token, selectedConfig.sheetId, `Proposals!J${proposal.rowIndex}`, tempZoomLink);
      setProposals(proposals.map(p => p.id === proposal.id ? { ...p, zoomLink: tempZoomLink } : p));
      setEditingZoomId(null);
      setSuccessMsg('Tautan meeting berhasil diperbarui.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update zoom link', err);
      alert('Gagal menyimpan link meeting');
    } finally {
      setSavingZoom(false);
    }
  };

  const handleUpdateStatus = async (proposal: Proposal, newStatus: string) => {
    try {
      const token = await getAccessToken();
      if (!token || !selectedConfig?.sheetId || !proposal.rowIndex) return;
      await updateCell(token, selectedConfig.sheetId, `Proposals!N${proposal.rowIndex}`, newStatus);
      setProposals(proposals.map(p => p.id === proposal.id ? { ...p, status: newStatus as any } : p));
      setSuccessMsg(`Status usulan diperbarui menjadi ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Gagal memperbarui status usulan.');
    }
  };

  const handleSaveNotes = async (proposal: Proposal) => {
    try {
      const token = await getAccessToken();
      if (!token || !selectedConfig?.sheetId || !proposal.rowIndex) return;
      await updateCell(token, selectedConfig.sheetId, `Proposals!O${proposal.rowIndex}`, tempNotes);
      setProposals(proposals.map(p => p.id === proposal.id ? { ...p, adminNotes: tempNotes } : p));
      setEditingNotesId(null);
      setSuccessMsg('Catatan admin berhasil disimpan');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error('Failed to save notes', e);
      alert('Gagal menyimpan catatan admin.');
    }
  };

  const handleSaveSipdVerification = async () => {
    if (!verifyingSipdProposal || !selectedConfig?.sheetId || !verifyingSipdProposal.rowIndex) return;
    try {
      setIsUpdatingSipd(true);
      const token = await getAccessToken();
      if (!token) return;

      const rowIndex = verifyingSipdProposal.rowIndex;
      // Col V: Status SIPD, Col W: No Reg SIPD, Col X: Catatan SIPD
      await Promise.all([
        updateCell(token, selectedConfig.sheetId, `Proposals!V${rowIndex}`, tempSipdStatus),
        updateCell(token, selectedConfig.sheetId, `Proposals!W${rowIndex}`, tempSipdRegNo),
        updateCell(token, selectedConfig.sheetId, `Proposals!X${rowIndex}`, tempSipdNotes)
      ]);

      setProposals(proposals.map(p => p.id === verifyingSipdProposal.id ? {
        ...p,
        sipdStatus: tempSipdStatus,
        sipdRegistrationNo: tempSipdRegNo,
        sipdNotes: tempSipdNotes
      } : p));

      setVerifyingSipdProposal(null);
      setSuccessMsg('Verifikasi status SIPD berhasil diperbarui ke Google Sheets!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e) {
      console.error('Failed to update SIPD status', e);
      alert('Gagal memperbarui status SIPD');
    } finally {
      setIsUpdatingSipd(false);
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'diterima':
        return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-200"><CheckCircle className="w-3 h-3" /> Diterima Teknis</span>;
      case 'belum_lengkap':
        return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-200"><AlertTriangle className="w-3 h-3" /> Belum Lengkap</span>;
      case 'revisi':
        return <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-purple-200"><RefreshCw className="w-3 h-3" /> Di-revisi</span>;
      case 'ditolak':
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-200"><XCircle className="w-3 h-3" /> Ditolak</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-yellow-200"><Clock className="w-3 h-3" /> Menunggu Verifikasi</span>;
    }
  };

  const renderSipdBadge = (sipdStatus?: string, regNo?: string) => {
    switch (sipdStatus) {
      case 'siap_sipd':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-300">
            <ShieldCheck className="w-3 h-3" /> Siap Input SIPD
          </span>
        );
      case 'sudah_sipd':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-300">
            <CheckCircle className="w-3 h-3" /> Terdaftar SIPD {regNo ? `(${regNo})` : ''}
          </span>
        );
      case 'ditolak_sipd':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-rose-300">
            <XCircle className="w-3 h-3" /> Tidak Memenuhi Syarat SIPD
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" /> Pra-SIPD (Draft)
          </span>
        );
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configsData, wData] = await Promise.all([
          getAllBidangConfigs(),
          getNagekeoWilayah()
        ]);
        setConfigs(configsData);
        setWilayahList(wData);
        if (configsData.length > 0) {
          setSelectedBidangId(configsData[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBidangId && configs.length > 0) {
      const config = configs.find(c => c.id === selectedBidangId) || null;
      setSelectedConfig(config);
      if (config) {
        setTempSheetId(config.sheetId || '');
        setTempFolderUrl(config.folderUrl || '');
        setTempPagu(config.pagu || 0);
        setTempBudgetRules(config.budgetRules || []);
        setTempCustomReqs(config.customRequirements || (NON_BIDANG_UNITS.includes(config.id) ? defaultNonBidangRequirements[config.id] || [] : []));
      }
      setEditingConfig(false);
      fetchProposals(config?.sheetId);
    }
  }, [selectedBidangId, configs]);

  useEffect(() => {
    proposalsRef.current = proposals;
  }, [proposals]);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    setHasNewData(false);
    try {
      let currentSheetId = selectedConfig?.sheetId;
      try {
        const data = await getAllBidangConfigs();
        setConfigs(data);
        if (selectedBidangId) {
          const updatedConfig = data.find(c => c.id === selectedBidangId);
          if (updatedConfig) {
            setSelectedConfig(updatedConfig);
            currentSheetId = updatedConfig.sheetId;
          }
        }
      } catch (err) {
        console.error('Failed to refresh configs', err);
      }

      if (currentSheetId) {
        await fetchProposals(currentSheetId);
        setSuccessMsg('Data usulan & pagu berhasil disegarkan!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('ID Google Sheet belum dikonfigurasi.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Register with global refresh button in top navigation bar
  useRegisterRefresh('admin-dashboard', handleRefreshData, [selectedBidangId, selectedConfig?.sheetId]);

  const handleSaveConfig = async () => {
    if (!selectedConfig) return;
    try {
      const match = tempSheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const extractedSheetId = match ? match[1] : tempSheetId.trim();

      const updated = { 
        ...selectedConfig, 
        sheetId: extractedSheetId, 
        folderUrl: tempFolderUrl,
        pagu: tempPagu,
        budgetRules: tempBudgetRules,
        customRequirements: tempCustomReqs
      };
      await saveBidangConfig(updated);
      setConfigs(configs.map(c => c.id === updated.id ? updated : c));
      setSelectedConfig(updated);
      setEditingConfig(false);
      fetchProposals(updated.sheetId);
      setSuccessMsg('Konfigurasi unit berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Gagal menyimpan konfigurasi.');
    }
  };

  const fetchProposals = async (sheetId?: string) => {
    if (!sheetId) {
      setProposals([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) return;
      
      const [rows, priorityMap] = await Promise.all([
        getRows(token, sheetId, 'Proposals!A2:Y'),
        getAllPriorityEvaluations()
      ]);

      const formatted = rows.map((r: any[], index: number) => {
        let reqs = {};
        try { reqs = JSON.parse(r[10] || '{}'); } catch (e) {}
        let atts = [];
        try { atts = JSON.parse(r[15] || '[]'); } catch (e) {}
        let pokirArr: string[] = [];
        try { 
          if (r[20]) {
            pokirArr = r[20].startsWith('[') ? JSON.parse(r[20]) : r[20].split(',').map((s: string) => s.trim());
          }
        } catch (e) {}

        const proposalId = r[0] || `prop-${index}`;
        let priorityData = priorityMap[proposalId];
        if (!priorityData && r[24]) {
          try {
            const parsedColY = JSON.parse(r[24]);
            if (parsedColY.level) {
              priorityData = {
                priorityLevel: parsedColY.level as PriorityLevel,
                totalScore: parsedColY.score || 0,
                urgensiKondisi: parsedColY.criteria?.u || 3,
                kesiapanDokumen: parsedColY.criteria?.k || 3,
                dampakManfaat: parsedColY.criteria?.d || 3,
                keselarasanRpjmd: parsedColY.criteria?.r || 3
              };
            }
          } catch (e) {}
        }
        
        return {
          id: proposalId,
          rowIndex: index + 2,
          submittedAt: r[1],
          tahunUsulan: r[2],
          programName: r[3],
          activityName: r[4],
          projectName: r[5],
          location: r[6],
          estimatedBudget: parseMoney(r[7]),
          justification: r[8],
          zoomLink: r[9],
          requirementsMet: reqs,
          submittedBy: r[11],
          documentFolderUrl: r[12] || '',
          status: (r[13] as any) || 'pending',
          adminNotes: r[14] || '',
          attachments: atts,
          jenisUsulan: r[16],
          sumberUsulan: r[17] || '',
          kecamatan: r[18] || '',
          desa: r[19] || '',
          pengusulPokir: pokirArr,
          sipdStatus: (r[21] as SipdStatus) || 'draft',
          sipdRegistrationNo: r[22] || '',
          sipdNotes: r[23] || '',
          // Priority Scale
          priorityLevel: priorityData?.priorityLevel,
          priorityScore: priorityData?.totalScore,
          priorityCriteria: priorityData
        } as Proposal;
      });
      
      setProposals(formatted.reverse());
    } catch (err) {
      console.error('Failed to fetch proposals', err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered proposals
  const filteredProposals = proposals.filter(p => {
    if (filterKecamatan !== 'ALL' && p.kecamatan !== filterKecamatan) return false;
    if (filterDesa !== 'ALL' && p.desa !== filterDesa) return false;
    if (filterSumber !== 'ALL' && p.sumberUsulan !== filterSumber) return false;
    if (filterSipd !== 'ALL' && (p.sipdStatus || 'draft') !== filterSipd) return false;
    if (filterPriority !== 'ALL') {
      if (filterPriority === 'unscored') {
        if (p.priorityScore !== undefined && p.priorityScore !== null) return false;
      } else if (p.priorityLevel !== filterPriority) {
        return false;
      }
    }
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      const matchProject = (p.projectName || '').toLowerCase().includes(q);
      const matchLocation = (p.location || '').toLowerCase().includes(q);
      const matchDesa = (p.desa || '').toLowerCase().includes(q);
      const matchKec = (p.kecamatan || '').toLowerCase().includes(q);
      const matchPokir = Array.isArray(p.pengusulPokir) && p.pengusulPokir.some(pok => pok.toLowerCase().includes(q));
      if (!matchProject && !matchLocation && !matchDesa && !matchKec && !matchPokir) return false;
    }
    return true;
  });

  const totalBudget = proposals.reduce((sum, p) => sum + p.estimatedBudget, 0);
  const siapSipdCount = proposals.filter(p => p.sipdStatus === 'siap_sipd' || p.sipdStatus === 'sudah_sipd').length;
  const approvedCount = proposals.filter(p => p.status === 'diterima').length;

  return (
    <div className="space-y-6">
      <IndependenceDayBanner />
      <header className="flex flex-col sm:flex-row sm:items-center justify-between shadow-sm bg-white border-b border-slate-200 -mx-8 -mt-8 px-8 py-5 mb-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800">Panel Verifikasi & Filterisasi SIPD (Admin Evalap)</h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full">
              Kab. Nagekeo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Penampung & Filterisasi Usulan sebelum di-input ke Sistem Informasi Pemerintahan Daerah (SIPD)</p>
        </div>
        <div className="flex items-center flex-wrap gap-3 mt-4 sm:mt-0">
          <select 
            value={selectedBidangId}
            onChange={e => setSelectedBidangId(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Pilih Bidang / Unit</option>
            {configs.map(c => (
              <option key={c.id} value={c.id}>
                {NON_BIDANG_UNITS.includes(c.id) ? `Usulan ${c.name}` : `Bidang ${c.name}`}
              </option>
            ))}
          </select>

          <button
            onClick={() => window.open('https://meet.google.com/new', '_blank')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-emerald-200 shadow-sm text-xs"
            title="Buka Google Meet"
          >
            <Video className="w-4 h-4 text-emerald-600" /> Meet
          </button>

          <button
            onClick={() => printRekapanSiapSIPD(filteredProposals, `${selectedConfig?.name || 'Unit'} - Filter Aktif`)}
            disabled={filteredProposals.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-xs disabled:opacity-50"
            title="Cetak Laporan Rekapitulasi Usulan Siap SIPD"
          >
            <Printer className="w-4 h-4" /> Cetak Siap SIPD ({filteredProposals.filter(p => p.sipdStatus === 'siap_sipd' || p.sipdStatus === 'sudah_sipd').length})
          </button>

          <button
            onClick={() => exportCsvSIPD(filteredProposals, `rekap_usulan_${selectedConfig?.id || 'all'}_pra_sipd.csv`)}
            disabled={filteredProposals.length === 0}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-xs disabled:opacity-50"
            title="Ekspor CSV untuk kemudahan entri ke SIPD"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-blue-200 shadow-sm text-xs"
            title="Segarkan data tabel langsung"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan'}</span>
          </button>
        </div>
      </header>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-xs font-bold border border-green-200 flex items-center justify-between shadow-sm">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700 font-bold">&times;</button>
        </div>
      )}

      {/* Overview Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-blue-500">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Usulan Ditampung</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-black text-slate-800">{proposals.length}</span>
            <span className="text-blue-500 text-xs font-bold">Penampung Pra-SIPD</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-emerald-500">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Lolos / Siap Input SIPD</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700">{siapSipdCount}</span>
            <span className="text-emerald-600 text-xs font-bold">Terverifikasi</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-yellow-400">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Anggaran Usulan</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-lg font-black text-slate-800 truncate">
              {formatRupiah(totalBudget)}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-purple-500">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pagu Indikatif Wilayah</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-lg font-black text-slate-800 truncate">
              {formatRupiah(selectedConfig?.pagu || 0)}
            </span>
            <span className={`text-[10px] font-bold ${totalBudget > (selectedConfig?.pagu || 0) ? 'text-red-500' : 'text-green-500'}`}>
              {totalBudget > (selectedConfig?.pagu || 0) ? 'Over Pagu' : 'Aman'}
            </span>
          </div>
        </div>
      </section>

      {/* FILTER & PEMILAHAN BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Filterisasi & Penampungan Usulan Sebelum Input SIPD</h3>
          </div>
          <span className="text-xs text-slate-500">
            Menampilkan <strong>{filteredProposals.length}</strong> usulan terfilter
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Kata Kunci</label>
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Cari proyek / desa / pengusul..."
              className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kecamatan</label>
            <select
              value={filterKecamatan}
              onChange={e => {
                setFilterKecamatan(e.target.value);
                setFilterDesa('ALL');
              }}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none text-slate-700"
            >
              <option value="ALL">Semua Kecamatan (7)</option>
              {wilayahList.map(k => (
                <option key={k.kecamatan} value={k.kecamatan}>Kec. {k.kecamatan}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desa / Kelurahan</label>
            <select
              value={filterDesa}
              onChange={e => setFilterDesa(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none text-slate-700"
            >
              <option value="ALL">Semua Desa/Kelurahan</option>
              {filterKecamatan === 'ALL'
                ? wilayahList.flatMap(k => k.desaList).map(d => <option key={d} value={d}>{d}</option>)
                : (wilayahList.find(k => k.kecamatan === filterKecamatan)?.desaList || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))
              }
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sumber Usulan</label>
            <select
              value={filterSumber}
              onChange={e => setFilterSumber(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none text-slate-700"
            >
              <option value="ALL">Semua Sumber Usulan</option>
              {SUMBER_USULAN_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Kesiapan SIPD</label>
            <select
              value={filterSipd}
              onChange={e => setFilterSipd(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none text-emerald-800 bg-emerald-50/50"
            >
              <option value="ALL">Semua Status SIPD</option>
              <option value="draft">Pra-SIPD (Draft)</option>
              <option value="siap_sipd">Siap Input ke SIPD</option>
              <option value="sudah_sipd">Sudah Masuk SIPD</option>
              <option value="ditolak_sipd">Ditolak / Tidak Layak</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Skala Prioritas</label>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none text-blue-800 bg-blue-50/50"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="P1">Prioritas 1 (Utama)</option>
              <option value="P2">Prioritas 2 (Tinggi)</option>
              <option value="P3">Prioritas 3 (Sedang)</option>
              <option value="P4">Prioritas 4 (Cadangan)</option>
              <option value="unscored">Belum Dinilai</option>
            </select>
          </div>
        </div>
      </div>

      {/* PROPOSALS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Daftar Usulan Perencanaan & Verifikasi SIPD ({filteredProposals.length} item)
          </h3>
          <span className="text-xs text-slate-500">
            Google Sheet: {selectedConfig?.name || 'Unit'}
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Memuat usulan dari Google Sheets...</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Belum ada data usulan yang sesuai dengan kriteria filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Usulan & Program</th>
                  <th className="py-3 px-4">Sumber & Wilayah</th>
                  <th className="py-3 px-4">Pengusul / Pokir</th>
                  <th className="py-3 px-4">Estimasi Anggaran</th>
                  <th className="py-3 px-4 text-center">Skala Prioritas</th>
                  <th className="py-3 px-4">Evaluasi Teknis</th>
                  <th className="py-3 px-4">Status Pra-SIPD</th>
                  <th className="py-3 px-4 text-center">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProposals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 max-w-xs">{p.projectName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.programName ? `Prog: ${p.programName}` : ''} {p.activityName ? `• Keg: ${p.activityName}` : ''}
                      </div>
                      {p.isAkomodirRenja ? (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>RENJA: {p.renjaSubKegiatanName || p.renjaProgramName || 'Terakomodir'}</span>
                        </div>
                      ) : (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px]">
                          <span>Bank Data URK</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-blue-900">{p.sumberUsulan || p.jenisUsulan || 'Usulan Rencana'}</div>
                      <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                        {p.kecamatan ? `Kec. ${p.kecamatan}` : ''} {p.desa ? `• ${p.desa}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400">{p.location}</div>
                    </td>
                    <td className="py-3 px-4">
                      {Array.isArray(p.pengusulPokir) && p.pengusulPokir.length > 0 ? (
                        <div className="space-y-1">
                          {p.pengusulPokir.map((pok, i) => (
                            <span key={i} className="inline-block bg-purple-50 text-purple-900 border border-purple-200 rounded px-2 py-0.5 text-[10px] font-bold mr-1 mb-1">
                              {pok}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-medium">{p.submittedBy}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(p.estimatedBudget)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {p.priorityLevel ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${PRIORITY_LEVELS[p.priorityLevel].badgeClass}`}>
                            {p.priorityLevel} ({p.priorityScore} Pts)
                          </span>
                          <button
                            onClick={() => setScoringProposal(p)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline"
                          >
                            Ubah Nilai
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setScoringProposal(p)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition-colors"
                        >
                          <Award className="w-3 h-3 text-indigo-600" />
                          Beri Nilai
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={p.status || 'pending'}
                        onChange={(e) => handleUpdateStatus(p, e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                      >
                        <option value="pending">Menunggu Verifikasi</option>
                        <option value="diterima">Diterima Teknis</option>
                        <option value="belum_lengkap">Belum Lengkap</option>
                        <option value="revisi">Revisi</option>
                        <option value="ditolak">Ditolak</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {renderSipdBadge(p.sipdStatus, p.sipdRegistrationNo)}
                        <button
                          onClick={() => {
                            setVerifyingSipdProposal(p);
                            setTempSipdStatus(p.sipdStatus || 'siap_sipd');
                            setTempSipdRegNo(p.sipdRegistrationNo || '');
                            setTempSipdNotes(p.sipdNotes || '');
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline text-left"
                        >
                          Ubah Status SIPD
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedProposalDetail(p)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SIPD VERIFICATION MODAL */}
      {verifyingSipdProposal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Verifikasi Kelayakan Input ke SIPD</h3>
              </div>
              <button onClick={() => setVerifyingSipdProposal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-800">{verifyingSipdProposal.projectName}</p>
              <p className="text-slate-500">
                {verifyingSipdProposal.kecamatan ? `Kec. ${verifyingSipdProposal.kecamatan}` : ''} {verifyingSipdProposal.desa ? `• Desa ${verifyingSipdProposal.desa}` : ''} • Anggaran: {formatRupiah(verifyingSipdProposal.estimatedBudget)}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Kesiapan / Indikator SIPD:</label>
                <select
                  value={tempSipdStatus}
                  onChange={e => setTempSipdStatus(e.target.value as SipdStatus)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="draft">Pra-SIPD (Draft / Dalam Penelaahan)</option>
                  <option value="siap_sipd">Lolos Verifikasi (Siap Diinput ke SIPD RI)</option>
                  <option value="sudah_sipd">Sudah Diinput ke SIPD (Terdaftar di SIPD)</option>
                  <option value="ditolak_sipd">Ditolak / Belum Memenuhi Kriteria SIPD</option>
                </select>
              </div>

              {tempSipdStatus === 'sudah_sipd' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Registrasi / ID Usulan SIPD:</label>
                  <input
                    type="text"
                    value={tempSipdRegNo}
                    onChange={e => setTempSipdRegNo(e.target.value)}
                    placeholder="Contoh: SIPD-2025-09823"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Filterisasi / Kelayakan SIPD:</label>
                <textarea
                  rows={3}
                  value={tempSipdNotes}
                  onChange={e => setTempSipdNotes(e.target.value)}
                  placeholder="Catatan hasil verifikasi teknis untuk operator penginput SIPD..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVerifyingSipdProposal(null)}
                className="px-4 py-2 text-slate-700 text-xs font-bold hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSipdVerification}
                disabled={isUpdatingSipd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
              >
                {isUpdatingSipd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Status SIPD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedProposalDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  ID: {selectedProposalDetail.id}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">Detail Usulan Perencanaan</h3>
              </div>
              <button onClick={() => setSelectedProposalDetail(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 bg-slate-50 p-3 rounded-xl">
                <p className="text-slate-500 font-bold">Nama Proyek / Pekerjaan:</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedProposalDetail.projectName}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Sumber Usulan:</p>
                <p className="font-bold text-blue-900">{selectedProposalDetail.sumberUsulan || '-'}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Estimasi Anggaran:</p>
                <p className="font-bold text-slate-900 text-sm">{formatRupiah(selectedProposalDetail.estimatedBudget)}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Wilayah Kecamatan:</p>
                <p className="font-bold text-emerald-800">{selectedProposalDetail.kecamatan || '-'}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Desa / Kelurahan:</p>
                <p className="font-bold text-emerald-800">{selectedProposalDetail.desa || '-'}</p>
              </div>

              <div className="col-span-2">
                <p className="text-slate-500 font-bold">Nama Pengusul / Pokir DPRD:</p>
                {Array.isArray(selectedProposalDetail.pengusulPokir) && selectedProposalDetail.pengusulPokir.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProposalDetail.pengusulPokir.map((pok, i) => (
                      <span key={i} className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-bold">
                        {pok}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium text-slate-800">{selectedProposalDetail.submittedBy || '-'}</p>
                )}
              </div>

              <div className="col-span-2">
                <p className="text-slate-500 font-bold">Justifikasi / Urgensi Penanganan:</p>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg mt-1">{selectedProposalDetail.justification || '-'}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Status Evaluasi Teknis:</p>
                <div className="mt-1">{renderStatusBadge(selectedProposalDetail.status)}</div>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Status Kesiapan SIPD:</p>
                <div className="mt-1">{renderSipdBadge(selectedProposalDetail.sipdStatus, selectedProposalDetail.sipdRegistrationNo)}</div>
              </div>

              {/* SKALA PRIORITAS & INDIKATOR PELAKSANAAN */}
              <div className="col-span-2 bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-200 p-3.5 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" />
                    Penentuan Skala Prioritas & Indikator Pelaksanaan:
                  </p>
                  {selectedProposalDetail.priorityLevel ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${PRIORITY_LEVELS[selectedProposalDetail.priorityLevel].badgeClass}`}>
                      {PRIORITY_LEVELS[selectedProposalDetail.priorityLevel].label} ({selectedProposalDetail.priorityScore} Pts)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                      Belum Dinilai
                    </span>
                  )}
                </div>

                {selectedProposalDetail.priorityCriteria ? (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-lg border border-red-100">
                        <span className="text-[10px] text-slate-500 font-bold block">Urgensi (30%)</span>
                        <strong className="text-red-700">{selectedProposalDetail.priorityCriteria.urgensiKondisi} / 5</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-slate-500 font-bold block">Kesiapan (25%)</span>
                        <strong className="text-emerald-700">{selectedProposalDetail.priorityCriteria.kesiapanDokumen} / 5</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-slate-500 font-bold block">Dampak (25%)</span>
                        <strong className="text-blue-700">{selectedProposalDetail.priorityCriteria.dampakManfaat} / 5</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-purple-100">
                        <span className="text-[10px] text-slate-500 font-bold block">RPJMD (20%)</span>
                        <strong className="text-purple-700">{selectedProposalDetail.priorityCriteria.keselarasanRpjmd} / 5</strong>
                      </div>
                    </div>
                    {selectedProposalDetail.priorityCriteria.justifikasiTeknis && (
                      <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                        Justifikasi Teknis: "{selectedProposalDetail.priorityCriteria.justifikasiTeknis}"
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      const prop = selectedProposalDetail;
                      setSelectedProposalDetail(null);
                      setScoringProposal(prop);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    {selectedProposalDetail.priorityLevel ? 'Ubah Penilaian Skala Prioritas' : 'Beri Penilaian Skala Prioritas'}
                  </button>
                </div>
              </div>

              {/* KETERKAITAN RENJA OPD */}
              <div className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Keterkaitan Dokumen RENJA OPD Dinas PUPR:
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedProposalDetail.isAkomodirRenja ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {selectedProposalDetail.isAkomodirRenja ? 'TERAKOMODIR DI RENJA' : 'BANK DATA URK'}
                  </span>
                </div>
                {selectedProposalDetail.isAkomodirRenja ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-slate-500">Program Renja:</span>
                      <p className="font-bold text-slate-800">{selectedProposalDetail.renjaProgramName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Sub-Kegiatan Renja:</span>
                      <p className="font-bold text-slate-800">{selectedProposalDetail.renjaSubKegiatanName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Pagu Alokasi Renja:</span>
                      <p className="font-extrabold text-emerald-700">{formatRupiah(selectedProposalDetail.renjaPaguAlokasi || selectedProposalDetail.estimatedBudget)}</p>
                    </div>
                    {selectedProposalDetail.catatanAkomodasiRenja && (
                      <div className="col-span-2">
                        <span className="text-slate-500">Catatan Penyelarasan:</span>
                        <p className="text-slate-700 italic">{selectedProposalDetail.catatanAkomodasiRenja}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-600 text-xs mt-1">
                    Usulan ini masih tersimpan dalam penampungan e-URK dan belum diintegrasikan ke Sub-Kegiatan RENJA OPD.
                  </p>
                )}
              </div>

              {selectedProposalDetail.adminNotes && (
                <div className="col-span-2 bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
                  <p className="font-bold text-yellow-900">Catatan Verifikator / Admin:</p>
                  <p className="text-yellow-800 mt-0.5">{selectedProposalDetail.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedProposalDetail(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRIORITY SCORING MODAL */}
      {scoringProposal && (
        <PriorityScoringModal
          isOpen={!!scoringProposal}
          onClose={() => setScoringProposal(null)}
          proposal={scoringProposal}
          userEmail={userEmail}
          userName={userName}
          onPrioritySaved={(proposalId, criteria) => {
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
          }}
        />
      )}
    </div>
  );
}
