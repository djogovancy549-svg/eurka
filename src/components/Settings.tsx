import React, { useState, useEffect } from 'react';
import { useRequirements } from '../useRequirements';
import { Save, Plus, Trash2, ExternalLink, Loader2, MapPin, Building2, ChevronDown, ChevronUp, RotateCcw, Wallet, Coins, Layers, CheckCircle } from 'lucide-react';
import { Requirement, BidangConfig, BIDANG_LIST, SUMBER_DANA_LIST } from '../types';
import { getAllBidangConfigs, saveBidangConfig, getNagekeoWilayah, saveNagekeoWilayah } from '../services/configService';
import { DEFAULT_NAGEKEO_WILAYAH, KecamatanDesa, countTotalDesa } from '../data/nagekeoWilayah';
import { formatRupiah } from '../utils';

export default function Settings() {
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
          // Expand first kecamatan by default
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

  const handleApplyPresetSumberDana = (configId: string) => {
    setConfigs(configs.map(c => {
      if (c.id !== configId) return c;
      const currentMap: Record<string, number> = { ...(c.paguPerSumberDana || {}) };
      if (currentMap['DAU'] === undefined) currentMap['DAU'] = 0;
      if (currentMap['DAK Fisik'] === undefined) currentMap['DAK Fisik'] = 0;
      if (currentMap['PAD'] === undefined) currentMap['PAD'] = 0;
      return { ...c, paguPerSumberDana: currentMap };
    }));
  };

  const handleSaveConfig = async (config: BidangConfig) => {
    try {
      setSavingConfigId(config.id);
      
      // Extract sheet ID if user pasted full URL
      const sheetIdInput = config.sheetId || '';
      const match = sheetIdInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const extractedSheetId = match ? match[1] : sheetIdInput.trim();
      
      const configToSave = { ...config, sheetId: extractedSheetId };
      await saveBidangConfig(configToSave);
      
      // Update local state with extracted ID
      setConfigs(configs.map(c => c.id === config.id ? configToSave : c));
      setSuccessMsg(`Konfigurasi unit/bidang ${config.name} berhasil disimpan!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan konfigurasi');
    } finally {
      setSavingConfigId(null);
    }
  };

  const handleAddReq = () => {
    setLocalReqs([...localReqs, { id: `req_${Date.now()}`, label: 'Syarat Baru', description: '' }]);
  };

  const handleRemoveReq = (index: number) => {
    const newReqs = [...localReqs];
    newReqs.splice(index, 1);
    setLocalReqs(newReqs);
  };

  const handleChangeReq = (index: number, field: keyof Requirement, value: string) => {
    const newReqs = [...localReqs];
    newReqs[index] = { ...newReqs[index], [field]: value };
    setLocalReqs(newReqs);
  };

  // Wilayah Handlers
  const handleToggleExpandKec = (kecName: string) => {
    setExpandedKec(prev => ({ ...prev, [kecName]: !prev[kecName] }));
  };

  const handleAddKecamatan = () => {
    if (!newKecamatanName.trim()) return;
    const name = newKecamatanName.trim();
    if (wilayahList.some(w => w.kecamatan.toLowerCase() === name.toLowerCase())) {
      alert(`Kecamatan "${name}" sudah ada.`);
      return;
    }
    const updated = [...wilayahList, { kecamatan: name, desaList: [] }];
    setWilayahList(updated);
    setNewKecamatanName('');
    setSelectedKecForNewDesa(name);
    setExpandedKec(prev => ({ ...prev, [name]: true }));
  };

  const handleDeleteKecamatan = (kecName: string) => {
    if (confirm(`Hapus Kecamatan "${kecName}" beserta seluruh desanya?`)) {
      const updated = wilayahList.filter(w => w.kecamatan !== kecName);
      setWilayahList(updated);
      if (selectedKecForNewDesa === kecName && updated.length > 0) {
        setSelectedKecForNewDesa(updated[0].kecamatan);
      }
    }
  };

  const handleAddDesa = () => {
    if (!newDesaName.trim() || !selectedKecForNewDesa) return;
    const desa = newDesaName.trim();
    const updated = wilayahList.map(k => {
      if (k.kecamatan === selectedKecForNewDesa) {
        if (k.desaList.includes(desa)) {
          alert(`Desa "${desa}" sudah ada di Kecamatan ${k.kecamatan}.`);
          return k;
        }
        return { ...k, desaList: [...k.desaList, desa] };
      }
      return k;
    });
    setWilayahList(updated);
    setNewDesaName('');
    setExpandedKec(prev => ({ ...prev, [selectedKecForNewDesa]: true }));
  };

  const handleDeleteDesa = (kecName: string, desaName: string) => {
    const updated = wilayahList.map(k => {
      if (k.kecamatan === kecName) {
        return { ...k, desaList: k.desaList.filter(d => d !== desaName) };
      }
      return k;
    });
    setWilayahList(updated);
  };

  const handleSaveMasterWilayah = async () => {
    try {
      setIsSavingWilayah(true);
      await saveNagekeoWilayah(wilayahList);
      setSuccessMsg('Master data Kecamatan & Desa Kabupaten Nagekeo berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e) {
      alert('Gagal menyimpan master wilayah');
    } finally {
      setIsSavingWilayah(false);
    }
  };

  const handleResetDefaultWilayah = () => {
    if (confirm('Kembalikan data wilayah ke standar 7 Kecamatan & 115 Desa Nagekeo?')) {
      setWilayahList(DEFAULT_NAGEKEO_WILAYAH);
    }
  };

  const totalDesaCount = countTotalDesa(wilayahList);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between shadow-sm bg-white border-b border-slate-200 -mx-8 -mt-8 px-8 py-5 mb-8">
        <div className="flex flex-col">
          <h2 className="text-xl font-extrabold text-slate-800">Pengaturan Admin & Master Data</h2>
          <p className="text-sm text-slate-500">Konfigurasi Google Sheets, Pagu, Master Wilayah 115 Desa Nagekeo, dan Syarat Usulan.</p>
        </div>
      </header>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-200 flex items-center justify-between shadow-sm">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* MASTER DATA WILAYAH (115 DESA & 7 KECAMATAN NAGEKEO + PEMEKARAN) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-b-4 border-b-emerald-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Master Wilayah Kabupaten Nagekeo (Desa & Kecamatan)</h3>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola daftar per-desa ({totalDesaCount} Desa/Kelurahan) & ({wilayahList.length} Kecamatan). Dapat ditambah jika terjadi pemekaran wilayah.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaultWilayah}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              title="Reset ke daftar default 115 Desa Nagekeo"
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

        {/* Add Kecamatan & Add Desa Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 mb-5">
          <div>
            <label className="block text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-emerald-600" /> Tambah Kecamatan Baru (Pemekaran):
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
              <Plus className="w-3.5 h-3.5 text-emerald-600" /> Tambah Desa / Kelurahan Baru (Pemekaran):
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

        {/* Accordion list of Kecamatan & Desa */}
        {loadingWilayah ? (
          <div className="py-6 flex justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {wilayahList.map((k) => {
              const isExpanded = !!expandedKec[k.kecamatan];
              return (
                <div key={k.kecamatan} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <div 
                    onClick={() => handleToggleExpandKec(k.kecamatan)}
                    className="p-3 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-800 text-sm">Kecamatan {k.kecamatan}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
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
                        title="Hapus Kecamatan"
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
                            <div key={desa} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs shadow-2xs">
                              <span className="truncate text-slate-800 font-medium">{desa}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteDesa(k.kecamatan, desa)}
                                className="text-slate-300 hover:text-red-600 font-bold ml-1.5 shrink-0"
                                title="Hapus Desa"
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

      {/* PENGATURAN BIDANG & UNIT USULAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-b-4 border-b-blue-500">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Pengaturan Unit Usulan & Bidang DPUPR</h3>
        <p className="text-sm text-slate-500 mb-4">Atur Pagu Indikatif, Google Spreadsheet ID, dan Google Drive URL untuk setiap Bidang, Kecamatan, Desa, POKIR DPRD, dan RENJA OPD.</p>
        
        {loadingConfigs ? (
          <div className="py-8 flex justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {configs.map(config => (
              <div key={config.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800">{config.name}</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                    {config.id}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Total Pagu Indikatif (Rp)</label>
                      {config.paguPerSumberDana && Object.keys(config.paguPerSumberDana).length > 0 && (
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                          Dihitung Otomatis dari Rincian
                        </span>
                      )}
                    </div>
                    <input 
                      type="number"
                      value={config.pagu}
                      onChange={(e) => handleConfigChange(config.id, 'pagu', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-800"
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
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      placeholder="ID Google Sheet"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Folder Drive URL (Opsional)</label>
                    <input 
                      type="text"
                      value={config.folderUrl}
                      onChange={(e) => handleConfigChange(config.id, 'folderUrl', e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Link folder Google Drive"
                    />
                  </div>
                </div>

                {/* PEMISAHAN PAGU INDIKATIF BERDASARKAN SUMBER DANA */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-600" />
                      <h5 className="text-xs font-bold text-slate-800">
                        Pemisahan Pagu Indikatif Berdasarkan Sumber Dana
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      {(!config.paguPerSumberDana || Object.keys(config.paguPerSumberDana).length === 0) && (
                        <button
                          type="button"
                          onClick={() => handleApplyPresetSumberDana(config.id)}
                          className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          + Pasang Preset Standar (DAU, DAK, PAD)
                        </button>
                      )}
                      <div className="relative inline-block">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddSumberDanaToConfig(config.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="" disabled>+ Tambah Sumber Dana</option>
                          {SUMBER_DANA_LIST.map(sd => (
                            <option key={sd} value={sd.split(' ')[0]}>{sd}</option>
                          ))}
                          <option value="Lainnya">Sumber Dana Lainnya</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {config.paguPerSumberDana && Object.keys(config.paguPerSumberDana).length > 0 ? (
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {Object.entries(config.paguPerSumberDana).map(([sdName, sdAmount]) => (
                          <div key={sdName} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {sdName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSumberDanaFromConfig(config.id, sdName)}
                                className="text-slate-400 hover:text-red-600 text-xs font-bold p-0.5"
                                title="Hapus sumber dana ini"
                              >
                                &times;
                              </button>
                            </div>
                            <input
                              type="number"
                              value={(sdAmount as number) || ''}
                              onChange={(e) => handleSumberDanaPaguChange(config.id, sdName, parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <div className="text-[10px] text-slate-500 truncate font-semibold">
                              {formatRupiah((sdAmount as number) || 0)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 px-1 text-xs">
                        <span className="text-slate-500 font-bold">Akumulasi Total Pagu Sumber Dana:</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          {formatRupiah(Object.values((config.paguPerSumberDana || {}) as Record<string, number>).reduce((a: number, b: number) => a + (Number(b) || 0), 0))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic bg-white p-3 rounded-xl border border-dashed border-slate-200 text-center">
                      Belum ada pemisahan sumber dana untuk unit ini. Klik tombol "+ Pasang Preset Standar" atau pilih "+ Tambah Sumber Dana" untuk membagi pagu indikatif per pos anggaran (DAU, DAK Fisik, PAD, dll).
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => handleSaveConfig(config)}
                    disabled={savingConfigId === config.id}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                  >
                    {savingConfigId === config.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan {config.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SYARAT STANDAR BAPPENAS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-b-4 border-b-yellow-400">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Syarat Usulan Standar Evaluasi</h3>
            <p className="text-sm text-slate-500">Sesuaikan syarat yang harus dicentang saat membuat usulan.</p>
          </div>
          <button 
            onClick={() => saveRequirements(localReqs)}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Syarat
          </button>
        </div>
        
        {reqError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            Gagal memuat syarat: {reqError}
          </div>
        )}

        <div className="space-y-3">
          {localReqs.map((req, idx) => (
            <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={req.label}
                  onChange={(e) => handleChangeReq(idx, 'label', e.target.value)}
                  placeholder="Nama Syarat"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                />
                <input
                  type="text"
                  value={req.description}
                  onChange={(e) => handleChangeReq(idx, 'description', e.target.value)}
                  placeholder="Deskripsi singkat"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                />
              </div>
              <button 
                onClick={() => handleRemoveReq(idx)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          
          <button 
            onClick={handleAddReq}
            className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 font-medium rounded-lg hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Syarat
          </button>
        </div>
      </div>
    </div>
  );
}

