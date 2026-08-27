import React, { useState, useEffect, useMemo } from 'react';
import { 
  DpaItem, 
  SppdRecord, 
  RenjaSubKegiatan, 
  SUMBER_DANA_LIST 
} from '../types';
import { 
  getDpaMasterData, 
  saveDpaMasterData, 
  importRenjaToDpa 
} from '../services/dpaService';
import { getRenjaMasterData } from '../services/renjaService';
import { 
  formatRupiah, 
  printDokumenDpa, 
  printRekapSppd, 
  printRincianSppd 
} from '../utils';
import { useRegisterRefresh } from '../context/RefreshContext';
import RefreshButton from './RefreshButton';
import { 
  WalletCards, 
  Coins, 
  Receipt, 
  Printer, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Car, 
  Plane, 
  Download, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowUpRight, 
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  DollarSign
} from 'lucide-react';

interface DpaDashboardProps {
  userEmail: string;
  userName: string;
  isAdmin: boolean;
}

export default function DpaDashboard({ userEmail, userName, isAdmin }: DpaDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dpa' | 'sppd'>('dpa');
  const [dpaList, setDpaList] = useState<DpaItem[]>([]);
  const [sppdList, setSppdList] = useState<SppdRecord[]>([]);
  const [renjaSubs, setRenjaSubs] = useState<RenjaSubKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBidang, setSelectedBidang] = useState<string>('Semua');
  const [selectedSumberDana, setSelectedSumberDana] = useState<string>('Semua');
  const [selectedStatusSppd, setSelectedStatusSppd] = useState<string>('Semua');
  const [selectedJenisSppd, setSelectedJenisSppd] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showDpaModal, setShowDpaModal] = useState(false);
  const [editingDpa, setEditingDpa] = useState<DpaItem | null>(null);
  
  const [showRealisasiModal, setShowRealisasiModal] = useState(false);
  const [selectedDpaForRealisasi, setSelectedDpaForRealisasi] = useState<DpaItem | null>(null);
  const [realisasiForm, setRealisasiForm] = useState<{ realisasiKeuangan: number; realisasiFisik: number; keterangan: string }>({
    realisasiKeuangan: 0,
    realisasiFisik: 0,
    keterangan: ''
  });

  const [showSppdModal, setShowSppdModal] = useState(false);
  const [editingSppd, setEditingSppd] = useState<SppdRecord | null>(null);

  // Form State for DPA
  const [dpaForm, setDpaForm] = useState<Partial<DpaItem>>({
    tahun: '2025',
    nomorDpa: '',
    kodeProgram: '',
    namaProgram: '',
    kodeSubKegiatan: '',
    namaSubKegiatan: '',
    bidangPengampu: 'BM',
    sumberDana: 'DAU',
    paguDpa: 0,
    paguSppd: 0,
    realisasiKeuangan: 0,
    realisasiFisik: 0,
    targetKinerja: '',
    keterangan: ''
  });

  // Form State for SPPD
  const [sppdForm, setSppdForm] = useState<Partial<SppdRecord>>({
    dpaItemId: '',
    kodeSubKegiatan: '',
    namaSubKegiatan: '',
    bidangPengampu: 'BM',
    nomorSpt: '',
    nomorSppd: '',
    namaPelaksana: '',
    nipPelaksana: '',
    pangkatGolongan: '',
    jabatan: '',
    maksudPerjalanan: '',
    jenisPerjalanan: 'Dalam Daerah',
    lokasiTujuan: '',
    tanggalBerangkat: new Date().toISOString().split('T')[0],
    tanggalKembali: new Date().toISOString().split('T')[0],
    lamaHari: 1,
    biayaUangHarian: 350000,
    biayaTransport: 150000,
    biayaPenginapan: 0,
    biayaLainnya: 0,
    totalBiaya: 500000,
    sumberDana: 'DAU',
    statusPencairan: 'Disetujui',
    noSp2d: '',
    tglSp2d: '',
    catatan: ''
  });

  // Load Initial Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dpaData, renjaData] = await Promise.all([
        getDpaMasterData(),
        getRenjaMasterData()
      ]);
      setDpaList(dpaData.dpaList);
      setSppdList(dpaData.sppdList);
      setRenjaSubs(renjaData.subKegiatan);
    } catch (e) {
      console.error('Failed to load DPA & SPPD data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Register with global refresh button in top navigation bar
  useRegisterRefresh('dpa-dashboard', loadData);

  // Auto calculate total SPPD when sub costs change
  useEffect(() => {
    const uangHarian = Number(sppdForm.biayaUangHarian) || 0;
    const transport = Number(sppdForm.biayaTransport) || 0;
    const hotel = Number(sppdForm.biayaPenginapan) || 0;
    const lainnya = Number(sppdForm.biayaLainnya) || 0;
    const total = uangHarian + transport + hotel + lainnya;
    setSppdForm(prev => ({ ...prev, totalBiaya: total }));
  }, [
    sppdForm.biayaUangHarian,
    sppdForm.biayaTransport,
    sppdForm.biayaPenginapan,
    sppdForm.biayaLainnya
  ]);

  // Import from RENJA helper
  const handleImportFromRenja = async () => {
    if (renjaSubs.length === 0) {
      alert('Belum ada data sub-kegiatan di modul RENJA OPD untuk diimpor.');
      return;
    }

    if (window.confirm(`Konfirmasi impor seluruh ${renjaSubs.length} sub-kegiatan dari RENJA OPD menjadi dokumen DPA? Data yang sudah ada tidak akan diduplikasi.`)) {
      setLoading(true);
      const res = await importRenjaToDpa(renjaSubs, dpaList, sppdList);
      setDpaList(res.updatedDpa);
      setLoading(false);
      alert(`Berhasil mengimpor ${res.addedCount} Sub-Kegiatan baru ke dalam DPA.`);
    }
  };

  // Save DPA item
  const handleSaveDpa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpaForm.kodeSubKegiatan || !dpaForm.namaSubKegiatan) {
      alert('Mohon lengkapi kode dan nama sub-kegiatan DPA.');
      return;
    }

    let updatedDpaList: DpaItem[];
    if (editingDpa) {
      updatedDpaList = dpaList.map(item => 
        item.id === editingDpa.id ? { 
          ...item, 
          ...dpaForm, 
          updatedAt: new Date().toISOString() 
        } as DpaItem : item
      );
    } else {
      const newItem: DpaItem = {
        id: `dpa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tahun: dpaForm.tahun || '2025',
        nomorDpa: dpaForm.nomorDpa || `DPA/A.1/1.03.0.00.0.00.01.0000/${(dpaForm.kodeSubKegiatan || '').slice(-2)}/2025`,
        kodeProgram: dpaForm.kodeProgram || '',
        namaProgram: dpaForm.namaProgram || '',
        kodeSubKegiatan: dpaForm.kodeSubKegiatan || '',
        namaSubKegiatan: dpaForm.namaSubKegiatan || '',
        bidangPengampu: dpaForm.bidangPengampu || 'BM',
        sumberDana: dpaForm.sumberDana || 'DAU',
        paguDpa: Number(dpaForm.paguDpa) || 0,
        paguSppd: Number(dpaForm.paguSppd) || 0,
        realisasiKeuangan: Number(dpaForm.realisasiKeuangan) || 0,
        realisasiFisik: Number(dpaForm.realisasiFisik) || 0,
        targetKinerja: dpaForm.targetKinerja || '',
        keterangan: dpaForm.keterangan || '',
        updatedAt: new Date().toISOString()
      };
      updatedDpaList = [newItem, ...dpaList];
    }

    setDpaList(updatedDpaList);
    await saveDpaMasterData(updatedDpaList, sppdList);
    setShowDpaModal(false);
    setEditingDpa(null);
  };

  const handleDeleteDpa = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus sub-kegiatan DPA ini?')) return;
    const updated = dpaList.filter(d => d.id !== id);
    setDpaList(updated);
    await saveDpaMasterData(updated, sppdList);
  };

  // Quick update Realisasi
  const handleUpdateRealisasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDpaForRealisasi) return;

    const updated = dpaList.map(d => {
      if (d.id === selectedDpaForRealisasi.id) {
        return {
          ...d,
          realisasiKeuangan: Number(realisasiForm.realisasiKeuangan) || 0,
          realisasiFisik: Number(realisasiForm.realisasiFisik) || 0,
          keterangan: realisasiForm.keterangan || d.keterangan,
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    });

    setDpaList(updated);
    await saveDpaMasterData(updated, sppdList);
    setShowRealisasiModal(false);
    setSelectedDpaForRealisasi(null);
  };

  // Save SPPD record
  const handleSaveSppd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sppdForm.namaPelaksana || !sppdForm.maksudPerjalanan) {
      alert('Mohon isi nama pelaksana dan maksud perjalanan dinas.');
      return;
    }

    // Auto populate Sub-Kegiatan info if selected
    let targetSubName = sppdForm.namaSubKegiatan;
    let targetSubCode = sppdForm.kodeSubKegiatan;
    let targetBidang = sppdForm.bidangPengampu;
    let targetSd = sppdForm.sumberDana;

    if (sppdForm.dpaItemId) {
      const matched = dpaList.find(d => d.id === sppdForm.dpaItemId);
      if (matched) {
        targetSubName = matched.namaSubKegiatan;
        targetSubCode = matched.kodeSubKegiatan;
        targetBidang = matched.bidangPengampu;
        targetSd = matched.sumberDana;
      }
    }

    let updatedSppdList: SppdRecord[];
    if (editingSppd) {
      updatedSppdList = sppdList.map(item => 
        item.id === editingSppd.id ? { 
          ...item, 
          ...sppdForm, 
          namaSubKegiatan: targetSubName,
          kodeSubKegiatan: targetSubCode,
          bidangPengampu: targetBidang || 'BM',
          sumberDana: targetSd || 'DAU',
          updatedAt: new Date().toISOString() 
        } as SppdRecord : item
      );
    } else {
      const newSppd: SppdRecord = {
        id: `sppd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        dpaItemId: sppdForm.dpaItemId || '',
        kodeSubKegiatan: targetSubCode || '',
        namaSubKegiatan: targetSubName || '',
        bidangPengampu: targetBidang || 'BM',
        nomorSpt: sppdForm.nomorSpt || `090/PUPR/SPT/${Math.floor(100 + Math.random() * 900)}/2025`,
        nomorSppd: sppdForm.nomorSppd || `090/PUPR/SPPD/${Math.floor(100 + Math.random() * 900)}/2025`,
        namaPelaksana: sppdForm.namaPelaksana || '',
        nipPelaksana: sppdForm.nipPelaksana || '',
        pangkatGolongan: sppdForm.pangkatGolongan || '',
        jabatan: sppdForm.jabatan || '',
        maksudPerjalanan: sppdForm.maksudPerjalanan || '',
        jenisPerjalanan: (sppdForm.jenisPerjalanan as any) || 'Dalam Daerah',
        lokasiTujuan: sppdForm.lokasiTujuan || '',
        tanggalBerangkat: sppdForm.tanggalBerangkat || '',
        tanggalKembali: sppdForm.tanggalKembali || '',
        lamaHari: Number(sppdForm.lamaHari) || 1,
        biayaUangHarian: Number(sppdForm.biayaUangHarian) || 0,
        biayaTransport: Number(sppdForm.biayaTransport) || 0,
        biayaPenginapan: Number(sppdForm.biayaPenginapan) || 0,
        biayaLainnya: Number(sppdForm.biayaLainnya) || 0,
        totalBiaya: Number(sppdForm.totalBiaya) || 0,
        sumberDana: targetSd || 'DAU',
        statusPencairan: (sppdForm.statusPencairan as any) || 'Disetujui',
        noSp2d: sppdForm.noSp2d || '',
        tglSp2d: sppdForm.tglSp2d || '',
        catatan: sppdForm.catatan || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedSppdList = [newSppd, ...sppdList];
    }

    setSppdList(updatedSppdList);
    await saveDpaMasterData(dpaList, updatedSppdList);
    setShowSppdModal(false);
    setEditingSppd(null);
  };

  const handleDeleteSppd = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus arsip SPPD ini?')) return;
    const updated = sppdList.filter(s => s.id !== id);
    setSppdList(updated);
    await saveDpaMasterData(dpaList, updated);
  };

  // Quick SPPD Status update
  const handleUpdateSppdStatus = async (sppd: SppdRecord, newStatus: SppdRecord['statusPencairan']) => {
    let sp2d = sppd.noSp2d;
    let tgl = sppd.tglSp2d;

    if (newStatus === 'Cair (SP2D)' && !sp2d) {
      const inputSp2d = prompt('Masukkan Nomor SP2D / Bukti Cair:', `SP2D/PUPR/${Math.floor(1000 + Math.random() * 9000)}/2025`);
      if (inputSp2d === null) return;
      sp2d = inputSp2d;
      tgl = new Date().toISOString().split('T')[0];
    }

    const updated = sppdList.map(s => {
      if (s.id === sppd.id) {
        return {
          ...s,
          statusPencairan: newStatus,
          noSp2d: sp2d,
          tglSp2d: tgl,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    });

    setSppdList(updated);
    await saveDpaMasterData(dpaList, updated);
  };

  // Filtered DPA items
  const filteredDpaList = useMemo(() => {
    return dpaList.filter(item => {
      if (selectedBidang !== 'Semua' && item.bidangPengampu !== selectedBidang) return false;
      if (selectedSumberDana !== 'Semua' && !(item.sumberDana || 'DAU').includes(selectedSumberDana)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.kodeSubKegiatan.toLowerCase().includes(q);
        const matchName = item.namaSubKegiatan.toLowerCase().includes(q);
        const matchDpa = (item.nomorDpa || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchDpa) return false;
      }
      return true;
    });
  }, [dpaList, selectedBidang, selectedSumberDana, searchQuery]);

  // Filtered SPPD items
  const filteredSppdList = useMemo(() => {
    return sppdList.filter(s => {
      if (selectedBidang !== 'Semua' && s.bidangPengampu !== selectedBidang) return false;
      if (selectedSumberDana !== 'Semua' && !(s.sumberDana || 'DAU').includes(selectedSumberDana)) return false;
      if (selectedStatusSppd !== 'Semua' && s.statusPencairan !== selectedStatusSppd) return false;
      if (selectedJenisSppd !== 'Semua' && s.jenisPerjalanan !== selectedJenisSppd) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPelaksana = s.namaPelaksana.toLowerCase().includes(q);
        const matchMaksud = s.maksudPerjalanan.toLowerCase().includes(q);
        const matchSpt = s.nomorSpt.toLowerCase().includes(q);
        const matchTujuan = s.lokasiTujuan.toLowerCase().includes(q);
        if (!matchPelaksana && !matchMaksud && !matchSpt && !matchTujuan) return false;
      }
      return true;
    });
  }, [sppdList, selectedBidang, selectedSumberDana, selectedStatusSppd, selectedJenisSppd, searchQuery]);

  // High-Level Statistics
  const stats = useMemo(() => {
    const currentDpa = dpaList.filter(d => selectedBidang === 'Semua' || d.bidangPengampu === selectedBidang);
    const currentSppd = sppdList.filter(s => selectedBidang === 'Semua' || s.bidangPengampu === selectedBidang);

    const totalPaguDpa = currentDpa.reduce((a, b) => a + (b.paguDpa || 0), 0);
    const totalRealisasi = currentDpa.reduce((a, b) => a + (b.realisasiKeuangan || 0), 0);
    const sisaPagu = totalPaguDpa - totalRealisasi;
    const persentaseRealisasi = totalPaguDpa > 0 ? (totalRealisasi / totalPaguDpa) * 100 : 0;

    const totalSppdTerpakai = currentSppd.reduce((a, b) => a + (b.totalBiaya || 0), 0);
    const sppdDalamDaerah = currentSppd.filter(s => s.jenisPerjalanan === 'Dalam Daerah').reduce((a, b) => a + (b.totalBiaya || 0), 0);
    const sppdLuarDaerah = currentSppd.filter(s => s.jenisPerjalanan === 'Luar Daerah').reduce((a, b) => a + (b.totalBiaya || 0), 0);
    const sppdCairCount = currentSppd.filter(s => s.statusPencairan === 'Cair (SP2D)').length;

    // Per sumber dana
    const sdMap: Record<string, { pagu: number; realisasi: number }> = {};
    currentDpa.forEach(d => {
      const sources = (d.sumberDana || 'DAU').split(',').map(s => s.trim()).filter(Boolean);
      sources.forEach(sd => {
        if (!sdMap[sd]) sdMap[sd] = { pagu: 0, realisasi: 0 };
        sdMap[sd].pagu += (d.paguDpa || 0) / sources.length;
        sdMap[sd].realisasi += (d.realisasiKeuangan || 0) / sources.length;
      });
    });

    return {
      totalPaguDpa,
      totalRealisasi,
      sisaPagu,
      persentaseRealisasi,
      totalSppdTerpakai,
      sppdDalamDaerah,
      sppdLuarDaerah,
      sppdCount: currentSppd.length,
      sppdCairCount,
      sdMap
    };
  }, [dpaList, sppdList, selectedBidang]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <WalletCards className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400 text-blue-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Dokumen Pelaksanaan Anggaran
              </span>
              <span className="bg-white/10 text-white/90 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                TA 2025
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              DPA & Realisasi SPPD Dinas PUPR
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Pantau alokasi pagu definitif DPA per program/sub-kegiatan, realisasi fisik & keuangan, serta rincian penggunaan anggaran SPPD (Perjalanan Dinas) seluruh bidang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton variant="outline" label="Segarkan" />
            <button
              onClick={() => printDokumenDpa(dpaList, sppdList, selectedBidang)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Cetak DPA</span>
            </button>

            <button
              onClick={() => printRekapSppd(sppdList, selectedBidang)}
              className="flex items-center gap-2 bg-emerald-600/80 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>Rekap SPPD</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleImportFromRenja}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Impor dari RENJA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pagu DPA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pagu DPA</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">
            {formatRupiah(stats.totalPaguDpa)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
            <span>{dpaList.length} Sub-Kegiatan Definitif</span>
          </div>
        </div>

        {/* Realisasi Keuangan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Realisasi Keuangan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700">
            {formatRupiah(stats.totalRealisasi)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>Penyerapan:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {stats.persentaseRealisasi.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, stats.persentaseRealisasi)}%` }}
            />
          </div>
        </div>

        {/* Sisa Anggaran (Silpa) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sisa Pagu (Silpa)</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800">
            {formatRupiah(stats.sisaPagu)}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            Tersedia untuk pelaksanaan kegiatan
          </div>
        </div>

        {/* SPPD Terpakai */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm bg-amber-50/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">SPPD Terpakai</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-800">
            {formatRupiah(stats.totalSppdTerpakai)}
          </div>
          <div className="flex items-center justify-between text-xs text-amber-900/80 mt-2 font-medium">
            <span>{stats.sppdCount} Dokumen SPT</span>
            <span className="font-bold">{stats.sppdCairCount} Sudah Cair</span>
          </div>
        </div>
      </div>

      {/* REKAP PAGU & REALISASI PER SUMBER DANA */}
      {Object.keys(stats.sdMap).length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Pagu DPA & Penyerapan Berdasarkan Sumber Dana
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(stats.sdMap) as [string, { pagu: number; realisasi: number }][]).map(([sd, val]) => {
              const pct = val.pagu > 0 ? ((val.realisasi / val.pagu) * 100).toFixed(1) : '0';
              return (
                <div key={sd} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{sd}</span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {pct}% Cair
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    Pagu: {formatRupiah(val.pagu)}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                    Realisasi: {formatRupiah(val.realisasi)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NAVIGATION TABS & FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          {/* Main Tab Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dpa')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'dpa'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <WalletCards className="w-4 h-4" />
              <span>1. Anggaran DPA Sub-Kegiatan ({filteredDpaList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sppd')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'sppd'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>2. Pengeluaran & Arsip SPPD ({filteredSppdList.length})</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'dpa' ? (
              <button
                onClick={() => {
                  setEditingDpa(null);
                  setDpaForm({
                    tahun: '2025',
                    nomorDpa: '',
                    kodeProgram: '',
                    namaProgram: '',
                    kodeSubKegiatan: '',
                    namaSubKegiatan: '',
                    bidangPengampu: 'BM',
                    sumberDana: 'DAU',
                    paguDpa: 0,
                    paguSppd: 0,
                    realisasiKeuangan: 0,
                    realisasiFisik: 0,
                    targetKinerja: '',
                    keterangan: ''
                  });
                  setShowDpaModal(true);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah DPA Sub-Kegiatan</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingSppd(null);
                  setSppdForm({
                    dpaItemId: dpaList[0]?.id || '',
                    kodeSubKegiatan: dpaList[0]?.kodeSubKegiatan || '',
                    namaSubKegiatan: dpaList[0]?.namaSubKegiatan || '',
                    bidangPengampu: dpaList[0]?.bidangPengampu || 'BM',
                    nomorSpt: `090/PUPR/SPT/${Math.floor(100 + Math.random() * 900)}/2025`,
                    nomorSppd: `090/PUPR/SPPD/${Math.floor(100 + Math.random() * 900)}/2025`,
                    namaPelaksana: '',
                    nipPelaksana: '',
                    pangkatGolongan: '',
                    jabatan: '',
                    maksudPerjalanan: '',
                    jenisPerjalanan: 'Dalam Daerah',
                    lokasiTujuan: '',
                    tanggalBerangkat: new Date().toISOString().split('T')[0],
                    tanggalKembali: new Date().toISOString().split('T')[0],
                    lamaHari: 1,
                    biayaUangHarian: 350000,
                    biayaTransport: 150000,
                    biayaPenginapan: 0,
                    biayaLainnya: 0,
                    totalBiaya: 500000,
                    sumberDana: 'DAU',
                    statusPencairan: 'Disetujui',
                    noSp2d: '',
                    tglSp2d: '',
                    catatan: ''
                  });
                  setShowSppdModal(true);
                }}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Terbitkan SPT / SPPD Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Bidang */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Bidang:
              </span>
              {['Semua', 'SDA', 'BM', 'CK', 'PL', 'Tata Ruang', 'Sekretariat'].map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBidang(b)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    selectedBidang === b
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Filter Sumber Dana */}
            <select
              value={selectedSumberDana}
              onChange={(e) => setSelectedSumberDana(e.target.value)}
              className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Sumber Dana</option>
              {SUMBER_DANA_LIST.map(sd => (
                <option key={sd} value={sd}>{sd}</option>
              ))}
            </select>

            {activeTab === 'sppd' && (
              <>
                <select
                  value={selectedJenisSppd}
                  onChange={(e) => setSelectedJenisSppd(e.target.value)}
                  className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
                >
                  <option value="Semua">Semua Jenis Perjalanan</option>
                  <option value="Dalam Daerah">Dalam Daerah (Kecamatan)</option>
                  <option value="Luar Daerah">Luar Daerah (Kupang/Jakarta/dll)</option>
                </select>

                <select
                  value={selectedStatusSppd}
                  onChange={(e) => setSelectedStatusSppd(e.target.value)}
                  className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
                >
                  <option value="Semua">Semua Status Pencairan</option>
                  <option value="Draft">Draft</option>
                  <option value="Pengajuan">Pengajuan</option>
                  <option value="Disetujui">Disetujui (Belum Cair)</option>
                  <option value="Cair (SP2D)">Cair (SP2D Terbit)</option>
                </select>
              </>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'dpa' ? "Cari Sub-Kegiatan DPA..." : "Cari Pelaksana / Tujuan SPT..."}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REALISASI DPA PROGRAM & SUB-KEGIATAN */}
      {/* ========================================================================= */}
      {activeTab === 'dpa' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Matriks Realisasi DPA Sub-Kegiatan Bidang DPUPR
              </h2>
              <p className="text-xs text-slate-500">
                Klik tombol "Update Realisasi" pada baris sub-kegiatan untuk memperbarui penyerapan anggaran dan persentase fisik.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
              {filteredDpaList.length} Item Ditampilkan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3 w-32">Kode Sub-Keg</th>
                  <th className="p-3">Nama Program / Sub-Kegiatan</th>
                  <th className="p-3 text-center w-24">Bidang</th>
                  <th className="p-3 text-center w-24">Sumber Dana</th>
                  <th className="p-3 text-right w-36">Pagu DPA</th>
                  <th className="p-3 text-right w-36">Realisasi Keuangan</th>
                  <th className="p-3 text-center w-28">Fisik (%)</th>
                  <th className="p-3 text-right w-36">Sisa Pagu</th>
                  <th className="p-3 text-right w-32">SPPD Terpakai</th>
                  <th className="p-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDpaList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                      Belum ada data DPA yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredDpaList.map((item, idx) => {
                    const itemSppd = sppdList.filter(s => s.dpaItemId === item.id || s.kodeSubKegiatan === item.kodeSubKegiatan);
                    const totalItemSppd = itemSppd.reduce((a, b) => a + (b.totalBiaya || 0), 0);
                    const sisa = (item.paguDpa || 0) - (item.realisasiKeuangan || 0);
                    const pctKeu = item.paguDpa > 0 ? ((item.realisasiKeuangan / item.paguDpa) * 100).toFixed(1) : '0';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{item.kodeSubKegiatan}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.namaSubKegiatan}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.nomorDpa || 'DPA Indikatif'} {item.targetKinerja ? `• Target: ${item.targetKinerja}` : ''}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-extrabold text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                            {item.bidangPengampu}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            {item.sumberDana}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          {formatRupiah(item.paguDpa)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-black text-emerald-700">
                            {formatRupiah(item.realisasiKeuangan)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            {pctKeu}% Cair
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-slate-800">{item.realisasiFisik || 0}%</div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full" 
                              style={{ width: `${Math.min(100, item.realisasiFisik || 0)}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3 text-right font-black">
                          <span className={sisa < 0 ? 'text-red-600' : 'text-slate-700'}>
                            {formatRupiah(sisa)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-bold text-amber-800">
                            {formatRupiah(totalItemSppd)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {itemSppd.length} SPT
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedDpaForRealisasi(item);
                                setRealisasiForm({
                                  realisasiKeuangan: item.realisasiKeuangan || 0,
                                  realisasiFisik: item.realisasiFisik || 0,
                                  keterangan: item.keterangan || ''
                                });
                                setShowRealisasiModal(true);
                              }}
                              title="Update Realisasi Anggaran & Fisik"
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingDpa(item);
                                setDpaForm(item);
                                setShowDpaModal(true);
                              }}
                              title="Edit Data DPA"
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteDpa(item.id)}
                                title="Hapus DPA"
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANAJEMEN & MONITORING SPPD (PERJALANAN DINAS) */}
      {/* ========================================================================= */}
      {activeTab === 'sppd' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-amber-50/50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Daftar & Rekapitulasi SPPD (Surat Perintah Perjalanan Dinas)
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan beban belanja perjalanan dinas, uang harian, tiket/transport, dan status pencairan SP2D.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              {filteredSppdList.length} SPT / SPPD
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-3 text-center w-10">No</th>
                  <th className="p-3 w-36">No. SPT & SPPD</th>
                  <th className="p-3">Nama Pelaksana & Jabatan</th>
                  <th className="p-3 text-center w-20">Bidang</th>
                  <th className="p-3">Maksud Tugas & Sub-Kegiatan</th>
                  <th className="p-3 w-32">Tujuan & Jenis</th>
                  <th className="p-3 text-center w-24">Tgl & Durasi</th>
                  <th className="p-3 text-right w-28">Uang Harian</th>
                  <th className="p-3 text-right w-28">Transport</th>
                  <th className="p-3 text-right w-32">Total SPPD</th>
                  <th className="p-3 text-center w-28">Status</th>
                  <th className="p-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSppdList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400 font-medium">
                      Belum ada catatan SPPD yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredSppdList.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{s.nomorSpt}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.nomorSppd}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{s.namaPelaksana}</div>
                        <div className="text-[11px] text-slate-500">
                          {s.nipPelaksana ? `NIP. ${s.nipPelaksana}` : (s.jabatan || 'Pegawai Pelaksana')}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-extrabold text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {s.bidangPengampu}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{s.maksudPerjalanan}</div>
                        <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                          Beban: {s.namaSubKegiatan || s.kodeSubKegiatan || 'Sub-Kegiatan DPA'} ({s.sumberDana || 'DAU'})
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{s.lokasiTujuan}</div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          s.jenisPerjalanan === 'Dalam Daerah' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {s.jenisPerjalanan}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-slate-700">{s.tanggalBerangkat}</div>
                        <div className="text-[10px] font-extrabold text-teal-700">
                          {s.lamaHari || 1} Hari Kerja
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {formatRupiah(s.biayaUangHarian)}
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {formatRupiah(s.biayaTransport)}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-700">
                        {formatRupiah(s.totalBiaya)}
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={s.statusPencairan}
                          onChange={(e) => handleUpdateSppdStatus(s, e.target.value as any)}
                          className={`text-[10px] font-black rounded-lg px-2 py-1 border outline-none cursor-pointer ${
                            s.statusPencairan === 'Cair (SP2D)'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : s.statusPencairan === 'Disetujui'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Pengajuan">Pengajuan</option>
                          <option value="Disetujui">Disetujui</option>
                          <option value="Cair (SP2D)">Cair (SP2D)</option>
                        </select>
                        {s.noSp2d && (
                          <div className="text-[9px] font-mono text-slate-500 mt-1">
                            {s.noSp2d}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => printRincianSppd(s)}
                            title="Cetak Kuitansi & Rincian SPPD"
                            className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSppd(s);
                              setSppdForm(s);
                              setShowSppdModal(true);
                            }}
                            title="Edit SPPD"
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSppd(s.id)}
                            title="Hapus SPPD"
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT SUB-KEGIATAN DPA */}
      {/* ========================================================================= */}
      {showDpaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <WalletCards className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingDpa ? 'Edit Sub-Kegiatan DPA' : 'Tambah Sub-Kegiatan DPA Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowDpaModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDpa} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tahun Anggaran</label>
                  <input
                    type="text"
                    value={dpaForm.tahun}
                    onChange={e => setDpaForm({ ...dpaForm, tahun: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor DPA Definitif</label>
                  <input
                    type="text"
                    value={dpaForm.nomorDpa}
                    onChange={e => setDpaForm({ ...dpaForm, nomorDpa: e.target.value })}
                    placeholder="Contoh: DPA/A.1/1.03.../001/2025"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bidang Pengampu</label>
                  <select
                    value={dpaForm.bidangPengampu}
                    onChange={e => setDpaForm({ ...dpaForm, bidangPengampu: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {['SDA', 'BM', 'CK', 'PL', 'Tata Ruang', 'Sekretariat'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 block mb-2">Sumber Dana (Bisa pilih lebih dari satu)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {SUMBER_DANA_LIST.map(sd => {
                      const currentSd = dpaForm.sumberDana || '';
                      const isSelected = currentSd.includes(sd);
                      return (
                        <label key={sd} className="flex items-start gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer p-1 hover:bg-slate-100 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              let currentList = currentSd ? currentSd.split(', ').filter(Boolean) : [];
                              if (e.target.checked) {
                                if (!currentList.includes(sd)) currentList.push(sd);
                              } else {
                                currentList = currentList.filter(s => s !== sd);
                              }
                              setDpaForm(prev => ({ ...prev, sumberDana: currentList.join(', ') }));
                            }}
                            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="leading-tight">{sd}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kode Sub-Kegiatan</label>
                <input
                  type="text"
                  value={dpaForm.kodeSubKegiatan}
                  onChange={e => setDpaForm({ ...dpaForm, kodeSubKegiatan: e.target.value })}
                  placeholder="Contoh: 1.03.02.2.01.0001"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Sub-Kegiatan DPA</label>
                <input
                  type="text"
                  value={dpaForm.namaSubKegiatan}
                  onChange={e => setDpaForm({ ...dpaForm, namaSubKegiatan: e.target.value })}
                  placeholder="Contoh: Pembangunan Jaringan Irigasi D.I. Aesesa..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pagu Anggaran DPA (Rp)</label>
                  <input
                    type="number"
                    value={dpaForm.paguDpa || ''}
                    onChange={e => setDpaForm({ ...dpaForm, paguDpa: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-black text-slate-900"
                  />
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">
                    {formatRupiah(dpaForm.paguDpa || 0)}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alokasi SPPD dalam Sub-Keg (Rp)</label>
                  <input
                    type="number"
                    value={dpaForm.paguSppd || ''}
                    onChange={e => setDpaForm({ ...dpaForm, paguSppd: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold text-amber-700"
                  />
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">
                    {formatRupiah(dpaForm.paguSppd || 0)}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Kinerja / Output</label>
                <input
                  type="text"
                  value={dpaForm.targetKinerja}
                  onChange={e => setDpaForm({ ...dpaForm, targetKinerja: e.target.value })}
                  placeholder="Contoh: 1 Paket / 2.5 Km"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDpaModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                  Simpan Sub-Kegiatan DPA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UPDATE CEPAT REALISASI KEUANGAN & FISIK */}
      {/* ========================================================================= */}
      {showRealisasiModal && selectedDpaForRealisasi && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Update Realisasi Anggaran & Fisik
                </h3>
              </div>
              <button
                onClick={() => setShowRealisasiModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{selectedDpaForRealisasi.namaSubKegiatan}</div>
              <div className="text-slate-500 mt-1">
                Pagu DPA: <span className="font-black text-slate-800">{formatRupiah(selectedDpaForRealisasi.paguDpa)}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateRealisasi} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Realisasi Keuangan (SP2D yang telah cair)
                </label>
                <input
                  type="number"
                  value={realisasiForm.realisasiKeuangan || ''}
                  onChange={e => setRealisasiForm({ ...realisasiForm, realisasiKeuangan: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <div className="text-[11px] text-slate-500 font-semibold mt-1">
                  {formatRupiah(realisasiForm.realisasiKeuangan || 0)} (
                  {selectedDpaForRealisasi.paguDpa > 0 
                    ? (((realisasiForm.realisasiKeuangan || 0) / selectedDpaForRealisasi.paguDpa) * 100).toFixed(1) 
                    : 0}% dari Pagu)
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Realisasi Fisik Lapangan (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={realisasiForm.realisasiFisik || ''}
                  onChange={e => setRealisasiForm({ ...realisasiForm, realisasiFisik: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Realisasi / Kendala Lapangan</label>
                <textarea
                  value={realisasiForm.keterangan}
                  onChange={e => setRealisasiForm({ ...realisasiForm, keterangan: e.target.value })}
                  placeholder="Proses tender, pencairan termin 1, fisik on track..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRealisasiModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                  Perbarui Realisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INPUT / EDIT ARSIP SPPD (SURAT PERINTAH PERJALANAN DINAS) */}
      {/* ========================================================================= */}
      {showSppdModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingSppd ? 'Edit Dokumen SPT & SPPD' : 'Terbitkan Surat Perintah Tugas & SPPD Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowSppdModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSppd} className="space-y-3.5 text-xs">
              {/* Beban Sub-Kegiatan DPA */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Beban Pos Sub-Kegiatan DPA
                </label>
                <select
                  value={sppdForm.dpaItemId}
                  onChange={e => {
                    const matched = dpaList.find(d => d.id === e.target.value);
                    if (matched) {
                      setSppdForm({
                        ...sppdForm,
                        dpaItemId: matched.id,
                        kodeSubKegiatan: matched.kodeSubKegiatan,
                        namaSubKegiatan: matched.namaSubKegiatan,
                        bidangPengampu: matched.bidangPengampu,
                        sumberDana: matched.sumberDana
                      });
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="">-- Pilih Sub-Kegiatan DPA yang Membiayai --</option>
                  {dpaList.map(d => (
                    <option key={d.id} value={d.id}>
                      [{d.bidangPengampu}] {d.kodeSubKegiatan} - {d.namaSubKegiatan} ({d.sumberDana})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Surat Tugas (SPT)</label>
                  <input
                    type="text"
                    value={sppdForm.nomorSpt}
                    onChange={e => setSppdForm({ ...sppdForm, nomorSpt: e.target.value })}
                    placeholder="090/PUPR/SPT/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor SPPD</label>
                  <input
                    type="text"
                    value={sppdForm.nomorSppd}
                    onChange={e => setSppdForm({ ...sppdForm, nomorSppd: e.target.value })}
                    placeholder="090/PUPR/SPPD/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Data Pelaksana */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Identitas Pegawai / Pelaksana Tugas</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={sppdForm.namaPelaksana}
                      onChange={e => setSppdForm({ ...sppdForm, namaPelaksana: e.target.value })}
                      placeholder="Nama Pegawai / Tim"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">NIP (Opsional)</label>
                    <input
                      type="text"
                      value={sppdForm.nipPelaksana}
                      onChange={e => setSppdForm({ ...sppdForm, nipPelaksana: e.target.value })}
                      placeholder="1985..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Pangkat / Golongan</label>
                    <input
                      type="text"
                      value={sppdForm.pangkatGolongan}
                      onChange={e => setSppdForm({ ...sppdForm, pangkatGolongan: e.target.value })}
                      placeholder="Penata / III/c"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Jabatan</label>
                    <input
                      type="text"
                      value={sppdForm.jabatan}
                      onChange={e => setSppdForm({ ...sppdForm, jabatan: e.target.value })}
                      placeholder="Pengawas Lapangan / PPTK"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Detail Perjalanan */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Maksud Perjalanan Dinas</label>
                <textarea
                  value={sppdForm.maksudPerjalanan}
                  onChange={e => setSppdForm({ ...sppdForm, maksudPerjalanan: e.target.value })}
                  placeholder="Contoh: Monitoring lapangan progres pengaspalan ruas jalan Boawae..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Perjalanan</label>
                  <select
                    value={sppdForm.jenisPerjalanan}
                    onChange={e => setSppdForm({ ...sppdForm, jenisPerjalanan: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Dalam Daerah">Dalam Daerah (Wilayah Nagekeo)</option>
                    <option value="Luar Daerah">Luar Daerah (Kupang / Jakarta / dll)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Tujuan</label>
                  <input
                    type="text"
                    value={sppdForm.lokasiTujuan}
                    onChange={e => setSppdForm({ ...sppdForm, lokasiTujuan: e.target.value })}
                    placeholder="Contoh: Kecamatan Mauponggo / Kupang"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tgl Berangkat</label>
                  <input
                    type="date"
                    value={sppdForm.tanggalBerangkat}
                    onChange={e => setSppdForm({ ...sppdForm, tanggalBerangkat: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tgl Kembali</label>
                  <input
                    type="date"
                    value={sppdForm.tanggalKembali}
                    onChange={e => setSppdForm({ ...sppdForm, tanggalKembali: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lama (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    value={sppdForm.lamaHari || 1}
                    onChange={e => setSppdForm({ ...sppdForm, lamaHari: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Rincian Anggaran SPPD */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2.5">
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span>Rincian Biaya SPPD</span>
                  <span className="text-sm font-black text-amber-800">
                    Total: {formatRupiah(sppdForm.totalBiaya || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Uang Harian (Rp)</label>
                    <input
                      type="number"
                      value={sppdForm.biayaUangHarian || ''}
                      onChange={e => setSppdForm({ ...sppdForm, biayaUangHarian: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Transport/Tiket (Rp)</label>
                    <input
                      type="number"
                      value={sppdForm.biayaTransport || ''}
                      onChange={e => setSppdForm({ ...sppdForm, biayaTransport: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Penginapan/Hotel (Rp)</label>
                    <input
                      type="number"
                      value={sppdForm.biayaPenginapan || ''}
                      onChange={e => setSppdForm({ ...sppdForm, biayaPenginapan: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Lain-lain / Riil (Rp)</label>
                    <input
                      type="number"
                      value={sppdForm.biayaLainnya || ''}
                      onChange={e => setSppdForm({ ...sppdForm, biayaLainnya: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Status Pencairan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Pencairan</label>
                  <select
                    value={sppdForm.statusPencairan}
                    onChange={e => setSppdForm({ ...sppdForm, statusPencairan: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Pengajuan">Pengajuan</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Cair (SP2D)">Cair (SP2D Terbit)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor SP2D (Jika sudah cair)</label>
                  <input
                    type="text"
                    value={sppdForm.noSp2d}
                    onChange={e => setSppdForm({ ...sppdForm, noSp2d: e.target.value })}
                    placeholder="SP2D/PUPR/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSppdModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                  Simpan Arsip SPPD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
