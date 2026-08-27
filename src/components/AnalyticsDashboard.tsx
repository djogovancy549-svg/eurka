import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Coins, 
  FileText, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Car, 
  Filter, 
  Printer, 
  Download, 
  Layers, 
  Percent, 
  Sliders, 
  ShieldCheck, 
  HelpCircle,
  Loader2,
  ArrowUpRight,
  Calculator
} from 'lucide-react';
import { Proposal, DpaItem, SppdRecord, BIDANG_LIST, SUMBER_DANA_LIST, SUMBER_USULAN_OPTIONS, CostComponentRule } from '../types';
import { getAllBidangConfigs, getNagekeoWilayah } from '../services/configService';
import { getProposalsByBidang } from '../services/proposalService';
import { getRenjaMasterData } from '../services/renjaService';
import { getDpaMasterData } from '../services/dpaService';
import { getCostComponentRules, calculateBudgetBreakdown } from '../services/costRulesService';
import { formatRupiah } from '../utils';
import { KecamatanDesa } from '../data/nagekeoWilayah';
import { useRegisterRefresh } from '../context/RefreshContext';
import RefreshButton from './RefreshButton';

interface AnalyticsDashboardProps {
  userEmail: string;
  userName: string;
  isAdmin: boolean;
}

export default function AnalyticsDashboard({ userEmail, userName, isAdmin }: AnalyticsDashboardProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [dpaItems, setDpaItems] = useState<DpaItem[]>([]);
  const [sppdRecords, setSppdRecords] = useState<SppdRecord[]>([]);
  const [costRules, setCostRules] = useState<CostComponentRule[]>([]);
  const [wilayahList, setWilayahList] = useState<KecamatanDesa[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTahun, setFilterTahun] = useState<string>('Semua');
  const [filterBidang, setFilterBidang] = useState<string>('Semua');
  const [filterSumberUsulan, setFilterSumberUsulan] = useState<string>('Semua');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [configs, dpaData, rules, wilayah] = await Promise.all([
        getAllBidangConfigs(),
        getDpaMasterData(),
        getCostComponentRules(),
        getNagekeoWilayah()
      ]);

      setDpaItems(dpaData.dpaList);
      setSppdRecords(dpaData.sppdList);
      setCostRules(rules);
      setWilayahList(wilayah);

      const allProps: Proposal[] = [];
      await Promise.all(
        configs.map(async (cfg) => {
          try {
            const pList = await getProposalsByBidang(cfg.id, cfg.sheetId);
            allProps.push(...pList);
          } catch (e) {}
        })
      );

      setProposals(allProps);
    } catch (e) {
      console.error('Error loading analytics data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Register with global refresh button in top navigation bar
  useRegisterRefresh('analytics-dashboard', loadAllData);

  // Dynamically collect all available years from input data & default list
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<string>();

    // Baseline years
    const currentYear = new Date().getFullYear();
    for (let y = 2024; y <= Math.max(2027, currentYear + 2); y++) {
      yearsSet.add(y.toString());
    }

    // Add years from Proposals
    proposals.forEach(p => {
      if (p.tahunUsulan && String(p.tahunUsulan).trim()) {
        yearsSet.add(String(p.tahunUsulan).trim());
      }
    });

    // Add years from DPA Items
    dpaItems.forEach(d => {
      if (d.tahun && String(d.tahun).trim()) {
        yearsSet.add(String(d.tahun).trim());
      }
    });

    // Add years from SPPD Records
    sppdRecords.forEach(s => {
      if (s.tanggalBerangkat) {
        const y = s.tanggalBerangkat.slice(0, 4);
        if (y && y.length === 4 && !isNaN(Number(y))) {
          yearsSet.add(y);
        }
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(a) - Number(b));
  }, [proposals, dpaItems, sppdRecords]);

  // Filtered dataset
  const filteredProposals = proposals.filter(p => {
    if (filterTahun !== 'Semua' && String(p.tahunUsulan) !== filterTahun) return false;
    if (filterBidang !== 'Semua' && p.jenisUsulan !== filterBidang && p.programName !== filterBidang) return false;
    if (filterSumberUsulan !== 'Semua' && p.sumberUsulan !== filterSumberUsulan) return false;
    return true;
  });

  const filteredDpa = dpaItems.filter(d => {
    if (filterTahun !== 'Semua' && String(d.tahun) !== filterTahun) return false;
    if (filterBidang !== 'Semua' && d.bidangPengampu !== filterBidang) return false;
    return true;
  });

  const filteredSppd = sppdRecords.filter(s => {
    if (filterTahun !== 'Semua') {
      const year = s.tanggalBerangkat ? s.tanggalBerangkat.slice(0, 4) : '';
      if (year && year !== filterTahun) return false;
    }
    if (filterBidang !== 'Semua' && s.bidangPengampu !== filterBidang) return false;
    return true;
  });

  // Calculate Metrics
  const totalUsulanCount = filteredProposals.length;
  const totalUsulanNominal = filteredProposals.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
  
  const totalDisetujuiProps = filteredProposals.filter(p => p.status === 'diterima' || p.isAkomodirRenja);
  const totalDisetujuiCount = totalDisetujuiProps.length;
  const totalDisetujuiNominal = totalDisetujuiProps.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);

  const akomodirRenjaProps = filteredProposals.filter(p => p.isAkomodirRenja);
  const akomodirRenjaCount = akomodirRenjaProps.length;
  const akomodirRenjaNominal = akomodirRenjaProps.reduce((acc, p) => acc + (p.renjaPaguAlokasi || p.estimatedBudget || 0), 0);
  const akomodirPercent = totalUsulanCount > 0 ? ((akomodirRenjaCount / totalUsulanCount) * 100).toFixed(1) : '0';

  const totalPaguDpa = filteredDpa.reduce((acc, d) => acc + (d.paguDpa || 0), 0);
  const totalRealisasiDpa = filteredDpa.reduce((acc, d) => acc + (d.realisasiKeuangan || 0), 0);
  const totalSisaSilpa = totalPaguDpa - totalRealisasiDpa;
  const realisasiKeuanganPercent = totalPaguDpa > 0 ? ((totalRealisasiDpa / totalPaguDpa) * 100).toFixed(1) : '0';

  const avgRealisasiFisik = filteredDpa.length > 0
    ? (filteredDpa.reduce((acc, d) => acc + (d.realisasiFisik || 0), 0) / filteredDpa.length).toFixed(1)
    : '0';

  const totalSppdNominal = filteredSppd.reduce((acc, s) => acc + (s.totalBiaya || 0), 0);
  const totalSppdCair = filteredSppd.filter(s => s.statusPencairan === 'Cair (SP2D)').reduce((acc, s) => acc + (s.totalBiaya || 0), 0);

  // Group by Kecamatan
  const kecamatanMap: Record<string, { count: number; totalBudget: number; approvedCount: number }> = {};
  wilayahList.forEach(w => {
    kecamatanMap[w.kecamatan] = { count: 0, totalBudget: 0, approvedCount: 0 };
  });

  filteredProposals.forEach(p => {
    const kec = p.kecamatan || 'Lainnya / Luar Wilayah';
    if (!kecamatanMap[kec]) {
      kecamatanMap[kec] = { count: 0, totalBudget: 0, approvedCount: 0 };
    }
    kecamatanMap[kec].count += 1;
    kecamatanMap[kec].totalBudget += (p.estimatedBudget || 0);
    if (p.isAkomodirRenja || p.status === 'diterima') {
      kecamatanMap[kec].approvedCount += 1;
    }
  });

  const kecamatanStatsList = Object.entries(kecamatanMap).sort((a, b) => b[1].totalBudget - a[1].totalBudget);
  const maxKecBudget = Math.max(...kecamatanStatsList.map(k => k[1].totalBudget), 1);

  // Group by Bidang
  const bidangStatsMap: Record<string, { usulanCount: number; usulanBudget: number; dpaBudget: number; realisasiBudget: number }> = {};
  ['SDA', 'BM', 'CK', 'PL', 'Tata Ruang', 'Sekretariat'].forEach(b => {
    bidangStatsMap[b] = { usulanCount: 0, usulanBudget: 0, dpaBudget: 0, realisasiBudget: 0 };
  });

  filteredProposals.forEach(p => {
    const b = p.jenisUsulan || 'SDA';
    if (bidangStatsMap[b]) {
      bidangStatsMap[b].usulanCount += 1;
      bidangStatsMap[b].usulanBudget += (p.estimatedBudget || 0);
    }
  });

  filteredDpa.forEach(d => {
    const b = d.bidangPengampu || 'SDA';
    if (bidangStatsMap[b]) {
      bidangStatsMap[b].dpaBudget += (d.paguDpa || 0);
      bidangStatsMap[b].realisasiBudget += (d.realisasiKeuangan || 0);
    }
  });

  // Group by Sumber Usulan
  const sumberUsulanMap: Record<string, { count: number; budget: number }> = {};
  filteredProposals.forEach(p => {
    const s = p.sumberUsulan || 'Musrenbang Desa / Kelurahan';
    if (!sumberUsulanMap[s]) {
      sumberUsulanMap[s] = { count: 0, budget: 0 };
    }
    sumberUsulanMap[s].count += 1;
    sumberUsulanMap[s].budget += (p.estimatedBudget || 0);
  });

  // Group by Sumber Dana DPA
  const sumberDanaDpaMap: Record<string, { count: number; pagu: number; realisasi: number }> = {};
  filteredDpa.forEach(d => {
    const sources = (d.sumberDana || 'DAU').split(',').map(s => s.trim()).filter(Boolean);
    sources.forEach(sd => {
      if (!sumberDanaDpaMap[sd]) {
        sumberDanaDpaMap[sd] = { count: 0, pagu: 0, realisasi: 0 };
      }
      sumberDanaDpaMap[sd].count += 1;
      sumberDanaDpaMap[sd].pagu += (d.paguDpa || 0) / sources.length;
      sumberDanaDpaMap[sd].realisasi += (d.realisasiKeuangan || 0) / sources.length;
    });
  });

  // Group by SIPD Status
  const sipdMap = {
    draft: filteredProposals.filter(p => !p.sipdStatus || p.sipdStatus === 'draft').length,
    siap_sipd: filteredProposals.filter(p => p.sipdStatus === 'siap_sipd').length,
    sudah_sipd: filteredProposals.filter(p => p.sipdStatus === 'sudah_sipd').length,
    ditolak_sipd: filteredProposals.filter(p => p.sipdStatus === 'ditolak_sipd').length,
  };

  // Standard Cost Breakdown based on Total Pagu DPA
  const costBreakdown = calculateBudgetBreakdown(totalPaguDpa, costRules);

  const handlePrintAnalytics = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800">Menghimpun Rekapitulasi & Analitik Data...</h3>
        <p className="text-xs text-slate-500 mt-1">Mengolah data e-URK, RENJA OPD, dan Dokumen Pelaksanaan Anggaran (DPA).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-500/30 border border-blue-400/40 rounded-full text-blue-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              Executive Analytics Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Rekapitulasi & Analitik Data Perencanaan Terpadu
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Analisis komprehensif penyerapan anggaran, sebaran usulan per kecamatan, komparasi pagu definitif DPA, dan proporsi belanja penunjang DPUPR Nagekeo.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <RefreshButton variant="outline" label="Segarkan" />
          <button
            type="button"
            onClick={handlePrintAnalytics}
            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4 text-blue-600" /> Cetak Rekapitulasi Eksekutif
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" /> Filter Analisis:
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tahun */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span>Tahun:</span>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Bidang */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span>Bidang:</span>
            <select
              value={filterBidang}
              onChange={(e) => setFilterBidang(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Bidang</option>
              <option value="SDA">SDA (Sumber Daya Air)</option>
              <option value="BM">Bina Marga (Jalan & Jembatan)</option>
              <option value="CK">Cipta Karya</option>
              <option value="PL">Perumahan & Permukiman</option>
              <option value="Tata Ruang">Tata Ruang</option>
              <option value="Sekretariat">Sekretariat</option>
            </select>
          </div>

          {/* Sumber Usulan */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span>Sumber Usulan:</span>
            <select
              value={filterSumberUsulan}
              onChange={(e) => setFilterSumberUsulan(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
            >
              <option value="Semua">Semua Sumber</option>
              {SUMBER_USULAN_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usulan Masuk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Total Usulan e-URK</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600"><FileText className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalUsulanCount} Usulan</div>
          <div className="text-xs font-extrabold text-blue-600 mt-1">{formatRupiah(totalUsulanNominal)}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span>Disetujui:</span> <strong className="text-slate-700">{totalDisetujuiCount} usulan</strong>
          </div>
        </div>

        {/* Diakomodir RENJA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Akomodasi ke RENJA OPD</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Layers className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-indigo-700">{akomodirRenjaCount} Usulan</div>
          <div className="text-xs font-extrabold text-indigo-600 mt-1">{formatRupiah(akomodirRenjaNominal)}</div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Tingkat Akomodasi:</span>
            <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{akomodirPercent}%</span>
          </div>
        </div>

        {/* Pagu Definitif DPA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Pagu Definitif DPA SKPD</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Coins className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatRupiah(totalPaguDpa)}</div>
          <div className="text-xs font-extrabold text-emerald-600 mt-1">
            Realisasi: {formatRupiah(totalRealisasiDpa)} ({realisasiKeuanganPercent}%)
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Rata-rata Fisik:</span>
            <span className="font-extrabold text-emerald-700">{avgRealisasiFisik}%</span>
          </div>
        </div>

        {/* Realisasi SPPD & Sisa Kas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Realisasi SPPD & Sisa Kas</span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600"><Car className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-teal-800">{formatRupiah(totalSppdNominal)}</div>
          <div className="text-xs font-extrabold text-teal-600 mt-1">
            Cair SP2D: {formatRupiah(totalSppdCair)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Sisa Kas (Silpa):</span>
            <span className="font-extrabold text-blue-700">{formatRupiah(totalSisaSilpa)}</span>
          </div>
        </div>
      </div>

      {/* SECTION: SEBARAN WILAYAH & BIDANG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Usulan per Wilayah Kecamatan (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Sebaran Usulan Berdasarkan Kecamatan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan akumulasi nilai usulan pembangunan di 7 wilayah kecamatan Kabupaten Nagekeo.
              </p>
            </div>
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
              {kecamatanStatsList.length} Wilayah
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {kecamatanStatsList.map(([kecName, stats], idx) => {
              const barWidth = maxKecBudget > 0 ? Math.max((stats.totalBudget / maxKecBudget) * 100, 4) : 0;
              return (
                <div key={kecName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{kecName}</span>
                      <span className="text-[11px] text-slate-400 font-medium">({stats.count} usulan)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900">{formatRupiah(stats.totalBudget)}</span>
                      {stats.approvedCount > 0 && (
                        <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {stats.approvedCount} disetujui
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown per Bidang (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Alokasi Anggaran per Bidang
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Pagu DPA Definitif vs Realisasi Keuangan.</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(bidangStatsMap).map(([bidang, bStats]) => {
              const pct = bStats.dpaBudget > 0 ? ((bStats.realisasiBudget / bStats.dpaBudget) * 100).toFixed(1) : '0';
              return (
                <div key={bidang} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      <span className="text-xs font-black text-slate-900">{bidang}</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                      {pct}% Serapan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/50">
                    <div>
                      <span className="text-slate-400 block font-medium">Pagu DPA:</span>
                      <span className="font-extrabold text-slate-800">{formatRupiah(bStats.dpaBudget)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block font-medium">Realisasi:</span>
                      <span className="font-extrabold text-emerald-700">{formatRupiah(bStats.realisasiBudget)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION: STANDAR KOMPOSISI BIAYA & SUMBER DANA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Standar Komposisi Biaya (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-600" />
                Proporsi Komponen Biaya Anggaran (Standar Evaluasi)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimasi pembagian pagu DPA ({formatRupiah(totalPaguDpa)}) berdasarkan aturan batas persentase admin.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {costBreakdown.items.map((item) => (
              <div key={item.rule.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">{item.rule.name}</span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-white px-1.5 py-0.5 rounded border">
                      {item.percentage}% (Maks {item.rule.maxPercentage}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">{item.rule.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-slate-900">{formatRupiah(item.nominal)}</div>
                  <span className={`text-[10px] font-bold ${item.exceedsMax ? 'text-red-600' : 'text-emerald-600'}`}>
                    {item.exceedsMax ? 'Melebihi Batas' : 'Sesuai Standar'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sumber Dana & SIPD Matrix (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sumber Dana Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-600" />
              Penyerapan per Sumber Dana
            </h3>
            
            <div className="space-y-2.5">
              {Object.entries(sumberDanaDpaMap).map(([sdName, val]) => {
                const pct = val.pagu > 0 ? ((val.realisasi / val.pagu) * 100).toFixed(1) : '0';
                return (
                  <div key={sdName} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{sdName}</span>
                      <div className="text-[10px] text-slate-400">Pagu: {formatRupiah(val.pagu)}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-700">{pct}%</span>
                      <div className="text-[10px] text-slate-500">Cair: {formatRupiah(val.realisasi)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status SIPD Kemendagri */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Status Sinkronisasi SIPD RI
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <div className="text-xs text-blue-700 font-bold">Siap Input SIPD</div>
                <div className="text-xl font-black text-blue-900 mt-1">{sipdMap.siap_sipd}</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="text-xs text-emerald-700 font-bold">Sudah di SIPD</div>
                <div className="text-xl font-black text-emerald-900 mt-1">{sipdMap.sudah_sipd}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
