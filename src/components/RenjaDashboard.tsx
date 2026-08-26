import React, { useState, useEffect } from 'react';
import { 
  RenjaProgram, 
  RenjaSubKegiatan, 
  Proposal, 
  BIDANG_LIST 
} from '../types';
import { 
  getRenjaMasterData, 
  saveRenjaMasterData, 
  linkUrkToRenja, 
  unlinkUrkFromRenja, 
  RenjaMasterData 
} from '../services/renjaService';
import { getAllBidangConfigs } from '../services/configService';
import { getProposalsByBidang } from '../services/proposalService';
import { formatRupiah, printDokumenRenja } from '../utils';
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
  AlertCircle
} from 'lucide-react';

interface RenjaDashboardProps {
  userEmail: string;
  userName: string;
  isAdmin?: boolean;
}

export default function RenjaDashboard({ userEmail, userName, isAdmin = true }: RenjaDashboardProps) {
  const [renjaData, setRenjaData] = useState<RenjaMasterData>({ programs: [], subKegiatan: [] });
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBidang, setSelectedBidang] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  // Modals
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [selectedProgramForSub, setSelectedProgramForSub] = useState<string>('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetSubKegiatan, setTargetSubKegiatan] = useState<RenjaSubKegiatan | null>(null);
  const [selectedUrkToLink, setSelectedUrkToLink] = useState<string>('');
  const [linkAlokasiBudget, setLinkAlokasiBudget] = useState<number>(0);
  const [linkCatatan, setLinkCatatan] = useState<string>('');

  // New Program Form State
  const [newProgram, setNewProgram] = useState<Partial<RenjaProgram>>({
    kodeProgram: '1.03.',
    namaProgram: '',
    bidangPengampu: 'SDA',
    indikatorKinerja: '',
    targetKinerja: '',
    paguProgram: 0,
    tahun: '2025'
  });

  // New Sub-Kegiatan Form State
  const [newSubKegiatan, setNewSubKegiatan] = useState<Partial<RenjaSubKegiatan>>({
    kodeSubKegiatan: '1.03.',
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

      // Expand all programs by default
      const exp: Record<string, boolean> = {};
      renjaRes.programs.forEach(p => { exp[p.id] = true; });
      setExpandedPrograms(exp);

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
    await saveRenjaMasterData(updatedPrograms, renjaData.subKegiatan);
    setRenjaData(prev => ({ ...prev, programs: updatedPrograms }));
    setExpandedPrograms(prev => ({ ...prev, [progId]: true }));
    setIsAddProgramOpen(false);
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

  const handleSaveSubKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubKegiatan.namaSubKegiatan || !newSubKegiatan.kodeSubKegiatan || !selectedProgramForSub) return;

    const subId = 'sub_' + Date.now();
    const created: RenjaSubKegiatan = {
      id: subId,
      programId: selectedProgramForSub,
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
    await saveRenjaMasterData(renjaData.programs, updatedSub);
    setRenjaData(prev => ({ ...prev, subKegiatan: updatedSub }));
    setIsAddSubOpen(false);
    setNewSubKegiatan({
      kodeSubKegiatan: '1.03.',
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

  const handleDeleteProgram = async (progId: string) => {
    if (!window.confirm('Yakin ingin menghapus Program ini beserta seluruh Sub-Kegiatannya?')) return;
    const updatedPrograms = renjaData.programs.filter(p => p.id !== progId);
    const updatedSub = renjaData.subKegiatan.filter(s => s.programId !== progId);
    await saveRenjaMasterData(updatedPrograms, updatedSub);
    setRenjaData({ programs: updatedPrograms, subKegiatan: updatedSub });
  };

  const handleDeleteSubKegiatan = async (subId: string) => {
    if (!window.confirm('Yakin ingin menghapus Sub-Kegiatan ini?')) return;
    const updatedSub = renjaData.subKegiatan.filter(s => s.id !== subId);
    await saveRenjaMasterData(renjaData.programs, updatedSub);
    setRenjaData(prev => ({ ...prev, subKegiatan: updatedSub }));
  };

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
  };

  const handleUnlink = async (propId: string) => {
    if (!window.confirm('Lepaskan usulan URK ini dari Sub-Kegiatan RENJA?')) return;
    const prop = allProposals.find(p => p.id === propId);
    if (!prop) return;

    const { updatedProposal, updatedRenja } = await unlinkUrkFromRenja(prop, renjaData);
    setRenjaData(updatedRenja);
    setAllProposals(prev => prev.map(p => p.id === updatedProposal.id ? updatedProposal : p));
  };

  // Calculations & Statistics
  const filteredPrograms = renjaData.programs.filter(p => {
    if (selectedBidang !== 'Semua' && p.bidangPengampu !== selectedBidang) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchProg = p.namaProgram.toLowerCase().includes(q) || p.kodeProgram.toLowerCase().includes(q);
      const subs = renjaData.subKegiatan.filter(s => s.programId === p.id);
      const matchSub = subs.some(s => s.namaSubKegiatan.toLowerCase().includes(q) || s.kodeSubKegiatan.toLowerCase().includes(q));
      return matchProg || matchSub;
    }
    return true;
  });

  const totalPaguRenja = renjaData.subKegiatan.reduce((acc, s) => acc + (s.paguSubKegiatan || 0), 0);
  const totalUrkLinked = allProposals.filter(p => p.isAkomodirRenja).length;
  const totalUrkBudgetLinked = allProposals
    .filter(p => p.isAkomodirRenja)
    .reduce((acc, p) => acc + (p.renjaPaguAlokasi || p.estimatedBudget || 0), 0);

  // Available unlinked proposals for modal
  const availableProposals = allProposals.filter(p => !p.isAkomodirRenja);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-400/30">
              <Building2 className="w-3.5 h-3.5" /> Modul Dokumen Resmi OPD
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Rencana Kerja Perangkat Daerah (RENJA)
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Manajemen Program, Kegiatan, dan Sub-Kegiatan Dinas PUPR Kabupaten Nagekeo. 
              Menampung alokasi program kerja dinas serta mengakomodasi usulan masyarakat (e-URK).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => printDokumenRenja(renjaData.programs, renjaData.subKegiatan, allProposals, '2025')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border border-white/20 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Cetak Dokumen RENJA
            </button>
            {isAdmin && (
              <button
                onClick={() => setIsAddProgramOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/30"
              >
                <Plus className="w-4 h-4" /> Tambah Program Baru
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI & Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pagu RENJA OPD</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-2">
            {formatRupiah(totalPaguRenja)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {renjaData.programs.length} Program &bull; {renjaData.subKegiatan.length} Sub-Kegiatan
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Usulan URK Terakomodir</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LinkIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-600 mt-2">
            {totalUrkLinked} Usulan
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Aspirasi Musrenbang & Pokir yang masuk Renja
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Anggaran URK Terserap</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-indigo-600 mt-2">
            {formatRupiah(totalUrkBudgetLinked)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalPaguRenja > 0 ? `${((totalUrkBudgetLinked / totalPaguRenja) * 100).toFixed(1)}% dari Total Renja` : '0%'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kesiapan SIPD</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-purple-600 mt-2">
            Kepmendagri 050
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Nomenklatur standar perencanaan daerah
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <span className="text-xs font-bold uppercase text-slate-500 mr-2 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Bidang:
          </span>
          {['Semua', 'SDA', 'BM', 'CK', 'PL', 'Tata Ruang', 'Sekretariat'].map(b => (
            <button
              key={b}
              onClick={() => setSelectedBidang(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedBidang === b
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Program / Sub-Kegiatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Program and Sub-Kegiatan List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-semibold text-sm">Memuat Data RENJA OPD...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">Tidak ada Program RENJA yang cocok</p>
          <p className="text-xs text-slate-400 mt-1">Coba ganti filter bidang atau cari kata kunci lain.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrograms.map(program => {
            const subs = renjaData.subKegiatan.filter(s => s.programId === program.id);
            const totalProgSubPagu = subs.reduce((a, b) => a + (b.paguSubKegiatan || 0), 0);
            const isExpanded = !!expandedPrograms[program.id];

            return (
              <div key={program.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                {/* Program Header Accordion */}
                <div 
                  className="p-4 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 transition-colors"
                  onClick={() => toggleProgram(program.id)}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button className="mt-1 text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                          {program.kodeProgram}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-bold">
                          Bidang {program.bidangPengampu}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">TA {program.tahun}</span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 mt-1">
                        {program.namaProgram}
                      </h2>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Indikator: <strong>{program.indikatorKinerja || '-'}</strong></span>
                        <span>Target: <strong className="text-blue-700">{program.targetKinerja || '-'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center" onClick={e => e.stopPropagation()}>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Pagu Program</div>
                      <div className="text-sm font-extrabold text-blue-900">
                        {formatRupiah(totalProgSubPagu || program.paguProgram)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {subs.length} Sub-Kegiatan
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                        <button
                          onClick={() => {
                            setSelectedProgramForSub(program.id);
                            setNewSubKegiatan(prev => ({
                              ...prev,
                              kodeSubKegiatan: program.kodeProgram + '.2.01.',
                              bidangPengampu: program.bidangPengampu
                            }));
                            setIsAddSubOpen(true);
                          }}
                          title="Tambah Sub-Kegiatan"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(program.id)}
                          title="Hapus Program"
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-Kegiatan Table */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {subs.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Belum ada Sub-Kegiatan dalam Program ini.{' '}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedProgramForSub(program.id);
                              setIsAddSubOpen(true);
                            }}
                            className="text-blue-600 font-bold hover:underline ml-1"
                          >
                            + Tambah Sub-Kegiatan
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/75 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                              <th className="p-3">Kode & Sub-Kegiatan</th>
                              <th className="p-3">Kinerja & Target</th>
                              <th className="p-3">Lokasi</th>
                              <th className="p-3">Sumber Dana</th>
                              <th className="p-3 text-right">Pagu Renja</th>
                              <th className="p-3">Akomodasi Usulan URK</th>
                              <th className="p-3 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {subs.map(sub => {
                              // Find all proposals linked to this sub-kegiatan
                              const linked = allProposals.filter(p => p.isAkomodirRenja && p.renjaSubKegiatanId === sub.id);
                              const subLinkedBudget = linked.reduce((a, b) => a + (b.renjaPaguAlokasi || b.estimatedBudget || 0), 0);

                              return (
                                <tr key={sub.id} className="hover:bg-blue-50/30 transition-colors">
                                  <td className="p-3 align-top">
                                    <div className="font-mono text-[11px] font-bold text-slate-600">{sub.kodeSubKegiatan}</div>
                                    <div className="font-bold text-slate-900 text-sm mt-0.5">{sub.namaSubKegiatan}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Bidang: {sub.bidangPengampu}</div>
                                  </td>
                                  <td className="p-3 align-top">
                                    <div className="text-slate-700">{sub.indikatorSubKegiatan || '-'}</div>
                                    <div className="font-bold text-blue-800 mt-1">
                                      Vol: {sub.targetVolume || '-'} {sub.satuan || ''}
                                    </div>
                                  </td>
                                  <td className="p-3 align-top text-slate-700">
                                    {sub.lokasi || 'Nagekeo'}
                                  </td>
                                  <td className="p-3 align-top">
                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                      {sub.sumberDana || 'DAU'}
                                    </span>
                                  </td>
                                  <td className="p-3 align-top text-right">
                                    <div className="font-extrabold text-slate-900 text-sm">
                                      {formatRupiah(sub.paguSubKegiatan)}
                                    </div>
                                    {linked.length > 0 && (
                                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                        URK: {formatRupiah(subLinkedBudget)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 align-top">
                                    {linked.length === 0 ? (
                                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] italic">
                                        <span>Renja Murni Dinas</span>
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5 max-w-xs">
                                        {linked.map(p => (
                                          <div key={p.id} className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-start justify-between gap-1">
                                            <div>
                                              <div className="font-bold truncate max-w-[180px]">{p.projectName}</div>
                                              <div className="text-[9px] text-emerald-700">
                                                {p.sumberUsulan || 'URK'} &bull; {p.desa ? `${p.desa}, ` : ''}{p.kecamatan || ''}
                                              </div>
                                              <div className="font-semibold text-[10px] text-emerald-900 mt-0.5">
                                                {formatRupiah(p.renjaPaguAlokasi || p.estimatedBudget || 0)}
                                              </div>
                                            </div>
                                            {isAdmin && (
                                              <button
                                                onClick={() => handleUnlink(p.id)}
                                                title="Lepaskan Usulan ini dari Renja"
                                                className="text-emerald-700 hover:text-red-600 p-0.5"
                                              >
                                                <Unlink className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 align-top text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => openLinkModal(sub)}
                                        title="Hubungkan Usulan URK (Musrenbang / Pokir)"
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-sm transition-all"
                                      >
                                        <LinkIcon className="w-3 h-3" /> + Tautkan URK
                                      </button>
                                      {isAdmin && (
                                        <button
                                          onClick={() => handleDeleteSubKegiatan(sub.id)}
                                          title="Hapus Sub-Kegiatan"
                                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Tambah Program Baru */}
      {isAddProgramOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> Tambah Program RENJA Baru
              </h2>
              <button onClick={() => setIsAddProgramOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Program (Nomenklatur)</label>
                  <input
                    type="text"
                    required
                    value={newProgram.kodeProgram}
                    onChange={e => setNewProgram({ ...newProgram, kodeProgram: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: 1.03.02"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bidang Pengampu</label>
                  <select
                    value={newProgram.bidangPengampu}
                    onChange={e => setNewProgram({ ...newProgram, bidangPengampu: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {['SDA', 'BM', 'CK', 'PL', 'Tata Ruang', 'Sekretariat'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Program RENJA</label>
                <input
                  type="text"
                  required
                  value={newProgram.namaProgram}
                  onChange={e => setNewProgram({ ...newProgram, namaProgram: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Program Pengelolaan Sumber Daya Air (SDA)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Indikator Kinerja Program</label>
                  <input
                    type="text"
                    value={newProgram.indikatorKinerja}
                    onChange={e => setNewProgram({ ...newProgram, indikatorKinerja: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Persentase Saluran Irigasi Baik"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Kinerja</label>
                  <input
                    type="text"
                    value={newProgram.targetKinerja}
                    onChange={e => setNewProgram({ ...newProgram, targetKinerja: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: 85 %"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Pagu Program (Rp)</label>
                <input
                  type="number"
                  value={newProgram.paguProgram}
                  onChange={e => setNewProgram({ ...newProgram, paguProgram: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProgramOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Sub-Kegiatan Baru */}
      {isAddSubOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" /> Tambah Sub-Kegiatan RENJA
              </h2>
              <button onClick={() => setIsAddSubOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubKegiatan} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Sub-Kegiatan</label>
                  <input
                    type="text"
                    required
                    value={newSubKegiatan.kodeSubKegiatan}
                    onChange={e => setNewSubKegiatan({ ...newSubKegiatan, kodeSubKegiatan: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: 1.03.02.2.01.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sumber Dana</label>
                  <select
                    value={newSubKegiatan.sumberDana}
                    onChange={e => setNewSubKegiatan({ ...newSubKegiatan, sumberDana: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {['DAU', 'DAK Fisik', 'DAK Non-Fisik', 'DBH', 'PAD', 'Lain-lain'].map(sd => (
                      <option key={sd} value={sd}>{sd}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sub-Kegiatan</label>
                <input
                  type="text"
                  required
                  value={newSubKegiatan.namaSubKegiatan}
                  onChange={e => setNewSubKegiatan({ ...newSubKegiatan, namaSubKegiatan: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Pembangunan Jaringan Irigasi Permukaan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Indikator Keluaran</label>
                  <input
                    type="text"
                    value={newSubKegiatan.indikatorSubKegiatan}
                    onChange={e => setNewSubKegiatan({ ...newSubKegiatan, indikatorSubKegiatan: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Panjang Irigasi Dibangun"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Volume & Satuan</label>
                  <input
                    type="text"
                    value={newSubKegiatan.targetVolume}
                    onChange={e => setNewSubKegiatan({ ...newSubKegiatan, targetVolume: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: 5.2 Km"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Target</label>
                  <input
                    type="text"
                    value={newSubKegiatan.lokasi}
                    onChange={e => setNewSubKegiatan({ ...newSubKegiatan, lokasi: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Wilayah Boawae & Aesesa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pagu Sub-Kegiatan (Rp)</label>
                  <input
                    type="number"
                    value={newSubKegiatan.paguSubKegiatan}
                    onChange={e => setNewSubKegiatan({ ...newSubKegiatan, paguSubKegiatan: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Simpan Sub-Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Hubungkan / Tautkan Usulan URK ke Sub-Kegiatan */}
      {isLinkModalOpen && targetSubKegiatan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-emerald-600" /> Akomodasi Usulan URK ke RENJA
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sub-Kegiatan Target: <strong>{targetSubKegiatan.namaSubKegiatan}</strong> ({targetSubKegiatan.kodeSubKegiatan})
                </p>
              </div>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Usulan Aspirasi (e-URK: Musrenbang / Pokir DPRD)
                </label>
                {availableProposals.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                    Semua usulan URK saat ini sudah tertaut ke Sub-Kegiatan RENJA atau belum ada usulan yang tersedia.
                  </div>
                ) : (
                  <select
                    value={selectedUrkToLink}
                    onChange={e => {
                      const id = e.target.value;
                      setSelectedUrkToLink(id);
                      const prop = availableProposals.find(p => p.id === id);
                      if (prop) {
                        setLinkAlokasiBudget(prop.estimatedBudget || 0);
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- Pilih Usulan URK untuk Diakomodir --</option>
                    {availableProposals.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        [{prop.sumberUsulan || 'URK'}] {prop.projectName} - {prop.desa || prop.kecamatan || ''} ({formatRupiah(prop.estimatedBudget)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedUrkToLink && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pagu Anggaran yang Dialokasikan dalam RENJA (Rp)
                    </label>
                    <input
                      type="number"
                      value={linkAlokasiBudget}
                      onChange={e => setLinkAlokasiBudget(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Anda dapat menyesuaikan alokasi anggaran sesuai pagu realistis dinas.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan Akomodasi / Penyelarasan
                    </label>
                    <textarea
                      rows={2}
                      value={linkCatatan}
                      onChange={e => setLinkCatatan(e.target.value)}
                      placeholder="Contoh: Diakomodasi pada paket DAK Fisik penanganan jalan prioritas 2025"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!selectedUrkToLink}
                  onClick={handleExecuteLink}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Akomodir ke Sub-Kegiatan RENJA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
