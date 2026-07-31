import React, { useState, useEffect } from 'react';
import { useRequirements } from '../useRequirements';
import { Save, Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Requirement, BidangConfig, BIDANG_LIST } from '../types';
import { getAllBidangConfigs, saveBidangConfig } from '../services/configService';

export default function Settings() {
  const [configs, setConfigs] = useState<BidangConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [savingConfigId, setSavingConfigId] = useState<string | null>(null);

  const { requirements, loading, error: reqError, saveRequirements } = useRequirements();
  const [localReqs, setLocalReqs] = useState<Requirement[]>([]);

  useEffect(() => {
    if (requirements.length > 0 && localReqs.length === 0) {
      setLocalReqs(requirements);
    }
  }, [requirements]);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const data = await getAllBidangConfigs();
        setConfigs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConfigs(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleConfigChange = (id: string, field: keyof BidangConfig, value: any) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSaveConfig = async (config: BidangConfig) => {
    try {
      setSavingConfigId(config.id);
      await saveBidangConfig(config);
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

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between shadow-sm bg-white border-b border-slate-200 -mx-8 -mt-8 px-8 py-5 mb-8">
        <div className="flex flex-col">
          <h2 className="text-xl font-extrabold text-slate-800">Pengaturan Admin</h2>
          <p className="text-sm text-slate-500">Konfigurasi penyimpanan data ke Google Sheets dan atur syarat usulan.</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-b-4 border-b-blue-500">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Pengaturan Bidang</h3>
        
        {loadingConfigs ? (
          <div className="py-8 flex justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {configs.map(config => (
              <div key={config.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                <h4 className="font-bold text-slate-800 mb-3">{config.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Pagu Indikatif (Rp)</label>
                    <input 
                      type="number"
                      value={config.pagu}
                      onChange={(e) => handleConfigChange(config.id, 'pagu', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Spreadsheet ID</label>
                    <input 
                      type="text"
                      value={config.sheetId}
                      onChange={(e) => handleConfigChange(config.id, 'sheetId', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                      placeholder="ID Google Sheet"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Folder Drive URL (Opsional)</label>
                    <input 
                      type="text"
                      value={config.folderUrl}
                      onChange={(e) => handleConfigChange(config.id, 'folderUrl', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                      placeholder="Link folder Google Drive"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => handleSaveConfig(config)}
                    disabled={savingConfigId === config.id}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-b-4 border-b-yellow-400">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Syarat Usulan (Standar BAPPENAS)</h3>
            <p className="text-sm text-slate-500">Sesuaikan syarat yang harus dicentang saat membuat usulan.</p>
          </div>
          <button 
            onClick={() => saveRequirements(localReqs)}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
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
