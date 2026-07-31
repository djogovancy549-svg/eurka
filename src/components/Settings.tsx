import React, { useState } from 'react';
import { createSpreadsheet, initSpreadsheetHeaders } from '../sheetsApi';
import { getAccessToken } from '../auth';
import { useRequirements } from '../useRequirements';
import { Save, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Requirement } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SettingsProps {
  spreadsheetId: string | null;
  updateSpreadsheetId: (id: string) => void;
}

export default function Settings({ spreadsheetId, updateSpreadsheetId }: SettingsProps) {
  const [inputUrl, setInputUrl] = useState(spreadsheetId || '');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { requirements, loading, error: reqError, saveRequirements } = useRequirements(spreadsheetId);
  const [localReqs, setLocalReqs] = useState<Requirement[]>([]);
  
  // Sync local reqs when fetched
  React.useEffect(() => {
    if (requirements.length > 0 && localReqs.length === 0) {
      setLocalReqs(requirements);
    }
  }, [requirements]);

  const handleSaveId = () => {
    // Extract ID if URL is pasted
    let finalId = inputUrl;
    const match = inputUrl.match(/\/d\/(.*?)(\/|$)/);
    if (match && match[1]) {
      finalId = match[1];
    }
    updateSpreadsheetId(finalId);
    setInputUrl(finalId);
    setLocalReqs([]); // Reset local reqs to trigger refetch
  };

  const handleCreateNew = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      
      const sheet = await createSpreadsheet(token, 'Data URK PUPR Nagekeo');
      await initSpreadsheetHeaders(token, sheet.spreadsheetId);
      
      updateSpreadsheetId(sheet.spreadsheetId);
      setInputUrl(sheet.spreadsheetId);
      setLocalReqs([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsCreating(false);
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

  const handleSaveReqs = async () => {
    await saveRequirements(localReqs);
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
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Database Google Sheets</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Spreadsheet ID atau URL</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Misal: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button 
                onClick={handleSaveId}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Simpan
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Masukkan ID dari Google Sheets yang sudah ada, atau buat baru secara otomatis.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button 
              onClick={handleCreateNew}
              disabled={isCreating}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? 'Membuat Spreadsheet...' : 'Buat Spreadsheet Baru'}
            </button>
            
            {spreadsheetId && (
              <a 
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                Buka Spreadsheet
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {spreadsheetId && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-b-4 border-b-yellow-400">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Syarat Usulan (Standar BAPPENAS)</h3>
              <p className="text-sm text-slate-500">Sesuaikan syarat yang harus dicentang saat membuat usulan.</p>
            </div>
            <button 
              onClick={handleSaveReqs}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
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
      )}
    </div>
  );
}
