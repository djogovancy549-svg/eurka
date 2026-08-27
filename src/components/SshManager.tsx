import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Layers, 
  X,
  FileText,
  DollarSign,
  Tag
} from 'lucide-react';
import { SshItem, RenjaSubKegiatan } from '../types';
import { getAllSshItems, saveAllSshItems, resetToDefaultSsh } from '../services/sshService';
import { getRenjaMasterData } from '../services/renjaService';
import { formatRupiah, parseMoney } from '../utils';

interface SshManagerProps {
  userEmail?: string;
  isAdmin?: boolean;
  onDataChanged?: () => void;
}

export default function SshManager({ onDataChanged }: SshManagerProps) {
  const [items, setItems] = useState<SshItem[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<RenjaSubKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SshItem | null>(null);

  const [formData, setFormData] = useState<{
    id: string;
    kodeSsh: string;
    kategori: string;
    uraian: string;
    spesifikasi: string;
    satuan: string;
    minPrice: string;
    maxPrice: string;
    subKegiatanId: string;
  }>({
    id: '',
    kodeSsh: '',
    kategori: 'A. BELANJA MODAL PERANGKAT LUNAK (PEMBUATAN SISTEM & SOURCE CODE)',
    uraian: '',
    spesifikasi: '',
    satuan: 'Paket',
    minPrice: '',
    maxPrice: '',
    subKegiatanId: ''
  });

  const categories = [
    'A. BELANJA MODAL PERANGKAT LUNAK (PEMBUATAN SISTEM & SOURCE CODE)',
    'B. BELANJA SEWA INFRASTRUKTUR CLOUD & LAYANAN PIHAK KETIGA',
    'C. BELANJA JASA PEMELIHARAAN SISTEM & DUKUNGAN TEKNIS (SLA)',
    'D. BELANJA SEWA APLIKASI PIHAK KETIGA (SOFTWARE AS A SERVICE / MANAGED SERVICE)',
    'E. BELANJA MODAL INFRASTRUKTUR FISIK PUPR & LAINNYA'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sshData, renjaData] = await Promise.all([
        getAllSshItems(),
        getRenjaMasterData()
      ]);
      setItems(sshData);
      setSubKegiatanList(renjaData.subKegiatan);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      id: 'ssh_' + Date.now(),
      kodeSsh: `SSH-${items.length + 1}`,
      kategori: 'A. BELANJA MODAL PERANGKAT LUNAK (PEMBUATAN SISTEM & SOURCE CODE)',
      uraian: '',
      spesifikasi: '',
      satuan: 'Paket',
      minPrice: '',
      maxPrice: '',
      subKegiatanId: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item: SshItem) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      kodeSsh: item.kodeSsh || item.id,
      kategori: item.kategori,
      uraian: item.uraian,
      spesifikasi: item.spesifikasi || '',
      satuan: item.satuan || 'Paket',
      minPrice: item.minPrice ? item.minPrice.toString() : '0',
      maxPrice: item.maxPrice ? item.maxPrice.toString() : '0',
      subKegiatanId: item.subKegiatanId || ''
    });
    setShowModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uraian.trim()) {
      alert('Uraian Standar Satuan Harga (SSH) wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const minP = parseMoney(formData.minPrice);
      const maxP = parseMoney(formData.maxPrice);

      const foundSub = subKegiatanList.find(s => s.id === formData.subKegiatanId);

      const newItem: SshItem = {
        id: formData.id || 'ssh_' + Date.now(),
        kodeSsh: formData.kodeSsh.trim(),
        kategori: formData.kategori,
        uraian: formData.uraian.trim(),
        spesifikasi: formData.spesifikasi.trim(),
        satuan: formData.satuan.trim() || 'Paket',
        minPrice: minP,
        maxPrice: maxP,
        subKegiatanId: formData.subKegiatanId || undefined,
        subKegiatanName: foundSub ? `${foundSub.kodeSubKegiatan} ${foundSub.namaSubKegiatan}` : undefined,
        updatedAt: new Date().toISOString()
      };

      let newItems: SshItem[];
      if (editingItem) {
        newItems = items.map(it => it.id === editingItem.id ? newItem : it);
      } else {
        newItems = [newItem, ...items];
      }

      setItems(newItems);
      await saveAllSshItems(newItems);
      setShowModal(false);
      setSuccessMsg(`Berhasil menyimpan Standar Satuan Harga (SSH) "${newItem.uraian}"`);
      setTimeout(() => setSuccessMsg(null), 4000);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data SSH.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus item Standar Satuan Harga (SSH) "${name}"?`)) return;
    setIsSaving(true);
    try {
      const newItems = items.filter(it => it.id !== id);
      setItems(newItems);
      await saveAllSshItems(newItems);
      setSuccessMsg(`Item SSH "${name}" telah dihapus.`);
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
    if (!confirm('Apakah Anda yakin ingin mengembalikan master Standar Satuan Harga (SSH) ke data acuan standar Kabupaten Nagekeo awal? Penyesuaian Anda akan diganti.')) return;
    setIsSaving(true);
    try {
      const defaults = await resetToDefaultSsh();
      setItems(defaults);
      setSuccessMsg('Master Standar Satuan Harga (SSH) telah direset.');
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
      const uraian = it.uraian.toLowerCase();
      const spec = (it.spesifikasi || '').toLowerCase();
      const cat = (it.kategori || '').toLowerCase();
      const code = (it.kodeSsh || '').toLowerCase();
      if (!uraian.includes(q) && !spec.includes(q) && !cat.includes(q) && !code.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-700/50">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/40 rounded-full text-purple-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-purple-400" />
              Kelola Standar Satuan Harga (SSH) SIPD
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Master Standar Satuan Harga (SSH) & Rentang Biaya
          </h2>
          <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
            SSH berbeda-beda untuk tiap paket pekerjaan, spesifikasi software, jasa, maupun infrastruktur. Admin dapat mengelola item SSH agar pengusul dapat memilih standar satuan harga yang relevan saat mengusulkan nama paket pekerjaan.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-right shrink-0 min-w-[220px]">
          <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">
            TOTAL ITEM SSH DITERBITKAN
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight block mt-0.5">
            {items.length} Standar Harga
          </span>
          <span className="text-[10px] text-purple-100 font-medium block mt-1">
            Acuan Validasi Usulan SIPD
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
              placeholder="Cari uraian barang/jasa, spesifikasi, kode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
          >
            <option value="ALL">Semua Kategori SSH</option>
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
            Reset SSH Standard
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Item SSH SIPD
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Daftar Standar Satuan Harga (SSH) ({filteredItems.length} Item)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            Memuat data Standar Satuan Harga...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            Tidak ada item SSH yang sesuai dengan kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[220px]">Uraian Barang / Jasa</th>
                  <th className="py-3 px-4 min-w-[180px]">Kategori SSH</th>
                  <th className="py-3 px-4 min-w-[220px]">Spesifikasi Teknis</th>
                  <th className="py-3 px-4 min-w-[180px] text-right bg-amber-50/80 text-amber-950 border-x border-amber-200">
                    Rentang Biaya Acuan SSH
                  </th>
                  <th className="py-3 px-4 min-w-[100px] text-center">Satuan</th>
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
                      <div className="font-extrabold text-slate-900 text-xs leading-snug">
                        {item.uraian}
                      </div>
                      {item.kodeSsh && (
                        <span className="inline-block px-2 py-0.5 mt-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-600">
                          Kode: {item.kodeSsh}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 font-bold text-[10px] border border-purple-200">
                        {item.kategori}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px] leading-snug">
                      {item.spesifikasi || '-'}
                    </td>

                    <td className="py-3.5 px-4 bg-amber-50/40 border-x border-amber-200/80 text-right">
                      <div className="font-black text-amber-900 text-xs">
                        {formatRupiah(item.minPrice)} s/d {formatRupiah(item.maxPrice)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                        {item.satuan}
                      </span>
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
                          onClick={() => handleDeleteItem(item.id, item.uraian)}
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
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-extrabold">
                  {editingItem ? 'Edit Item Standar Satuan Harga (SSH)' : 'Tambah Item SSH SIPD Baru'}
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
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kode SSH / Ref SIPD (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: SSH-TIK-01"
                    value={formData.kodeSsh}
                    onChange={e => setFormData({ ...formData, kodeSsh: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kategori SSH *
                  </label>
                  <select
                    required
                    value={formData.kategori}
                    onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Uraian Nama Barang / Jasa Pekerjaan SSH *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Pembuatan Aplikasi Web Service Custom (Skala Dinas)"
                  value={formData.uraian}
                  onChange={e => setFormData({ ...formData, uraian: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Spesifikasi Teknis & Lingkup Output
                </label>
                <textarea
                  rows={2}
                  placeholder="Spesifikasi teknis, fitur, garansi, atau kapasitas minimum..."
                  value={formData.spesifikasi}
                  onChange={e => setFormData({ ...formData, spesifikasi: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-50/70 p-4 border border-amber-200 rounded-2xl">
                <div>
                  <label className="text-xs font-extrabold text-amber-900 block mb-1">
                    Harga Min (Rp) *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Min nominal..."
                    value={formData.minPrice ? formatRupiah(formData.minPrice).replace('Rp ', '') : ''}
                    onChange={e => setFormData({ ...formData, minPrice: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-black text-amber-950 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-amber-900 block mb-1">
                    Harga Max (Rp) *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Max nominal..."
                    value={formData.maxPrice ? formatRupiah(formData.maxPrice).replace('Rp ', '') : ''}
                    onChange={e => setFormData({ ...formData, maxPrice: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-black text-amber-950 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-amber-900 block mb-1">
                    Satuan Ukur *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Paket / Unit / Tahun / M2"
                    value={formData.satuan}
                    onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Keterkaitan Sub-Kegiatan RENJA OPD (Opsional)
                </label>
                <select
                  value={formData.subKegiatanId}
                  onChange={e => setFormData({ ...formData, subKegiatanId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
                >
                  <option value="">-- Tidak Ditautkan / Umum --</option>
                  {subKegiatanList.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.kodeSubKegiatan}] {sub.namaSubKegiatan} ({sub.bidangPengampu})
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Item SSH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
