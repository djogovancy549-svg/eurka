import React, { useState, useEffect } from 'react';
import { Proposal, RenjaProgram, RenjaSubKegiatan, SUMBER_USULAN_OPTIONS } from '../types';
import { 
  getRenjaMasterData, 
  linkUrkToRenja, 
  unlinkUrkFromRenja, 
  RenjaMasterData 
} from '../services/renjaService';
import { getAllBidangConfigs, getNagekeoWilayah } from '../services/configService';
import { getProposalsByBidang } from '../services/proposalService';
import { KecamatanDesa } from '../data/nagekeoWilayah';
import { formatRupiah, printMatriksUrkRenja } from '../utils';
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
  Sparkles
} from 'lucide-react';

interface UrkRenjaMatrixProps {
  userEmail: string;
  userName: string;
  isAdmin?: boolean;
}

export default function UrkRenjaMatrix({ userEmail, userName, isAdmin = true }: UrkRenjaMatrixProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [renjaData, setRenjaData] = useState<RenjaMasterData>({ programs: [], subKegiatan: [] });
  const [wilayahList, setWilayahList] = useState<KecamatanDesa[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSumber, setSelectedSumber] = useState<string>('Semua');
  const [selectedAkomodasi, setSelectedAkomodasi] = useState<string>('Semua'); // 'Semua' | 'terakomodir' | 'belum'
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Link/Edit
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [targetSubId, setTargetSubId] = useState<string>('');
  const [alokasiBudget, setAlokasiBudget] = useState<number>(0);
  const [catatanAkomodasi, setCatatanAkomodasi] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [renjaRes, configs, wilayah] = await Promise.all([
        getRenjaMasterData(),
        getAllBidangConfigs(),
        getNagekeoWilayah()
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

      setProposals(allProps);
    } catch (e) {
      console.error('Error loading Matrix data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Filtered proposals
  const filteredProposals = proposals.filter(p => {
    if (selectedSumber !== 'Semua') {
      const src = p.sumberUsulan || p.jenisUsulan || '';
      if (!src.toLowerCase().includes(selectedSumber.toLowerCase())) return false;
    }

    if (selectedAkomodasi === 'terakomodir' && !p.isAkomodirRenja) return false;
    if (selectedAkomodasi === 'belum' && p.isAkomodirRenja) return false;

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

  // Analytics
  const totalCount = proposals.length;
  const linkedCount = proposals.filter(p => p.isAkomodirRenja).length;
  const unlinkedCount = totalCount - linkedCount;
  const percentAccommodated = totalCount > 0 ? Math.round((linkedCount / totalCount) * 100) : 0;

  const pokirTotal = proposals.filter(p => (p.sumberUsulan || '').includes('POKIR')).length;
  const pokirLinked = proposals.filter(p => (p.sumberUsulan || '').includes('POKIR') && p.isAkomodirRenja).length;

  const musrenbangTotal = proposals.filter(p => (p.sumberUsulan || '').includes('Musrenbang')).length;
  const musrenbangLinked = proposals.filter(p => (p.sumberUsulan || '').includes('Musrenbang') && p.isAkomodirRenja).length;

  const totalUrkBudget = proposals.reduce((a, b) => a + (b.estimatedBudget || 0), 0);
  const totalAccommodatedBudget = proposals
    .filter(p => p.isAkomodirRenja)
    .reduce((a, b) => a + (b.renjaPaguAlokasi || b.estimatedBudget || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
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
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
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

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
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

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rasio Per Sumber Usulan</span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Musrenbang (Desa/Kec):</span>
              <span className="font-bold text-slate-900">
                {musrenbangLinked}/{musrenbangTotal} ({musrenbangTotal > 0 ? Math.round((musrenbangLinked / musrenbangTotal) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">POKIR DPRD:</span>
              <span className="font-bold text-slate-900">
                {pokirLinked}/{pokirTotal} ({pokirTotal > 0 ? Math.round((pokirLinked / pokirTotal) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Sumber Usulan Filter */}
          <select
            value={selectedSumber}
            onChange={e => setSelectedSumber(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua Sumber Usulan</option>
            <option value="Musrenbang Desa">Musrenbang Desa / Kelurahan</option>
            <option value="Musrenbang Kecamatan">Musrenbang Kecamatan</option>
            <option value="POKIR">POKIR DPRD</option>
            <option value="Bidang Teknis">Bidang Teknis Internal</option>
          </select>

          {/* Status Akomodasi Filter */}
          <select
            value={selectedAkomodasi}
            onChange={e => setSelectedAkomodasi(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua Status Keterkaitan</option>
            <option value="terakomodir">✅ Sudah Masuk RENJA</option>
            <option value="belum">⏳ Belum Masuk RENJA</option>
          </select>

          {/* Kecamatan Filter */}
          <select
            value={selectedKecamatan}
            onChange={e => setSelectedKecamatan(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500"
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
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Matrix Table */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-semibold text-sm">Memuat Matriks Keterkaitan URK ↔ RENJA...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
          <GitMerge className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">Tidak ada data usulan yang cocok</p>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian di atas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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

      {/* Modal: Tautkan / Akomodir Usulan URK ke Sub-Kegiatan RENJA */}
      {isLinkModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
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
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Pilih Sub-Kegiatan RENJA --</option>
                  {renjaData.subKegiatan.map(sub => {
                    const prog = renjaData.programs.find(p => p.id === sub.programId);
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
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
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
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                  disabled={!targetSubId}
                  onClick={handleSaveLinkage}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Simpan Penyelarasan RENJA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
