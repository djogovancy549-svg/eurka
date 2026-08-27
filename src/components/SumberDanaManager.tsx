import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Layers, 
  X,
  Tag,
  Info
} from 'lucide-react';
import { SumberDanaItem } from '../types';
import { getAllSumberDana, saveAllSumberDana, resetToDefaultSumberDana } from '../services/sumberDanaService';

interface SumberDanaManagerProps {
  userEmail?: string;
  isAdmin?: boolean;
  onDataChanged?: () => void;
}

export default function SumberDanaManager({ onDataChanged }: SumberDanaManagerProps) {
  const [items, setItems] = useState<SumberDanaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SumberDanaItem | null>(null);

  const [formData, setFormData] = useState<SumberDanaItem>({
    id: '',
    kodeDana: '',
    namaSumberDana: '',
    kategori: 'PAD (Pendapatan Asli Daerah)',
    keterangan: '',
    isActive: true
  });

  const categories = [
    'PAD (Pendapatan Asli Daerah)',
    'Transfer Pemerintah Pusat',
    'Transfer Pemerintah Provinsi',
    'Pinjaman / DAK / DBH Spesifik',
    'Lainnya / Hibah'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllSumberDana();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      id: 'sd_' + Date.now(),
      kodeDana: `5.0.${items.length + 1}`,
      namaSumberDana: '',
      kategori: 'PAD (Pendapatan Asli Daerah)',
      keterangan: '',
      isActive: true
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item: SumberDanaItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaSumberDana.trim()) {
      alert('Nama Sumber Dana wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const newItem: SumberDanaItem = {
        ...formData,
        id: formData.id || 'sd_' + Date.now(),
        namaSumberDana: formData.namaSumberDana.trim(),
        kodeDana: formData.kodeDana?.trim() || '',
        keterangan: formData.keterangan?.trim() || '',
        updatedAt: new Date().toISOString()
      };

      let newItems: SumberDanaItem[];
      if (editingItem) {
        newItems = items.map(it => it.id === editingItem.id ? newItem : it);
      } else {
        newItems = [newItem, ...items];
      }

      setItems(newItems);
      await saveAllSumberDana(newItems);
      setShowModal(false);
      setSuccessMsg(`Berhasil menyimpan Nomenklatur Sumber Dana "${newItem.namaSumberDana}"`);
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
    if (!confirm(`Apakah Anda yakin ingin menghapus Nomenklatur Sumber Dana "${name}"?`)) return;
    setIsSaving(true);
    try {
      const newItems = items.filter(it => it.id !== id);
      setItems(newItems);
      await saveAllSumberDana(newItems);
      setSuccessMsg(`Sumber Dana "${name}" telah dihapus.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan master Nomenklatur Sumber Dana ke standar baku awal? Penyesuaian Anda akan diganti.')) return;
    setIsSaving(true);
    try {
      const defaults = await resetToDefaultSumberDana();
      setItems(defaults);
      setSuccessMsg('Master Sumber Dana telah direset ke standar baku APBD SIPD.');
      setTimeout(() => setSuccessMsg(null), 4000);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = items.filter(it => {
    if (filterCategory !== 'ALL' && it.kategori !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = it.namaSumberDana.toLowerCase();
      const code = (it.kodeDana || '').toLowerCase();
      const cat = (it.kategori || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !cat.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-700/50">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/40 rounded-full text-blue-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              Kelola Nomenklatur Sumber Dana Admin
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Master Nomenklatur Sumber Dana APBD / SIPD
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Nomenklatur sumber dana dapat bervariasi (DAU, DAK Fisik, DAK Non-Fisik, PAD, DBH, BKP, Dana Desa, dll). Admin dapat menambahkan atau mengubah master sumber dana agar pengusul dapat memilih sumber dana yang sinkron sesuai aturan penganggaran daerah.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-right shrink-0 min-w-[220px]">
          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
            TOTAL NOMENKLATUR AKTIF
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight block mt-0.5">
            {items.length} Opsi Sumber Dana
          </span>
          <span className="text-[10px] text-blue-100 font-medium block mt-1">
            Siap dipilih pada Form Usulan
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* TOOLBAR */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari sumber dana, kode, atau kategori..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Standar APBD
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Nomenklatur Sumber Dana
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Daftar Nomenklatur Sumber Dana ({filteredItems.length} Ditemukan)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            Memuat master sumber dana...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            Tidak ada sumber dana yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[220px]">Nama Sumber Dana</th>
                  <th className="py-3 px-4 min-w-[120px]">Kode / Rekening</th>
                  <th className="py-3 px-4 min-w-[180px]">Kategori Penerimaan</th>
                  <th className="py-3 px-4 min-w-[220px]">Keterangan & Nomenklatur</th>
                  <th className="py-3 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {item.namaSumberDana}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-700">
                        {item.kodeDana || '-'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-[10px] border border-blue-200">
                        <Tag className="w-3 h-3 mr-1 text-blue-600" />
                        {item.kategori || 'Lainnya'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px] leading-tight">
                      {item.keterangan || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.namaSumberDana)}
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

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 my-8">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-extrabold">
                  {editingItem ? 'Edit Nomenklatur Sumber Dana' : 'Tambah Sumber Dana Baru'}
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

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kode / Rekening Sumber Dana (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 5.1.01 atau DAK-FISIK-01"
                  value={formData.kodeDana || ''}
                  onChange={e => setFormData({ ...formData, kodeDana: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Nomenklatur Sumber Dana *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Dana Alokasi Khusus (DAK Fisik Tematik PUPR)"
                  value={formData.namaSumberDana}
                  onChange={e => setFormData({ ...formData, namaSumberDana: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kategori Penerimaan *
                </label>
                <select
                  required
                  value={formData.kategori || categories[0]}
                  onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Keterangan & Catatan Peraturan
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi peruntukan atau ketentuan khusus dari sumber dana ini..."
                  value={formData.keterangan || ''}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Sumber Dana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
