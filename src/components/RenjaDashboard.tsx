import React, { useState, useEffect } from 'react';
import { 
  RenjaProgram, 
  RenjaKegiatan,
  RenjaSubKegiatan, 
  Proposal, 
  BIDANG_LIST,
  SUMBER_DANA_LIST
} from '../types';
import { 
  getRenjaMasterData, 
  saveRenjaMasterData, 
  clearAllRenjaData,
  linkUrkToRenja, 
  unlinkUrkFromRenja, 
  RenjaMasterData 
} from '../services/renjaService';
import { getAllBidangConfigs } from '../services/configService';
import { getProposalsByBidang } from '../services/proposalService';
import { formatRupiah, printDokumenRenja } from '../utils';
import { addNotification } from '../services/notificationService';
import { logSecurityActivity } from '../services/securityService';
import { 
  Building2, 
  Plus, 
  FileText, 
  Printer, 
  CheckCircle, 
  Layers, 
  Link as LinkIcon, 
  Unlink, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  X, 
  Info,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Coins,
  ShieldCheck,
  AlertCircle,
  FolderTree,
  ListTree
} from 'lucide-react';

interface RenjaDashboardProps {
  userEmail: string;
  userName: string;
  isAdmin?: boolean;
}

export default function RenjaDashboard({ userEmail, userName, isAdmin = true }: RenjaDashboardProps) {
  const [renjaData, setRenjaData] = useState<RenjaMasterData>({ programs: [], kegiatan: [], subKegiatan: [] });
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBidang, setSelectedBidang] = useState<string>('Semua');
  const [selectedSumberDana, setSelectedSumberDana] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});
  const [expandedKegiatans, setExpandedKegiatans] = useState<Record<string, boolean>>({});

  // Modals
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);
  const [isAddKegiatanOpen, setIsAddKegiatanOpen] = useState(false);
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  
  const [selectedProgramForKegiatan, setSelectedProgramForKegiatan] = useState<string>('');
  const [selectedProgramForSub, setSelectedProgramForSub] = useState<string>('');
  const [selectedKegiatanForSub, setSelectedKegiatanForSub] = useState<string>('');

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetSubKegiatan, setTargetSubKegiatan] = useState<RenjaSubKegiatan | null>(null);
  const [selectedUrkToLink, setSelectedUrkToLink] = useState<string>('');
  const [linkAlokasiBudget, setLinkAlokasiBudget] = useState<number>(0);
  const [linkCatatan, setLinkCatatan] = useState<string>('');

  // Form State: Program
  const [newProgram, setNewProgram] = useState<Partial<RenjaProgram>>({
    kodeProgram: '1.03.',
    namaProgram: '',
    bidangPengampu: 'SDA',
    indikatorKinerja: '',
    targetKinerja: '',
    paguProgram: 0,
    tahun: '2025'
  });

  // Form State: Kegiatan
  const [newKegiatan, setNewKegiatan] = useState<Partial<RenjaKegiatan>>({
    kodeKegiatan: '1.03.01.',
    namaKegiatan: '',
    indikatorKegiatan: '',
    targetKinerja: '',
    paguKegiatan: 0,
    bidangPengampu: 'SDA',
    tahun: '2025'
  });

  // Form State: Sub-Kegiatan
  const [newSubKegiatan, setNewSubKegiatan] = useState<Partial<RenjaSubKegiatan>>({
    kodeSubKegiatan: '1.03.01.2.01.',
    namaSubKegiatan: '',
    indikatorSubKegiatan: '',
    targetVolume: '',
    satuan: 'Km',
    lokasi: 'Kabupaten Nagekeo',
    sumberDana: 'DAU',
    paguSubKegiatan: 0,
    bidangPengampu: 'SDA',
    tahun: '2025'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [renjaRes, configs] = await Promise.all([
        getRenjaMasterData(),
        getAllBidangConfigs()
      ]);

      setRenjaData(renjaRes);

      // Expand all by default
      const expProg: Record<string, boolean> = {};
      renjaRes.programs.forEach(p => { expProg[p.id] = true; });
      setExpandedPrograms(expProg);

      const expKeg: Record<string, boolean> = {};
      (renjaRes.kegiatan || []).forEach(k => { expKeg[k.id] = true; });
      setExpandedKegiatans(expKeg);

      // Load all proposals to map linked URK
      const allProps: Proposal[] = [];
      await Promise.all(
        configs.map(async (cfg) => {
          try {
            const props = await getProposalsByBidang(cfg.id, cfg.sheetId);
            allProps.push(...props);
          } catch (e) {}
        })
      );
      setAllProposals(allProps);
    } catch (e) {
      console.error('Error loading RENJA data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleProgram = (progId: string) => {
    setExpandedPrograms(prev => ({ ...prev, [progId]: !prev[progId] }));
  };

  const toggleKegiatan = (kegId: string) => {
    setExpandedKegiatans(prev => ({ ...prev, [kegId]: !prev[kegId] }));
  };

  // PROGRAM CRUD
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgram.namaProgram || !newProgram.kodeProgram) return;

    const progId = 'prog_' + Date.now();
    const created: RenjaProgram = {
      id: progId,
      kodeProgram: newProgram.kodeProgram,
      namaProgram: newProgram.namaProgram,
      bidangPengampu: newProgram.bidangPengampu || 'SDA',
      indikatorKinerja: newProgram.indikatorKinerja || '',
      targetKinerja: newProgram.targetKinerja || '',
      paguProgram: Number(newProgram.paguProgram) || 0,
      tahun: newProgram.tahun || '2025'
    };

    const updatedPrograms = [...renjaData.programs, created];
    await saveRenjaMasterData(updatedPrograms, renjaData.subKegiatan, renjaData.kegiatan || []);
    setRenjaData(prev => ({ ...prev, programs: updatedPrograms }));
    setExpandedPrograms(prev => ({ ...prev, [progId]: true }));
    setIsAddProgramOpen(false);

    await logSecurityActivity(
      'CREATE_RENJA_PROGRAM',
      userEmail,
      userName,
      'renja',
      `Menambahkan Program RENJA baru: ${created.kodeProgram} - ${created.namaProgram}`
    );

    setNewProgram({
      kodeProgram: '1.03.',
      namaProgram: '',
      bidangPengampu: 'SDA',
      indikatorKinerja: '',
      targetKinerja: '',
      paguProgram: 0,
      tahun: '2025'
    });
  };

  const handleDeleteProgram = async (progId: string) => {
    if (!window.confirm('Yakin ingin menghapus Program ini beserta seluruh Kegiatan dan Sub-Kegiatannya?')) return;
    const updatedPrograms = renjaData.programs.filter(p => p.id !== progId);
    const updatedKegiatan = (renjaData.kegiatan || []).filter(k => k.programId !== progId);
    const updatedSub = renjaData.subKegiatan.filter(s => s.programId !== progId);
    await saveRenjaMasterData(updatedPrograms, updatedSub, updatedKegiatan);
    setRenjaData({ programs: updatedPrograms, kegiatan: updatedKegiatan, subKegiatan: updatedSub });
  };

  // KEGIATAN CRUD
  const handleSaveKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKegiatan.namaKegiatan || !newKegiatan.kodeKegiatan || !selectedProgramForKegiatan) return;

    const kegId = 'keg_' + Date.now();
    const created: RenjaKegiatan = {
      id: kegId,
      programId: selectedProgramForKegiatan,
      kodeKegiatan: newKegiatan.kodeKegiatan,
      namaKegiatan: newKegiatan.namaKegiatan,
      indikatorKegiatan: newKegiatan.indikatorKegiatan || '',
      targetKinerja: newKegiatan.targetKinerja || '',
      paguKegiatan: Number(newKegiatan.paguKegiatan) || 0,
      bidangPengampu: newKegiatan.bidangPengampu || 'SDA',
      tahun: newKegiatan.tahun || '2025'
    };

    const updatedKegiatans = [...(renjaData.kegiatan || []), created];
    await saveRenjaMasterData(renjaData.programs, renjaData.subKegiatan, updatedKegiatans);
    setRenjaData(prev => ({ ...prev, kegiatan: updatedKegiatans }));
    setExpandedKegiatans(prev => ({ ...prev, [kegId]: true }));
    setIsAddKegiatanOpen(false);

    await logSecurityActivity(
      'CREATE_RENJA_KEGIATAN',
      userEmail,
      userName,
      'renja',
      `Menambahkan Kegiatan RENJA baru: ${created.kodeKegiatan} - ${created.namaKegiatan}`
    );

    setNewKegiatan({
      kodeKegiatan: '1.03.01.',
      namaKegiatan: '',
      indikatorKegiatan: '',
      targetKinerja: '',
      paguKegiatan: 0,
      bidangPengampu: 'SDA',
      tahun: '2025'
    });
  };

  const handleDeleteKegiatan = async (kegId: string) => {
    if (!window.confirm('Yakin ingin menghapus Kegiatan ini beserta seluruh Sub-Kegiatannya?')) return;
    const updatedKegiatan = (renjaData.kegiatan || []).filter(k => k.id !== kegId);
    const updatedSub = renjaData.subKegiatan.filter(s => s.kegiatanId !== kegId);
    await saveRenjaMasterData(renjaData.programs, updatedSub, updatedKegiatan);
    setRenjaData(prev => ({ ...prev, kegiatan: updatedKegiatan, subKegiatan: updatedSub }));
  };

  // SUB-KEGIATAN CRUD
  const handleSaveSubKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubKegiatan.namaSubKegiatan || !newSubKegiatan.kodeSubKegiatan || !selectedProgramForSub) return;

    const subId = 'sub_' + Date.now();
    const created: RenjaSubKegiatan = {
      id: subId,
      programId: selectedProgramForSub,
      kegiatanId: selectedKegiatanForSub || undefined,
      kodeSubKegiatan: newSubKegiatan.kodeSubKegiatan,
      namaSubKegiatan: newSubKegiatan.namaSubKegiatan,
      indikatorSubKegiatan: newSubKegiatan.indikatorSubKegiatan || '',
      targetVolume: newSubKegiatan.targetVolume || '1 Paket',
      satuan: newSubKegiatan.satuan || 'Paket',
      lokasi: newSubKegiatan.lokasi || 'Kabupaten Nagekeo',
      sumberDana: newSubKegiatan.sumberDana || 'DAU',
      paguSubKegiatan: Number(newSubKegiatan.paguSubKegiatan) || 0,
      bidangPengampu: newSubKegiatan.bidangPengampu || 'SDA',
      tahun: newSubKegiatan.tahun || '2025',
      linkedProposalIds: []
    };

    const updatedSub = [...renjaData.subKegiatan, created];
    await saveRenjaMasterData(renjaData.programs, updatedSub, renjaData.kegiatan || []);
    setRenjaData(prev => ({ ...prev, subKegiatan: updatedSub }));
    setIsAddSubOpen(false);

    await logSecurityActivity(
      'CREATE_RENJA_SUB_KEGIATAN',
      userEmail,
      userName,
      'renja',
      `Menambahkan Sub-Kegiatan RENJA baru: ${created.kodeSubKegiatan} - ${created.namaSubKegiatan}`
    );

    setNewSubKegiatan({
      kodeSubKegiatan: '1.03.01.2.01.',
      namaSubKegiatan: '',
      indikatorSubKegiatan: '',
      targetVolume: '',
      satuan: 'Km',
      lokasi: 'Kabupaten Nagekeo',
      sumberDana: 'DAU',
      paguSubKegiatan: 0,
      bidangPengampu: 'SDA',
      tahun: '2025'
    });
  };

  const handleDeleteSubKegiatan = async (subId: string) => {
    if (!window.confirm('Yakin ingin menghapus Sub-Kegiatan ini?')) return;
    const updatedSub = renjaData.subKegiatan.filter(s => s.id !== subId);
    await saveRenjaMasterData(renjaData.programs, updatedSub, renjaData.kegiatan || []);
    setRenjaData(prev => ({ ...prev, subKegiatan: updatedSub }));
  };

  // LINKING
  const openLinkModal = (sub: RenjaSubKegiatan) => {
    setTargetSubKegiatan(sub);
    setSelectedUrkToLink('');
    setLinkAlokasiBudget(0);
    setLinkCatatan('');
    setIsLinkModalOpen(true);
  };

  const handleExecuteLink = async () => {
    if (!targetSubKegiatan || !selectedUrkToLink) return;

    const prop = allProposals.find(p => p.id === selectedUrkToLink);
    if (!prop) return;

    const { updatedProposal, updatedRenja } = await linkUrkToRenja(
      prop,
      targetSubKegiatan.id,
      renjaData,
      linkAlokasiBudget || prop.estimatedBudget,
      linkCatatan
    );

    setRenjaData(updatedRenja);
    setAllProposals(prev => prev.map(p => p.id === updatedProposal.id ? updatedProposal : p));
    setIsLinkModalOpen(false);

    await addNotification({
      title: 'Usulan e-URK Diakomodir ke RENJA',
      message: `Usulan "${prop.projectName}" telah berhasil ditautkan ke sub-kegiatan ${targetSubKegiatan.namaSubKegiatan} dengan alokasi ${formatRupiah(linkAlokasiBudget || prop.estimatedBudget)}.`,
      type: 'renja_linked',
      targetRole: 'all',
      linkUrl: '#renja'
    });
  };

  const handleUnlink = async (propId: string) => {
    if (!window.confirm('Lepaskan usulan URK ini dari Sub-Kegiatan RENJA?')) return;
    const prop = allProposals.find(p => p.id === propId);
    if (!prop) return;

    const { updatedProposal, updatedRenja } = await unlinkUrkFromRenja(prop, renjaData);
    setRenjaData(updatedRenja);
    setAllProposals(prev => prev.map(p => p.id === updatedProposal.id ? updatedProposal : p));
  };

  const handleClearAll = async () => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data Program, Kegiatan & Sub-Kegiatan RENJA? Tindakan ini akan menghapus data dummy dan memulai dengan lembar kerja kosong.')) return;
    
    await clearAllRenjaData();
    setRenjaData({ programs: [], kegiatan: [], subKegiatan: [] });
    setAllProposals(prev => prev.map(p => ({
      ...p,
      isAkomodirRenja: false,
      renjaSubKegiatanId: undefined,
      renjaSubKegiatanName: undefined,
      renjaKegiatanId: undefined,
      renjaKegiatanName: undefined,
      renjaProgramId: undefined,
      renjaProgramName: undefined,
      renjaPaguAlokasi: undefined
    })));
  };

  // Calculations
  const sumberDanaStats = React.useMemo(() => {
    const map: Record<string, { totalPagu: number; count: number; urkCount: number; urkBudget: number }> = {};
    renjaData.subKegiatan.forEach(sub => {
      const sd = sub.sumberDana || 'DAU';
      if (!map[sd]) map[sd] = { totalPagu: 0, count: 0, urkCount: 0, urkBudget: 0 };
      map[sd].totalPagu += (Number(sub.paguSubKegiatan) || 0);
      map[sd].count += 1;
      
      const linkedUrks = allProposals.filter(p => p.isAkomodirRenja && p.renjaSubKegiatanId === sub.id);
      map[sd].urkCount += linkedUrks.length;
      map[sd].urkBudget += linkedUrks.reduce((a, b) => a + (b.renjaPaguAlokasi || b.estimatedBudget || 0), 0);
    });
    return map;
  }, [renjaData.subKegiatan, allProposals]);

  const filteredPrograms = renjaData.programs.filter(p => {
    if (selectedBidang !== 'Semua' && p.bidangPengampu !== selectedBidang) return false;

    const progSubs = renjaData.subKegiatan.filter(s => s.programId === p.id);
    if (selectedSumberDana !== 'Semua') {
      const hasMatchingSub = progSubs.some(s => (s.sumberDana || 'DAU') === selectedSumberDana);
      if (!hasMatchingSub) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchProg = p.namaProgram.toLowerCase().includes(q) || p.kodeProgram.toLowerCase().includes(q);
      const matchSub = progSubs.some(s => s.namaSubKegiatan.toLowerCase().includes(q) || s.kodeSubKegiatan.toLowerCase().includes(q));
      return matchProg || matchSub;
    }
    return true;
  });

  const totalPaguRenja = renjaData.subKegiatan.reduce((acc, s) => acc + (s.paguSubKegiatan || 0), 0);
  const totalUrkLinked = allProposals.filter(p => p.isAkomodirRenja).length;
  const totalUrkBudgetLinked = allProposals
    .filter(p => p.isAkomodirRenja)
    .reduce((acc, p) => acc + (p.renjaPaguAlokasi || p.estimatedBudget || 0), 0);

  const availableProposals = allProposals.filter(p => !p.isAkomodirRenja);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-400/30">
              <FolderTree className="w-3.5 h-3.5" /> Hierarki: Program ➔ Kegiatan ➔ Sub-Kegiatan
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Rencana Kerja Perangkat Daerah (RENJA)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Manajemen Program, Kegiatan, dan Sub-Kegiatan Dinas PUPR Kabupaten Nagekeo. Menampung alokasi program kerja dinas serta mengakomodasi usulan masyarakat (e-URK).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {renjaData.programs.length > 0 && (
              <button
                onClick={() => printDokumenRenja(renjaData.programs, renjaData.subKegiatan, allProposals, '2025')}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border border-white/20 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Cetak Dokumen RENJA
              </button>
            )}
            {isAdmin && (
              <>
                {renjaData.programs.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    title="Hapus semua program/kegiatan/subkegiatan dummy"
                    className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all border border-red-400/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Kosongkan Data
                  </button>
                )}
                <button
                  onClick={() => setIsAddProgramOpen(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-600/30"
                >
                  <Plus className="w-4 h-4" /> Tambah Program Baru
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pagu RENJA OPD</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatRupiah(totalPaguRenja)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {renjaData.programs.length} Prog &bull; {(renjaData.kegiatan || []).length} Keg &bull; {renjaData.subKegiatan.length} Sub-Keg
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Usulan Terakomodir</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LinkIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2">
            {totalUrkLinked} Usulan
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Aspirasi Musrenbang & Pokir masuk RENJA
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pagu e-URK Terakomodir</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-600 mt-2">
            {formatRupiah(totalUrkBudgetLinked)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalPaguRenja > 0 ? `${((totalUrkBudgetLinked / totalPaguRenja) * 100).toFixed(1)}% dari Total RENJA` : '0%'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nomenklatur SIPD</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-600 mt-2">
            Kepmendagri 050
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Standar Program-Kegiatan-SubKegiatan RI
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold uppercase text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Bidang:
            </span>
            {['Semua', 'SDA', 'BM', 'CK', 'PL', 'Tata Ruang', 'Sekretariat'].map(b => (
              <button
                key={b}
                onClick={() => setSelectedBidang(b)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedBidang === b
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase text-slate-500 mr-1 shrink-0">
              Sumber Dana:
            </span>
            <select
              value={selectedSumberDana}
              onChange={(e) => setSelectedSumberDana(e.target.value)}
              className="text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Sumber Dana</option>
              {Object.keys(sumberDanaStats).map(sd => (
                <option key={sd} value={sd}>{sd}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Program / Kegiatan / Sub-Kegiatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Program ➔ Kegiatan ➔ Sub-Kegiatan Hierarchical Tree */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-semibold text-sm">Memuat Data RENJA OPD...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900">Belum ada Program RENJA</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Mulai susun struktur Program, Kegiatan, dan Sub-Kegiatan Dinas PUPR Nagekeo.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsAddProgramOpen(true)}
              className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Mulai Tambah Program Baru
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPrograms.map(program => {
            const allProgSubs = renjaData.subKegiatan.filter(s => s.programId === program.id);
            const progKegiatans = (renjaData.kegiatan || []).filter(k => k.programId === program.id);
            const totalProgSubPagu = allProgSubs.reduce((a, b) => a + (b.paguSubKegiatan || 0), 0);
            const isProgExpanded = !!expandedPrograms[program.id];

            return (
              <div key={program.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all">
                {/* LEVEL 1: PROGRAM HEADER */}
                <div 
                  className="p-5 bg-slate-900 text-white hover:bg-slate-950 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                  onClick={() => toggleProgram(program.id)}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button className="mt-1 text-slate-400 hover:text-white">
                      {isProgExpanded ? <ChevronDown className="w-5 h-5 text-blue-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono text-xs font-bold">
                          PROGRAM: {program.kodeProgram}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-xs font-bold">
                          Bidang {program.bidangPengampu}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">TA {program.tahun}</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-white mt-1.5">
                        {program.namaProgram}
                      </h2>
                      <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Indikator: <strong>{program.indikatorKinerja || '-'}</strong></span>
                        <span>Target: <strong className="text-blue-300">{program.targetKinerja || '-'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 self-end md:self-center" onClick={e => e.stopPropagation()}>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">Pagu Total Program</div>
                      <div className="text-base font-black text-emerald-400">
                        {formatRupiah(totalProgSubPagu || program.paguProgram)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {progKegiatans.length} Kegiatan &bull; {allProgSubs.length} Sub-Kegiatan
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700">
                        <button
                          onClick={() => {
                            setSelectedProgramForKegiatan(program.id);
                            setNewKegiatan(prev => ({
                              ...prev,
                              kodeKegiatan: program.kodeProgram + '01.',
                              bidangPengampu: program.bidangPengampu
                            }));
                            setIsAddKegiatanOpen(true);
                          }}
                          title="Tambah Kegiatan di Bawah Program Ini"
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Kegiatan
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(program.id)}
                          title="Hapus Seluruh Program"
                          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* LEVEL 2: KEGIATAN & SUB-KEGIATAN CONTAINER */}
                {isProgExpanded && (
                  <div className="p-4 sm:p-6 bg-slate-50/50 space-y-6">
                    {/* List of Kegiatans under this Program */}
                    {progKegiatans.length === 0 && allProgSubs.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs italic bg-white rounded-2xl border border-dashed border-slate-200">
                        Belum ada Kegiatan atau Sub-Kegiatan dalam Program ini.{' '}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedProgramForKegiatan(program.id);
                              setIsAddKegiatanOpen(true);
                            }}
                            className="text-blue-600 font-bold hover:underline ml-1"
                          >
                            + Tambah Kegiatan Baru
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Render each Kegiatan */}
                        {progKegiatans.map(keg => {
                          const kegSubs = allProgSubs.filter(s => s.kegiatanId === keg.id);
                          const totalKegPagu = kegSubs.reduce((a, b) => a + (b.paguSubKegiatan || 0), 0);
                          const isKegExpanded = expandedKegiatans[keg.id] !== false;

                          return (
                            <div key={keg.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                              {/* Kegiatan Header */}
                              <div 
                                className="p-4 bg-indigo-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-indigo-50 transition-colors"
                                onClick={() => toggleKegiatan(keg.id)}
                              >
                                <div className="flex items-start gap-2.5">
                                  <button className="mt-0.5 text-indigo-600">
                                    {isKegExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 font-mono text-[11px] font-bold">
                                        KEGIATAN: {keg.kodeKegiatan}
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-medium">{keg.indikatorKegiatan || ''}</span>
                                    </div>
                                    <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                                      {keg.namaKegiatan}
                                    </h3>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Pagu Kegiatan</div>
                                    <div className="text-xs font-black text-indigo-900">
                                      {formatRupiah(totalKegPagu || keg.paguKegiatan)}
                                    </div>
                                  </div>

                                  {isAdmin && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setSelectedProgramForSub(program.id);
                                          setSelectedKegiatanForSub(keg.id);
                                          setNewSubKegiatan(prev => ({
                                            ...prev,
                                            kodeSubKegiatan: keg.kodeKegiatan + '2.01.',
                                            bidangPengampu: program.bidangPengampu
                                          }));
                                          setIsAddSubOpen(true);
                                        }}
                                        title="Tambah Sub-Kegiatan di Bawah Kegiatan Ini"
                                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                                      >
                                        <Plus className="w-3 h-3" /> Sub-Kegiatan
                                      </button>
                                      <button
                                        onClick={() => handleDeleteKegiatan(keg.id)}
                                        title="Hapus Kegiatan"
                                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* LEVEL 3: SUB-KEGIATAN TABLE */}
                              {isKegExpanded && (
                                <div className="p-3 overflow-x-auto">
                                  {kegSubs.length === 0 ? (
                                    <div className="text-center py-4 text-slate-400 text-xs italic">
                                      Belum ada sub-kegiatan di bawah kegiatan ini.
                                    </div>
                                  ) : (
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-slate-100/75 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                          <th className="p-2.5">Kode & Sub-Kegiatan</th>
                                          <th className="p-2.5">Kinerja & Target</th>
                                          <th className="p-2.5">Lokasi</th>
                                          <th className="p-2.5">Sumber Dana</th>
                                          <th className="p-2.5 text-right">Pagu Sub-Kegiatan</th>
                                          <th className="p-2.5">Usulan e-URK Terakomodir</th>
                                          <th className="p-2.5 text-center">Aksi</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {kegSubs.map(sub => {
                                          const linked = allProposals.filter(p => p.isAkomodirRenja && p.renjaSubKegiatanId === sub.id);
                                          const subLinkedBudget = linked.reduce((a, b) => a + (b.renjaPaguAlokasi || b.estimatedBudget || 0), 0);

                                          return (
                                            <tr key={sub.id} className="hover:bg-blue-50/30 transition-colors">
                                              <td className="p-2.5 align-top">
                                                <div className="font-mono text-[10px] font-bold text-slate-600">{sub.kodeSubKegiatan}</div>
                                                <div className="font-bold text-slate-900 text-xs mt-0.5">{sub.namaSubKegiatan}</div>
                                              </td>
                                              <td className="p-2.5 align-top">
                                                <div className="text-slate-700 text-[11px]">{sub.indikatorSubKegiatan || '-'}</div>
                                                <div className="font-bold text-blue-800 text-[11px] mt-0.5">
                                                  Vol: {sub.targetVolume || '-'} {sub.satuan || ''}
                                                </div>
                                              </td>
                                              <td className="p-2.5 align-top text-slate-700 text-[11px]">
                                                {sub.lokasi || 'Nagekeo'}
                                              </td>
                                              <td className="p-2.5 align-top">
                                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                                  {sub.sumberDana || 'DAU'}
                                                </span>
                                              </td>
                                              <td className="p-2.5 align-top text-right">
                                                <div className="font-extrabold text-slate-900 text-xs">
                                                  {formatRupiah(sub.paguSubKegiatan)}
                                                </div>
                                                {linked.length > 0 && (
                                                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                                    URK: {formatRupiah(subLinkedBudget)}
                                                  </div>
                                                )}
                                              </td>
                                              <td className="p-2.5 align-top">
                                                {linked.length === 0 ? (
                                                  <span className="text-slate-400 text-[11px] italic">Renja Murni Dinas</span>
                                                ) : (
                                                  <div className="space-y-1 max-w-xs">
                                                    {linked.map(p => (
                                                      <div key={p.id} className="p-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-950 flex items-start justify-between gap-1">
                                                        <div>
                                                          <div className="font-bold truncate max-w-[150px]">{p.projectName}</div>
                                                          <div className="font-semibold text-emerald-900">
                                                            {formatRupiah(p.renjaPaguAlokasi || p.estimatedBudget || 0)}
                                                          </div>
                                                        </div>
                                                        {isAdmin && (
                                                          <button
                                                            onClick={() => handleUnlink(p.id)}
                                                            title="Lepaskan Usulan"
                                                            className="text-emerald-700 hover:text-red-600 p-0.5"
                                                          >
                                                            <Unlink className="w-3 h-3" />
                                                          </button>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </td>
                                              <td className="p-2.5 align-top text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                  <button
                                                    onClick={() => openLinkModal(sub)}
                                                    title="Tautkan Usulan URK"
                                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-xs"
                                                  >
                                                    <LinkIcon className="w-3 h-3" /> + Tautkan
                                                  </button>
                                                  {isAdmin && (
                                                    <button
                                                      onClick={() => handleDeleteSubKegiatan(sub.id)}
                                                      title="Hapus Sub-Kegiatan"
                                                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Unassigned Sub-Kegiatans under this Program */}
                        {allProgSubs.filter(s => !s.kegiatanId).length > 0 && (
                          <div className="bg-white rounded-2xl border border-amber-200 p-4">
                            <div className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                              <Info className="w-4 h-4 text-amber-600" /> Sub-Kegiatan Non-Spesifik Kegiatan:
                            </div>
                            <div className="space-y-2">
                              {allProgSubs.filter(s => !s.kegiatanId).map(sub => (
                                <div key={sub.id} className="p-2.5 bg-slate-50 rounded-xl border flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-mono font-bold text-slate-500">{sub.kodeSubKegiatan}</span>
                                    <span className="font-bold text-slate-900 ml-2">{sub.namaSubKegiatan}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-extrabold text-slate-900">{formatRupiah(sub.paguSubKegiatan)}</span>
                                    <button
                                      onClick={() => openLinkModal(sub)}
                                      className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold"
                                    >
                                      + Tautkan URK
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD PROGRAM */}
      {isAddProgramOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Tambah Program RENJA Baru</h3>
              <button onClick={() => setIsAddProgramOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProgram} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kode Program (SIPD)</label>
                <input
                  type="text"
                  required
                  value={newProgram.kodeProgram}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, kodeProgram: e.target.value }))}
                  placeholder="Contoh: 1.03.01"
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Nomenklatur Program</label>
                <input
                  type="text"
                  required
                  value={newProgram.namaProgram}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, namaProgram: e.target.value }))}
                  placeholder="Contoh: PROGRAM PENYELENGGARAAN JALAN"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bidang Pengampu</label>
                  <select
                    value={newProgram.bidangPengampu}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, bidangPengampu: e.target.value }))}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BIDANG_LIST.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tahun Anggaran</label>
                  <input
                    type="text"
                    value={newProgram.tahun}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, tahun: e.target.value }))}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Indikator Kinerja Program</label>
                <input
                  type="text"
                  value={newProgram.indikatorKinerja}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, indikatorKinerja: e.target.value }))}
                  placeholder="Contoh: Persentase jalan kondisi mantap"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Kinerja</label>
                <input
                  type="text"
                  value={newProgram.targetKinerja}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, targetKinerja: e.target.value }))}
                  placeholder="Contoh: 85 %"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProgramOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD KEGIATAN */}
      {isAddKegiatanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Tambah Kegiatan RENJA Baru</h3>
              <button onClick={() => setIsAddKegiatanOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveKegiatan} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kode Kegiatan (SIPD)</label>
                <input
                  type="text"
                  required
                  value={newKegiatan.kodeKegiatan}
                  onChange={(e) => setNewKegiatan(prev => ({ ...prev, kodeKegiatan: e.target.value }))}
                  placeholder="Contoh: 1.03.01.2.01"
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  value={newKegiatan.namaKegiatan}
                  onChange={(e) => setNewKegiatan(prev => ({ ...prev, namaKegiatan: e.target.value }))}
                  placeholder="Contoh: Penyelenggaraan Jalan Kabupaten/Kota"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Indikator Kegiatan</label>
                <input
                  type="text"
                  value={newKegiatan.indikatorKegiatan}
                  onChange={(e) => setNewKegiatan(prev => ({ ...prev, indikatorKegiatan: e.target.value }))}
                  placeholder="Contoh: Panjang jalan kabupaten yang ditingkatkan/dipelihara"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddKegiatanOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Simpan Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD SUB-KEGIATAN */}
      {isAddSubOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Tambah Sub-Kegiatan RENJA Baru</h3>
              <button onClick={() => setIsAddSubOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSubKegiatan} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kode Sub-Kegiatan (SIPD)</label>
                <input
                  type="text"
                  required
                  value={newSubKegiatan.kodeSubKegiatan}
                  onChange={(e) => setNewSubKegiatan(prev => ({ ...prev, kodeSubKegiatan: e.target.value }))}
                  placeholder="Contoh: 1.03.01.2.01.0001"
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Sub-Kegiatan</label>
                <input
                  type="text"
                  required
                  value={newSubKegiatan.namaSubKegiatan}
                  onChange={(e) => setNewSubKegiatan(prev => ({ ...prev, namaSubKegiatan: e.target.value }))}
                  placeholder="Contoh: Rekonstruksi / Peningkatan Kapasitas Struktur Jalan"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Volume</label>
                  <input
                    type="text"
                    value={newSubKegiatan.targetVolume}
                    onChange={(e) => setNewSubKegiatan(prev => ({ ...prev, targetVolume: e.target.value }))}
                    placeholder="Contoh: 12.5"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Satuan</label>
                  <input
                    type="text"
                    value={newSubKegiatan.satuan}
                    onChange={(e) => setNewSubKegiatan(prev => ({ ...prev, satuan: e.target.value }))}
                    placeholder="Contoh: Km / Paket / Unit"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sumber Dana</label>
                  <select
                    value={newSubKegiatan.sumberDana}
                    onChange={(e) => setNewSubKegiatan(prev => ({ ...prev, sumberDana: e.target.value }))}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SUMBER_DANA_LIST.map(sd => (
                      <option key={sd} value={sd}>{sd}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pagu Sub-Kegiatan (Rp)</label>
                  <input
                    type="number"
                    value={newSubKegiatan.paguSubKegiatan || ''}
                    onChange={(e) => setNewSubKegiatan(prev => ({ ...prev, paguSubKegiatan: parseFloat(e.target.value) || 0 }))}
                    placeholder="Contoh: 750000000"
                    className="w-full text-xs font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  value={newSubKegiatan.lokasi}
                  onChange={(e) => setNewSubKegiatan(prev => ({ ...prev, lokasi: e.target.value }))}
                  placeholder="Contoh: Kabupaten Nagekeo"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Simpan Sub-Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: LINK USULAN URK TO SUB-KEGIATAN */}
      {isLinkModalOpen && targetSubKegiatan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Akomodasi Usulan Masyarakat (e-URK)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tautkan aspirasi ke Sub-Kegiatan RENJA</p>
              </div>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50/80 rounded-2xl border border-blue-200/70 text-xs">
              <span className="font-bold text-blue-900 block mb-0.5">Target Sub-Kegiatan:</span>
              <div className="font-extrabold text-slate-900">{targetSubKegiatan.namaSubKegiatan}</div>
              <div className="text-[11px] text-blue-800 font-mono mt-0.5">
                Kode: {targetSubKegiatan.kodeSubKegiatan} &bull; Pagu: {formatRupiah(targetSubKegiatan.paguSubKegiatan)}
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Usulan e-URK Tersedia:</label>
                <select
                  value={selectedUrkToLink}
                  onChange={(e) => {
                    setSelectedUrkToLink(e.target.value);
                    const prop = allProposals.find(p => p.id === e.target.value);
                    if (prop) setLinkAlokasiBudget(prop.estimatedBudget);
                  }}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Usulan Masuk --</option>
                  {availableProposals.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.sumberUsulan || 'URK'}] {p.projectName} ({formatRupiah(p.estimatedBudget)}) - {p.kecamatan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alokasi Anggaran Terakomodir (Rp):</label>
                <input
                  type="number"
                  value={linkAlokasiBudget || ''}
                  onChange={(e) => setLinkAlokasiBudget(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-emerald-600 mt-1 block">
                  {formatRupiah(linkAlokasiBudget)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan / Keterangan Penyesuaian:</label>
                <textarea
                  value={linkCatatan}
                  onChange={(e) => setLinkCatatan(e.target.value)}
                  placeholder="Contoh: Diakomodir penuh sesuai pagu indikatif Renja 2025"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteLink}
                  disabled={!selectedUrkToLink}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  Tautkan ke RENJA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
