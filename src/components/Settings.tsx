import React, { useState, useEffect } from 'react';
import { useRequirements } from '../useRequirements';
import { 
  Save, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  MapPin, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Wallet, 
  Coins, 
  Layers, 
  CheckCircle, 
  Sliders, 
  ShieldCheck, 
  FileCheck2,
  SlidersHorizontal,
  FolderTree
} from 'lucide-react';
import { Requirement, BidangConfig, BIDANG_LIST, SUMBER_DANA_LIST } from '../types';
import { getAllBidangConfigs, saveBidangConfig, getNagekeoWilayah, saveNagekeoWilayah } from '../services/configService';
import { DEFAULT_NAGEKEO_WILAYAH, KecamatanDesa, countTotalDesa } from '../data/nagekeoWilayah';
import { formatRupiah } from '../utils';
import BudgetRulesManager from './BudgetRulesManager';
import SecurityMaintenance from './SecurityMaintenance';
import JenisBelanjaManager from './JenisBelanjaManager';

interface SettingsProps {
  userEmail?: string;
  userName?: string;
  isAdmin?: boolean;
}

export default function Settings({ userEmail = 'admin@nagekeokab.go.id', userName = 'Administrator ', isAdmin = true }: SettingsProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'jenis_belanja' | 'cost_rules' | 'security' | 'wilayah_bidang' | 'requirements'>('jenis_belanja');

  const [configs, setConfigs] = useState<BidangConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [savingConfigId, setSavingConfigId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Master Wilayah State
  const [wilayahList, setWilayahList] = useState<KecamatanDesa[]>([]);
  const [loadingWilayah, setLoadingWilayah] = useState(true);
  const [isSavingWilayah, setIsSavingWilayah] = useState(false);
  const [newKecamatanName, setNewKecamatanName] = useState('');
  const [selectedKecForNewDesa, setSelectedKecForNewDesa] = useState<string>('');
  const [newDesaName, setNewDesaName] = useState('');
  const [expandedKec, setExpandedKec] = useState<Record<string, boolean>>({});

  const { requirements, loading, error: reqError, saveRequirements } = useRequirements();
  const [localReqs, setLocalReqs] = useState<Requirement[]>([]);

  useEffect(() => {
    if (requirements.length > 0 && localReqs.length === 0) {
      setLocalReqs(requirements);
    }
  }, [requirements]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configData, wData] = await Promise.all([
          getAllBidangConfigs(),
          getNagekeoWilayah()
        ]);
        setConfigs(configData);
        setWilayahList(wData);
        if (wData.length > 0) {
          setSelectedKecForNewDesa(wData[0].kecamatan);
          setExpandedKec({ [wData[0].kecamatan]: true });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConfigs(false);
        setLoadingWilayah(false);
      }
    };
    fetchData();
  }, []);

  const handleConfigChange = (id: string, field: keyof BidangConfig, value: any) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSumberDanaPaguChange = (configId: string, sumberDanaName: string, amount: number) => {
    setConfigs(configs.map(c => {
      if (c.id !== configId) return c;
      const currentMap: Record<string, number> = { ...(c.paguPerSumberDana || {}) };
      if (amount < 0) {
        delete currentMap[sumberDanaName];
      } else {
        currentMap[sumberDanaName] = amount;
      }
      const totalPagu = Object.values(currentMap).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);
      return {
        ...c,
        paguPerSumberDana: currentMap,
        pagu: totalPagu > 0 ? totalPagu : c.pagu
      };
    }));
  };

  const handleAddSumberDanaToConfig = (configId: string, sumberDanaName: string) => {
    if (!sumberDanaName) return;
    setConfigs(configs.map(c => {
      if (c.id !== configId) return c;
      const currentMap: Record<string, number> = { ...(c.paguPerSumberDana || {}) };
      if (currentMap[sumberDanaName] === undefined) {
        currentMap[sumberDanaName] = 0;
      }
      return { ...c, paguPerSumberDana: currentMap };
    }));
  };

  const handleRemoveSumberDanaFromConfig = (configId: string, sumberDanaName: string) => {
    setConfigs(configs.map(c => {
      if (c.id !== configId) return c;
      const currentMap: Record<string, number> = { ...(c.paguPerSumberDana || {}) };
      delete currentMap[sumberDanaName];
      const totalPagu = Object.values(currentMap).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);
      return {
        ...c,
        paguPerSumberDana: currentMap,
        pagu: Object.keys(currentMap).length > 0 ? totalPagu : c.pagu
      };
    }));
  };

  const handleSaveConfig = async (config: BidangConfig) => {
    setSavingConfigId(config.id);
    try {
      await saveBidangConfig(config);
      setSuccessMsg(`Pengaturan ${config.name} berhasil disimpan!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Gagal menyimpan konfigurasi');
    } finally {
      setSavingConfigId(null);
    }
  };

  // Wilayah handlers
  const handleToggleExpandKec = (kecName: string) => {
    setExpandedKec(prev => ({ ...prev, [kecName]: !prev[kecName] }));
  };

  const handleAddKecamatan = () => {
    const trimmed = newKecamatanName.trim();
    if (!trimmed) return;
    if (wilayahList.some(k => k.kecamatan.toLowerCase() === trimmed.toLowerCase())) {
      alert('Kecamatan dengan nama ini sudah ada!');
      return;
    }
    const updated = [...wilayahList, { kecamatan: trimmed, desaList: [] }];
    setWilayahList(updated);
    setSelectedKecForNewDesa(trimmed);
    setExpandedKec(prev => ({ ...prev, [trimmed]: true }));
    setNewKecamatanName('');
  };

  const handleDeleteKecamatan = (kecName: string) => {
    if (!window.confirm(`Yakin ingin menghapus Kecamatan ${kecName} beserta seluruh desanya?`)) return;
    const updated = wilayahList.filter(k => k.kecamatan !== kecName);
    setWilayahList(updated);
    if (selectedKecForNewDesa === kecName && updated.length > 0) {
      setSelectedKecForNewDesa(updated[0].kecamatan);
    }
  };

  const handleAddDesa = () => {
    const trimmed = newDesaName.trim();
    if (!trimmed || !selectedKecForNewDesa) return;
    const kecIndex = wilayahList.findIndex(k => k.kecamatan === selectedKecForNewDesa);
    if (kecIndex === -1) return;

    if (wilayahList[kecIndex].desaList.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Desa/Kelurahan ${trimmed} sudah ada di Kecamatan ${selectedKecForNewDesa}!`);
      return;
    }

    const updated = [...wilayahList];
    updated[kecIndex] = {
      ...updated[kecIndex],
      desaList: [...updated[kecIndex].desaList, trimmed].sort()
    };
    setWilayahList(updated);
    setExpandedKec(prev => ({ ...prev, [selectedKecForNewDesa]: true }));
    setNewDesaName('');
  };

  const handleDeleteDesa = (kecName: string, desaName: string) => {
    const kecIndex = wilayahList.findIndex(k => k.kecamatan === kecName);
    if (kecIndex === -1) return;

    const updated = [...wilayahList];
    updated[kecIndex] = {
      ...updated[kecIndex],
      desaList: updated[kecIndex].desaList.filter(d => d !== desaName)
    };
    setWilayahList(updated);
  };

  const handleResetDefaultWilayah = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh daftar wilayah ke default 115 Desa & 7 Kecamatan Kabupaten Nagekeo?')) {
      setWilayahList(DEFAULT_NAGEKEO_WILAYAH);
    }
  };

  const handleSaveMasterWilayah = async () => {
    setIsSavingWilayah(true);
    try {
      await saveNagekeoWilayah(wilayahList);
      setSuccessMsg('Master Wilayah Kabupaten Nagekeo (Desa & Kecamatan) berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Gagal menyimpan master wilayah');
    } finally {
      setIsSavingWilayah(false);
    }
  };

  // Requirement handlers
  const handleAddReq = () => {
    const newId = `req_${Date.now()}`;
    setLocalReqs([...localReqs, { id: newId, label: '', description: '', required: true }]);
  };

  const handleRemoveReq = (id: string) => {
    setLocalReqs(localReqs.filter(r => r.id !== id));
  };

  const handleReqChange = (id: string, field: keyof Requirement, value: any) => {
    setLocalReqs(localReqs.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSaveReqs = async () => {
    try {
      await saveRequirements(localReqs);
      setSuccessMsg('Syarat kelayakan berkas berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Gagal menyimpan syarat kelayakan');
    }
  };

  const totalDesaCount = countTotalDesa(wilayahList);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-400/40 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider">
              Pusat Kendali Pengaturan Admin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-blue-400" />
            Konfigurasi & Administrasi Sistem
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Atur batas besaran biaya operasional, ATK, jasa perencanaan/pengawasan, keamanan siber, dan master wilayah  Kabupaten Nagekeo.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSettingsTab('jenis_belanja')}
          className={`pb-3 px-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeSettingsTab === 'jenis_belanja'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" /> Pagu & Master Jenis Belanja
        </button>
        <button
          onClick={() => setActiveSettingsTab('cost_rules')}
          className={`pb-3 px-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeSettingsTab === 'cost_rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Standar Biaya & Persentase
        </button>
        <button
          onClick={() => setActiveSettingsTab('security')}
          className={`pb-3 px-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeSettingsTab === 'security'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Keamanan & Pemeliharaan Berkala
        </button>
        <button
          onClick={() => setActiveSettingsTab('wilayah_bidang')}
          className={`pb-3 px-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeSettingsTab === 'wilayah_bidang'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4" /> Master Wilayah & Unit Bidang
        </button>
        <button
          onClick={() => setActiveSettingsTab('requirements')}
          className={`pb-3 px-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeSettingsTab === 'requirements'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4" /> Syarat Kelayakan Dokumen
        </button>
      </div>

      {/* TAB 0: PAGU & JENIS BELANJA MANAGER */}
      {activeSettingsTab === 'jenis_belanja' && (
        <JenisBelanjaManager userEmail={userEmail} isAdmin={isAdmin} />
      )}

      {/* TAB 1: COST RULES & PERCENTAGES */}
      {activeSettingsTab === 'cost_rules' && (
        <BudgetRulesManager userEmail={userEmail} isAdmin={isAdmin} />
      )}

      {/* TAB 2: SECURITY & MAINTENANCE */}
      {activeSettingsTab === 'security' && (
        <SecurityMaintenance userEmail={userEmail} isAdmin={isAdmin} />
      )}

      {/* TAB 3: MASTER WILAYAH & UNIT BIDANG */}
      {activeSettingsTab === 'wilayah_bidang' && (
        <div className="space-y-6">
          {/* Master Wilayah */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 border-b-4 border-b-emerald-600">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Master Wilayah Kabupaten Nagekeo (Desa & Kecamatan)</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola daftar per-desa ({totalDesaCount} Desa/Kelurahan) & ({wilayahList.length} Kecamatan).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDefaultWilayah}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset Default
                </button>
                <button
                  onClick={handleSaveMasterWilayah}
                  disabled={isSavingWilayah}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50"
                >
                  {isSavingWilayah ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Master Wilayah
                </button>
              </div>
            </div>

            {/* Add Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" /> Tambah Kecamatan Baru:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKecamatanName}
                    onChange={e => setNewKecamatanName(e.target.value)}
                    placeholder="Nama Kecamatan baru..."
                    className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKecamatan}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" /> Tambah Desa / Kelurahan Baru:
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedKecForNewDesa}
                    onChange={e => setSelectedKecForNewDesa(e.target.value)}
                    className="w-1/3 bg-white border border-emerald-300 rounded-xl px-2 py-1.5 text-xs outline-none font-bold text-slate-700"
                  >
                    {wilayahList.map(k => (
                      <option key={k.kecamatan} value={k.kecamatan}>Kec. {k.kecamatan}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newDesaName}
                    onChange={e => setNewDesaName(e.target.value)}
                    placeholder="Nama Desa / Kelurahan..."
                    className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDesa}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* Accordion list */}
            {loadingWilayah ? (
              <div className="py-6 flex justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {wilayahList.map((k) => {
                  const isExpanded = !!expandedKec[k.kecamatan];
                  return (
                    <div key={k.kecamatan} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                      <div 
                        onClick={() => handleToggleExpandKec(k.kecamatan)}
                        className="p-3.5 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">Kecamatan {k.kecamatan}</span>
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            {k.desaList.length} Desa / Kelurahan
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteKecamatan(k.kecamatan);
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-bold p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-slate-50">
                          {k.desaList.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">Belum ada desa/kelurahan yang terdaftar di kecamatan ini.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {k.desaList.map((desa) => (
                                <div key={desa} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                                  <span className="truncate text-slate-800 font-medium">{desa}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDesa(k.kecamatan, desa)}
                                    className="text-slate-300 hover:text-red-600 font-bold ml-1.5 shrink-0"
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pengaturan Unit Usulan & Bidang  */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 border-b-4 border-b-blue-500">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Pengaturan Unit Usulan & Bidang </h3>
            <p className="text-xs text-slate-500 mb-4">Atur Pagu Indikatif, Google Spreadsheet ID, dan Google Drive URL untuk setiap Bidang dan Unit.</p>
            
            {loadingConfigs ? (
              <div className="py-8 flex justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="space-y-6">
                {configs.map(config => (
                  <div key={config.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-sm">{config.name}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                        {config.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Total Pagu Indikatif (Rp)</label>
                        <input 
                          type="number"
                          value={config.pagu}
                          onChange={(e) => handleConfigChange(config.id, 'pagu', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-extrabold text-slate-800"
                        />
                        <div className="text-[11px] font-semibold text-slate-500 mt-1">
                          Terbilang: <span className="text-blue-700 font-bold">{formatRupiah(config.pagu || 0)}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Spreadsheet ID</label>
                        <input 
                          type="text"
                          value={config.sheetId}
                          onChange={(e) => handleConfigChange(config.id, 'sheetId', e.target.value)}
                          className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                          placeholder="ID Google Sheet"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Google Drive Folder URL (Penyimpanan Berkas)</label>
                        <input 
                          type="text"
                          value={config.driveUrl || ''}
                          onChange={(e) => handleConfigChange(config.id, 'driveUrl', e.target.value)}
                          className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                          placeholder="https://drive.google.com/drive/folders/..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={() => handleSaveConfig(config)}
                        disabled={savingConfigId === config.id}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
                      >
                        {savingConfigId === config.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SYARAT KELAYAKAN DOKUMEN */}
      {activeSettingsTab === 'requirements' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 border-b-4 border-b-purple-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Daftar Dokumen Kelayakan Wajib (e-URK)</h3>
              <p className="text-xs text-slate-500">Kelola daftar berkas dan lampiran yang harus diunggah oleh pengusul desa/kecamatan.</p>
            </div>
            <button 
              onClick={handleAddReq}
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Syarat
            </button>
          </div>

          <div className="space-y-3">
            {localReqs.map((req, idx) => (
              <div key={req.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Berkas Persyaratan</label>
                    <input 
                      type="text"
                      value={req.label}
                      onChange={(e) => handleReqChange(req.id, 'label', e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Format</label>
                    <input 
                      type="text"
                      value={req.description || ''}
                      onChange={(e) => handleReqChange(req.id, 'description', e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={req.required}
                      onChange={(e) => handleReqChange(req.id, 'required', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    Wajib Diunggah
                  </label>
                  <button 
                    onClick={() => handleRemoveReq(req.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSaveReqs}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md"
            >
              <Save className="w-4 h-4" /> Simpan Semua Syarat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
