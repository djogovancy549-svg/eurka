import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Search, 
  Calculator, 
  CheckCircle2, 
  Layers, 
  FileSpreadsheet, 
  Building2, 
  TrendingUp, 
  PieChart as PieChartIcon,
  X,
  AlertCircle
} from 'lucide-react';
import { JenisBelanjaItem, BIDANG_LIST } from '../types';
import { getAllJenisBelanja, saveAllJenisBelanja, resetToDefaultJenisBelanja } from '../services/jenisBelanjaService';
import { formatRupiah, parseMoney } from '../utils';

interface JenisBelanjaManagerProps {
  userEmail?: string;
  isAdmin?: boolean;
  onDataChanged?: () => void;
}

export default function JenisBelanjaManager({ userEmail = 'admin@nagekeokab.go.id', isAdmin = true, onDataChanged }: JenisBelanjaManagerProps) {
  const [items, setItems] = useState<JenisBelanjaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<JenisBelanjaItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    kodeBelanja: string;
    namaJenisBelanja: string;
    kategori: string;
    paguAnggaran: string;
    satuanDefault: string;
    rentangHargaDefault: string;
    keterangan: string;
    paguPerBidang: Record<string, string>;
  }>({
    id: '',
    kodeBelanja: '',
    namaJenisBelanja: '',
    kategori: 'Belanja Modal Perangkat Lunak',
    paguAnggaran: '',
    satuanDefault: 'Paket',
    rentangHargaDefault: '',
    keterangan: '',
    paguPerBidang: {}
  });

  const DEFAULT_CATEGORIES = [
    'Belanja Modal Perangkat Lunak',
    'Belanja Sewa Cloud & Infrastruktur',
    'Belanja Jasa Pemeliharaan & SLA',
    'Belanja Sewa Aplikasi (SaaS)',
    'Belanja Modal Infrastruktur PUPR',
    'Belanja Modal Peralatan dan Mesin',
    'Belanja Modal Bangunan Gedung',
    'Belanja Modal Jalan, Irigasi & Jaringan',
    'Belanja Operasional & Pemeliharaan',
    'Lainnya / Umum'
  ];

  const [customCategoryList, setCustomCategoryList] = useState<string[]>([]);
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');

  // Compute dynamic all categories list
  const allCategories = useMemo(() => {
    const fromItems = items.map(i => i.kategori).filter(Boolean);
    const set = new Set([...DEFAULT_CATEGORIES, ...fromItems, ...customCategoryList]);
    return Array.from(set);
  }, [items, customCategoryList]);

  const targetBidangs = ['SDA', 'BM', 'CK', 'PL', 'Tata Ruang', 'Sekretariat'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllJenisBelanja();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsCustomCategoryMode(false);
    setFormData({
      id: 'jb_' + Date.now(),
      kodeBelanja: '',
      namaJenisBelanja: '',
      kategori: 'Belanja Modal Perangkat Lunak',
      paguAnggaran: '',
      satuanDefault: 'Paket',
      rentangHargaDefault: '',
      keterangan: '',
      paguPerBidang: {
        'SDA': '0',
        'BM': '0',
        'CK': '0',
        'PL': '0',
        'Tata Ruang': '0',
        'Sekretariat': '0'
      }
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item: JenisBelanjaItem) => {
    setEditingItem(item);
    setIsCustomCategoryMode(false);
    const pbMap: Record<string, string> = {};
    targetBidangs.forEach(b => {
      pbMap[b] = item.paguPerBidang && item.paguPerBidang[b] ? item.paguPerBidang[b].toString() : '0';
    });

    setFormData({
      id: item.id,
      kodeBelanja: item.kodeBelanja || '',
      namaJenisBelanja: item.namaJenisBelanja,
      kategori: item.kategori,
      paguAnggaran: item.paguAnggaran ? item.paguAnggaran.toString() : '0',
      satuanDefault: item.satuanDefault || 'Paket',
      rentangHargaDefault: item.rentangHargaDefault || '',
      keterangan: item.keterangan || '',
      paguPerBidang: pbMap
    });
    setShowModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaJenisBelanja.trim()) {
      alert('Nama jenis belanja harus diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const numericPagu = parseMoney(formData.paguAnggaran);
      const parsedPb: Record<string, number> = {};
      Object.entries(formData.paguPerBidang).forEach(([b, val]) => {
        parsedPb[b] = parseMoney(val);
      });

      const newItem: JenisBelanjaItem = {
        id: formData.id || 'jb_' + Date.now(),
        kodeBelanja: formData.kodeBelanja.trim(),
        namaJenisBelanja: formData.namaJenisBelanja.trim(),
        kategori: formData.kategori,
        paguAnggaran: numericPagu,
        paguPerBidang: parsedPb,
        satuanDefault: formData.satuanDefault,
        rentangHargaDefault: formData.rentangHargaDefault.trim(),
        keterangan: formData.keterangan.trim(),
        updatedAt: new Date().toISOString()
      };

      let newItems: JenisBelanjaItem[];
      if (editingItem) {
        newItems = items.map(it => it.id === editingItem.id ? newItem : it);
      } else {
        newItems = [newItem, ...items];
      }

      setItems(newItems);
      await saveAllJenisBelanja(newItems);
      setShowModal(false);
      setSuccessMsg(`Berhasil menyimpan jenis belanja "${newItem.namaJenisBelanja}" dengan Pagu ${formatRupiah(numericPagu)}`);
      setTimeout(() => setSuccessMsg(null), 4000);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Jenis Belanja "${name}"?`)) return;
    setIsSaving(true);
    try {
      const newItems = items.filter(it => it.id !== id);
      setItems(newItems);
      await saveAllJenisBelanja(newItems);
      setSuccessMsg(`Jenis Belanja "${name}" telah dihapus.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInlinePaguChange = async (id: string, newPaguStr: string) => {
    const val = parseMoney(newPaguStr);
    const updated = items.map(it => {
      if (it.id === id) {
        return { ...it, paguAnggaran: val, updatedAt: new Date().toISOString() };
      }
      return it;
    });
    setItems(updated);
    await saveAllJenisBelanja(updated);
    if (onDataChanged) onDataChanged();
  };

  const handleResetDefaults = async () => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan master Jenis Belanja ke Standar SSH Nagekeo awal? Data penyesuaian Anda akan diganti.')) return;
    setIsSaving(true);
    try {
      const defaults = await resetToDefaultJenisBelanja();
      setItems(defaults);
      setSuccessMsg('Master Jenis Belanja & Pagu Anggaran telah direset ke Standar SSH.');
      setTimeout(() => setSuccessMsg(null), 4000);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations
  const filteredItems = items.filter(it => {
    if (filterCategory !== 'ALL' && it.kategori !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = it.namaJenisBelanja.toLowerCase();
      const code = (it.kodeBelanja || '').toLowerCase();
      const kat = it.kategori.toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !kat.includes(q)) return false;
    }
    return true;
  });

  const totalPaguKeseluruhan = items.reduce((acc, curr) => acc + (Number(curr.paguAnggaran) || 0), 0);

  // Calculate pagu per bidang total across all items
  const totalPaguPerBidang: Record<string, number> = {};
  targetBidangs.forEach(b => {
    totalPaguPerBidang[b] = items.reduce((sum, item) => {
      return sum + (item.paguPerBidang && item.paguPerBidang[b] ? Number(item.paguPerBidang[b]) || 0 : 0);
    }, 0);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-700/50">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              Kelola Pagu & Jenis Belanja Admin
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Pagu Anggaran Berdasarkan Jenis Belanja
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Admin menginput Pagu Anggaran untuk setiap Jenis Belanja (Modal Perangkat Lunak, Sewa Cloud, Pemeliharaan SLA, SaaS, Infrastruktur Fisik, dll). Pagu ini menjadi acuan kalkulasi otomatis total pagu per bidang dan secara keseluruhan.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-right shrink-0 min-w-[240px]">
          <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
            TOTAL PAGU ANGGARAN KESELURUHAN
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight block mt-0.5">
            {formatRupiah(totalPaguKeseluruhan)}
          </span>
          <span className="text-[10px] text-emerald-100 font-medium block mt-1">
            Dari {items.length} Kategori / Jenis Belanja
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* REKAPITULASI TOTAL PAGU PER BIDANG USULAN CARD */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Alokasi Total Pagu Per Bidang Usulan (Kalkulasi dari Jenis Belanja)
              </h3>
              <p className="text-xs text-slate-500">
                Total pagu tiap unit bidang yang terakumulasi dari rincian Pagu Jenis Belanja yang diinput Admin.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {targetBidangs.map(b => {
            const paguB = totalPaguPerBidang[b] || 0;
            const pct = totalPaguKeseluruhan > 0 ? ((paguB / totalPaguKeseluruhan) * 100).toFixed(1) : '0';
            return (
              <div key={b} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1 hover:border-indigo-300 transition-colors">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Bidang {b}
                </span>
                <span className="text-sm font-black text-slate-900 block truncate">
                  {formatRupiah(paguB)}
                </span>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1">
                  <span>Porsi:</span>
                  <span className="text-indigo-600 font-extrabold">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOOLBAR & CONTROLS */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari jenis belanja, kode, atau kategori..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Filter Category */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          >
            <option value="ALL">Semua Kategori Belanja</option>
            {allCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Kembalikan ke standar acuan SSH"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset SSH Standard
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Jenis Belanja & Pagu
          </button>
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Daftar Jenis Belanja & Pagu Anggaran Admin ({filteredItems.length} Ditemukan)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            * Anda dapat langsung mengubah Pagu Anggaran pada tabel di bawah ini.
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            Memuat data jenis belanja & pagu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            Tidak ada jenis belanja yang sesuai dengan kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[220px]">Jenis & Kode Belanja</th>
                  <th className="py-3 px-4 min-w-[150px]">Kategori Belanja</th>
                  <th className="py-3 px-4 min-w-[180px] bg-amber-50/80 text-amber-900 border-x border-amber-200">
                    Pagu Anggaran Admin (Rp)
                  </th>
                  <th className="py-3 px-4 min-w-[160px]">Alokasi Pagu Per Bidang</th>
                  <th className="py-3 px-4 min-w-[140px]">Acuan Rentang Harga</th>
                  <th className="py-3 px-4 min-w-[180px]">Keterangan / Output</th>
                  <th className="py-3 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Nama & Kode Belanja */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-xs leading-snug">
                        {item.namaJenisBelanja}
                      </div>
                      {item.kodeBelanja && (
                        <span className="inline-block px-2 py-0.5 mt-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-600">
                          Kode: {item.kodeBelanja}
                        </span>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                        {item.kategori}
                      </span>
                    </td>

                    {/* Pagu Anggaran (Interactive Input) */}
                    <td className="py-3.5 px-4 bg-amber-50/40 border-x border-amber-200/80">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-700">Rp</span>
                          <input
                            type="text"
                            value={formatRupiah(item.paguAnggaran).replace('Rp ', '')}
                            onChange={e => handleInlinePaguChange(item.id, e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-black text-amber-950 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
                          />
                        </div>
                        <span className="text-[9px] font-bold text-amber-700/80 block">
                          Satuan: {item.satuanDefault || 'Paket'}
                        </span>
                      </div>
                    </td>

                    {/* Alokasi Pagu Per Bidang */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.paguPerBidang && Object.keys(item.paguPerBidang).length > 0 ? (
                          Object.entries(item.paguPerBidang)
                            .filter(([_, val]) => Number(val) > 0)
                            .map(([b, val]) => (
                              <span key={b} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 font-bold text-[10px] border border-indigo-200">
                                {b}: {formatRupiah(Number(val))}
                              </span>
                            ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum dialokasikan</span>
                        )}
                      </div>
                    </td>

                    {/* Rentang Harga Acuan */}
                    <td className="py-3.5 px-4 text-slate-600 font-semibold text-[11px]">
                      {item.rentangHargaDefault ? (
                        <span className="text-slate-700 font-bold">{item.rentangHargaDefault}</span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>

                    {/* Keterangan */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] leading-tight">
                      {item.keterangan || '-'}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 transition-colors"
                          title="Edit Rincian"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.namaJenisBelanja)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM ADD / EDIT */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 my-8">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold">
                  {editingItem ? 'Edit Jenis Belanja & Pagu' : 'Tambah Jenis Belanja Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kode Belanja */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kode Belanja / SIPD (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 5.2.02.01.0001"
                    value={formData.kodeBelanja}
                    onChange={e => setFormData({ ...formData, kodeBelanja: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Kategori Belanja *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategoryMode(!isCustomCategoryMode);
                        if (!isCustomCategoryMode) {
                          setCustomCategoryInput('');
                        }
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                    >
                      {isCustomCategoryMode ? '← Pilih dari Daftar' : '+ Tambah Custom Nomenklatur OPD'}
                    </button>
                  </div>

                  {isCustomCategoryMode ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        required
                        type="text"
                        placeholder="Ketik Nomenklatur Kategori OPD (mis: Belanja Modal Peralatan Komunikasi)"
                        value={formData.kategori}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({ ...formData, kategori: val });
                        }}
                        className="w-full border border-emerald-400 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/40"
                      />
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.kategori}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '__ADD_NEW__') {
                          setIsCustomCategoryMode(true);
                          setFormData({ ...formData, kategori: '' });
                        } else {
                          setFormData({ ...formData, kategori: val });
                        }
                      }}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                    >
                      {allCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__ADD_NEW__" className="font-bold text-emerald-700">+ Tambah Custom Nomenklatur Baru...</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Nama Jenis Belanja */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Jenis Belanja / Kategori Pekerjaan *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Belanja Modal Perangkat Lunak - Application Custom Web App"
                  value={formData.namaJenisBelanja}
                  onChange={e => setFormData({ ...formData, namaJenisBelanja: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Pagu Anggaran & Satuan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-50/60 p-4 border border-amber-200 rounded-2xl">
                <div className="md:col-span-2">
                  <label className="text-xs font-extrabold text-amber-900 block mb-1">
                    Total Pagu Anggaran Admin (Rp) *
                  </label>
                  <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-500">
                    <span className="text-xs font-bold text-amber-700">Rp</span>
                    <input
                      required
                      type="text"
                      placeholder="Masukkan nilai nominal pagu..."
                      value={formData.paguAnggaran ? formatRupiah(formData.paguAnggaran).replace('Rp ', '') : ''}
                      onChange={e => setFormData({ ...formData, paguAnggaran: e.target.value })}
                      className="w-full text-sm font-black text-amber-950 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-amber-900 block mb-1">
                    Satuan Default *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Paket / Tahun / Unit"
                    value={formData.satuanDefault}
                    onChange={e => setFormData({ ...formData, satuanDefault: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Rentang Harga SSH */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Acuan Rentang Harga Standar Satuan Harga (SSH)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 25.000.000 - 50.000.000"
                  value={formData.rentangHargaDefault}
                  onChange={e => setFormData({ ...formData, rentangHargaDefault: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Breakdown Pagu Per Bidang Usulan */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-extrabold text-slate-800 block">
                  Alokasi Pagu Per Bidang Usulan (Opsional Detail)
                </label>
                <p className="text-[11px] text-slate-500">
                  Masukkan porsi pagu anggaran khusus untuk masing-masing bidang usulan (jika berlaku).
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {targetBidangs.map(b => (
                    <div key={b} className="bg-white border border-slate-200 rounded-xl p-2 space-y-0.5">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase block">
                        Bidang {b}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400">Rp</span>
                        <input
                          type="text"
                          value={formData.paguPerBidang[b] ? formatRupiah(formData.paguPerBidang[b]).replace('Rp ', '') : ''}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              paguPerBidang: { ...prev.paguPerBidang, [b]: val }
                            }));
                          }}
                          className="w-full text-xs font-bold outline-none text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Keterangan Spesifikasi & Output (SLA / KAK)
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat spesifikasi, jaminan uptime SLA, atau cakupan layanan..."
                  value={formData.keterangan}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Jenis Belanja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
