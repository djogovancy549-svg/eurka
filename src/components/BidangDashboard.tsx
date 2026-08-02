import React, { useState, useEffect } from 'react';
import { getRows, appendRow } from '../sheetsApi';
import { getAccessToken } from '../auth';
import { useRequirements } from '../useRequirements';
import { Proposal, BidangConfig, BIDANG_LIST } from '../types';
import { getAllBidangConfigs, saveBidangConfig } from '../services/configService';
import { Plus, Video, MapPin, DollarSign, Calendar, Info, Loader2, Save, ExternalLink, Edit2, Folder, CheckCircle, Clock, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface BidangDashboardProps {
  userEmail: string;
  userName: string;
}

export default function BidangDashboard({ userEmail, userName }: BidangDashboardProps) {
  const { requirements } = useRequirements();
  const [configs, setConfigs] = useState<BidangConfig[]>([]);
  const [selectedBidangId, setSelectedBidangId] = useState<string>(localStorage.getItem('urk_selected_bidang') || '');
  const [selectedConfig, setSelectedConfig] = useState<BidangConfig | null>(null);
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [editingConfig, setEditingConfig] = useState(false);
  const [tempSheetId, setTempSheetId] = useState('');
  const [tempFolderUrl, setTempFolderUrl] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeFolderProposal, setActiveFolderProposal] = useState<Proposal | null>(null);

  const openExternalLink = (rawUrl?: string) => {
    if (!rawUrl) {
      alert('Tautan folder belum diisi.');
      return;
    }
    let url = rawUrl.trim();
    if (url.match(/^(\d{1,3}\.){3}\d{1,3}$/) || url.includes('0.0.7.234') || url === '0.0.7.234') {
      alert(`Tautan folder tidak valid (${url}). Harap masukkan tautan Google Drive yang valid (contoh: https://drive.google.com/drive/folders/...).`);
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    try {
      new URL(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      alert(`Format tautan tidak valid: ${rawUrl}`);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    tahunUsulan: '2025',
    programName: '',
    activityName: '',
    projectName: '',
    location: '',
    estimatedBudget: '',
    justification: '',
    zoomLink: '',
    documentFolderUrl: '',
    reqs: {} as Record<string, boolean>
  });

  const [attachments, setAttachments] = useState<{ name: string; url: string; size?: string; type?: string; uploadedAt?: string }[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            url: base64Url,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type,
            uploadedAt: new Date().toISOString()
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'diterima':
        return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-200"><CheckCircle className="w-3 h-3" /> Diterima</span>;
      case 'belum_lengkap':
        return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200"><AlertTriangle className="w-3 h-3" /> Belum Lengkap</span>;
      case 'revisi':
        return <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold border border-purple-200"><RefreshCw className="w-3 h-3" /> Di-revisi</span>;
      case 'ditolak':
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold border border-red-200"><XCircle className="w-3 h-3" /> Ditolak</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200"><Clock className="w-3 h-3" /> Menunggu Verifikasi</span>;
    }
  };

  useEffect(() => {
    const fetchConfigs = async () => {
      const data = await getAllBidangConfigs();
      setConfigs(data);
      if (!selectedBidangId && data.length > 0) {
        handleBidangSelect(data[0].id);
      }
    };
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (selectedBidangId && configs.length > 0) {
      const config = configs.find(c => c.id === selectedBidangId) || null;
      setSelectedConfig(config);
      if (config) {
        setTempSheetId(config.sheetId || '');
        setTempFolderUrl(config.folderUrl || '');
      }
      setEditingConfig(false);
      fetchProposals(config?.sheetId);
    }
  }, [selectedBidangId, configs]);

  const handleSaveConfig = async () => {
    if (!selectedConfig) return;
    try {
      const match = tempSheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const extractedSheetId = match ? match[1] : tempSheetId.trim();

      const updated = { 
        ...selectedConfig, 
        sheetId: extractedSheetId, 
        folderUrl: tempFolderUrl 
      };
      await saveBidangConfig(updated);
      setConfigs(configs.map(c => c.id === updated.id ? updated : c));
      setSelectedConfig(updated);
      setEditingConfig(false);
      fetchProposals(updated.sheetId);
      setSuccessMsg('Tautan berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Gagal menyimpan konfigurasi bidang.');
    }
  };

  const handleBidangSelect = (id: string) => {
    setSelectedBidangId(id);
    localStorage.setItem('urk_selected_bidang', id);
  };

  const fetchProposals = async (sheetId?: string) => {
    if (!sheetId) {
      setProposals([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) return;
      
      const rows = await getRows(token, sheetId, 'Proposals!A2:P');
      const formatted = rows.map((r: any[], index: number) => {
        let reqs = {};
        try { reqs = JSON.parse(r[10] || '{}'); } catch (e) {}
        let atts = [];
        try { atts = JSON.parse(r[15] || '[]'); } catch (e) {}
        
        return {
          id: r[0],
          rowIndex: index + 2,
          submittedAt: r[1],
          tahunUsulan: r[2],
          programName: r[3],
          activityName: r[4],
          projectName: r[5],
          location: r[6],
          estimatedBudget: parseFloat(r[7]) || 0,
          justification: r[8],
          zoomLink: r[9],
          requirementsMet: reqs,
          submittedBy: r[11],
          documentFolderUrl: r[12] || '',
          status: (r[13] as any) || 'pending',
          adminNotes: r[14] || '',
          attachments: atts
        } as Proposal;
      });
      
      setProposals(formatted.reverse());
    } catch (err) {
      console.error('Failed to fetch proposals', err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig?.sheetId) {
      alert("Spreadsheet belum dikonfigurasi oleh Admin untuk bidang ini.");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const timestamp = new Date().toISOString();
      const id = uuidv4().substring(0, 8);
      
      const rowData = [
        id,
        timestamp,
        formData.tahunUsulan,
        formData.programName,
        formData.activityName,
        formData.projectName,
        formData.location,
        formData.estimatedBudget,
        formData.justification,
        formData.zoomLink,
        JSON.stringify(formData.reqs),
        userName || userEmail,
        formData.documentFolderUrl,
        'pending',
        '',
        JSON.stringify(attachments)
      ];

      await appendRow(token, selectedConfig.sheetId, 'Proposals!A:P', rowData);
      
      setShowForm(false);
      setFormData({ tahunUsulan: '2025', programName: '', activityName: '', projectName: '', location: '', estimatedBudget: '', justification: '', zoomLink: '', documentFolderUrl: '', reqs: {} });
      setAttachments([]);
      fetchProposals(selectedConfig.sheetId);
    } catch (err) {
      console.error('Submit failed', err);
      alert('Gagal mengirim usulan. Pastikan Admin sudah mengatur ID Sheet yang benar dan Anda memiliki akses edit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReq = (reqId: string) => {
    setFormData(prev => ({ ...prev, reqs: { ...prev.reqs, [reqId]: !prev.reqs[reqId] } }));
  };
  
  const totalBudget = proposals.reduce((sum, p) => sum + p.estimatedBudget, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between shadow-sm bg-white border-b border-slate-200 -mx-8 -mt-8 px-8 py-5 mb-8">
        <div className="flex flex-col">
          <h2 className="text-xl font-extrabold text-slate-800">Dashboard Usulan Rencana Kerja</h2>
          <p className="text-sm text-slate-500">Tahun Anggaran 2025 &bull; Kab. Nagekeo</p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <select 
            value={selectedBidangId}
            onChange={e => handleBidangSelect(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Pilih Bidang Anda</option>
            {configs.map(c => (
              <option key={c.id} value={c.id}>Bidang {c.name}</option>
            ))}
          </select>

          <button
            onClick={() => window.open('https://meet.google.com/new', '_blank')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-emerald-200 shadow-sm"
            title="Buka Google Meet untuk Diskusi & Berbagi Layar"
          >
            <Video className="w-5 h-5 text-emerald-600" /> Buka Google Meet
          </button>

          {selectedConfig?.folderUrl && (
            <a 
              href={selectedConfig.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-indigo-100"
              title="Unggah berkas persyaratan ke Google Drive Bidang"
            >
              <ExternalLink className="w-5 h-5" /> Upload Dokumen
            </a>
          )}

          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!selectedConfig?.sheetId}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showForm ? 'Batal' : <><Plus className="w-5 h-5" /> Usulan Baru</>}
          </button>
        </div>
      </header>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-200 flex items-center justify-between">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* Info Banner on File Upload & Google Meet */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 text-blue-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-bold">Informasi Penyimpanan Berkas & Google Meet</p>
            <p className="text-blue-700">
              📁 Berkas persyaratan diunggah langsung ke <b>Google Drive Folder</b> masing-masing bidang (klik tombol <b>Upload Dokumen</b> di atas). 
              🎥 Gunakan tombol <b>Buka Google Meet</b> untuk memulai rapat video instan dan berbagi layar saat diskusi usulan.
            </p>
          </div>
        </div>
        {selectedConfig?.folderUrl && (
          <a
            href={selectedConfig.folderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> Buka Folder Drive
          </a>
        )}
      </div>

      {/* Config Form if missing or editing */}
      {selectedConfig && (!selectedConfig.sheetId || editingConfig) && (
        <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-6 mb-6">
          <h3 className="text-amber-900 font-bold mb-2">Konfigurasi Bidang {selectedConfig.name}</h3>
          <p className="text-amber-700 text-sm mb-4">
            Tautkan Google Sheet untuk menyimpan data usulan bidang ini. Tautan ini akan terhubung ke Admin.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-amber-800 mb-1">Spreadsheet ID atau Link</label>
              <input 
                type="text" 
                value={tempSheetId} 
                onChange={e => setTempSheetId(e.target.value)} 
                placeholder="ID Google Sheet atau Tempel URL"
                className="w-full border border-amber-300 bg-white rounded-lg px-3 py-2 outline-none focus:border-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-800 mb-1">Folder Drive URL (Opsional)</label>
              <input 
                type="text" 
                value={tempFolderUrl} 
                onChange={e => setTempFolderUrl(e.target.value)} 
                placeholder="Link Folder Google Drive"
                className="w-full border border-amber-300 bg-white rounded-lg px-3 py-2 outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editingConfig && selectedConfig.sheetId && (
              <button onClick={() => setEditingConfig(false)} className="px-4 py-2 text-amber-800 font-medium text-sm hover:bg-amber-100 rounded-lg">
                Batal
              </button>
            )}
            <button onClick={handleSaveConfig} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
              <Save className="w-4 h-4" /> Simpan Konfigurasi
            </button>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-blue-500">
          <div className="flex justify-between items-start mb-1">
            <p className="text-slate-500 text-xs font-bold uppercase">Total Usulan Bidang</p>
            {selectedConfig?.sheetId && !editingConfig && (
              <button onClick={() => setEditingConfig(true)} className="text-slate-400 hover:text-blue-600" title="Edit Konfigurasi">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-800">{proposals.length}</span>
            <span className="text-blue-500 text-xs font-bold">Terdaftar</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-yellow-400">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Anggaran Diusulkan</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-800">
              Rp {(totalBudget / 1000000000).toFixed(2)}M
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-purple-500">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Pagu Indikatif (Batas)</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-800">
              Rp {((selectedConfig?.pagu || 0) / 1000000000).toFixed(2)}M
            </span>
            <span className={`text-xs font-bold ${totalBudget > (selectedConfig?.pagu || 0) ? 'text-red-500' : 'text-green-500'}`}>
              {totalBudget > (selectedConfig?.pagu || 0) ? 'Over Budget' : 'Aman'}
            </span>
          </div>
        </div>
      </section>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-900">Form Usulan Baru</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Tahun Usulan *</label>
                <input required type="text" value={formData.tahunUsulan} onChange={e => setFormData({...formData, tahunUsulan: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nama Program</label>
                <input type="text" value={formData.programName} onChange={e => setFormData({...formData, programName: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nama Kegiatan</label>
                <input type="text" value={formData.activityName} onChange={e => setFormData({...formData, activityName: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nama Proyek / Pekerjaan *</label>
                <input required type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Lokasi Pekerjaan *</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Estimasi Anggaran (Rp) *</label>
                <input required type="number" min="0" value={formData.estimatedBudget} onChange={e => setFormData({...formData, estimatedBudget: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-slate-700">Justifikasi / Urgensi *</label>
                <textarea required rows={3} value={formData.justification} onChange={e => setFormData({...formData, justification: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-indigo-600" /> Link Folder Google Drive / Dokumen Persyaratan Usulan
                </label>
                <input 
                  type="url" 
                  placeholder="https://drive.google.com/drive/folders/..." 
                  value={formData.documentFolderUrl} 
                  onChange={e => setFormData({...formData, documentFolderUrl: e.target.value})} 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                />
                <p className="text-xs text-slate-500 mt-1">Tempel tautan folder Google Drive yang berisi proposal dan dokumen persyaratan lengkap untuk diakses admin.</p>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-indigo-600" /> Upload Berkas / Dokumen Pendukung Langsung dari Aplikasi (PDF, Excel, Word, dll)
                </label>
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileUpload}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-bold text-slate-700">Berkas yang akan diunggah:</p>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-xs font-medium text-indigo-900">
                          <span>{att.name} ({att.size})</span>
                          <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-medium text-slate-900 mb-4">Syarat & Dokumen Pendukung (Standar Admin)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {requirements.map((req) => (
                  <label key={req.id} className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <input type="checkbox" checked={formData.reqs[req.id] || false} onChange={() => toggleReq(req.id)} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{req.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{req.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Mengirim...' : 'Kirim Usulan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Proposals */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p>Memuat usulan...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Belum Ada Usulan</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              Daftar usulan kosong. Klik tombol Usulan Baru untuk memulai.
            </p>
          </div>
        ) : (
          proposals.map((proposal) => {
            const reqsMetCount = Object.values(proposal.requirementsMet || {}).filter(Boolean).length;
            const totalReqs = requirements.length;
            
            return (
              <div key={proposal.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(proposal.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-500">Tahun Usulan: {proposal.tahunUsulan || 'N/A'}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-500">Oleh {proposal.submittedBy}</span>
                      <span className="ml-auto">{renderStatusBadge(proposal.status)}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xl font-bold text-slate-800">{proposal.projectName}</h3>
                      <button
                        type="button"
                        onClick={() => setActiveFolderProposal(proposal)}
                        className="shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-200 transition-all shadow-sm"
                        title="Kelola & Buka Dokumen / Folder"
                      >
                        <Folder className="w-4 h-4 text-indigo-600" /> Buka Dokumen & Folder
                      </button>
                    </div>

                    {/* Attachments Display */}
                    {proposal.attachments && proposal.attachments.length > 0 && (
                      <div className="mt-3 mb-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <p className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1">
                          <Folder className="w-3.5 h-3.5 text-indigo-600" /> Berkas Dokumen Diunggah dari Aplikasi ({proposal.attachments.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {proposal.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              download={att.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-900 transition-all shadow-sm"
                            >
                              <span>📄 {att.name}</span>
                              {att.size && <span className="text-indigo-400 font-normal">({att.size})</span>}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {(proposal.programName || proposal.activityName) && (
                      <p className="text-sm font-semibold text-slate-600 mb-2">
                        {proposal.programName && `Program: ${proposal.programName}`}
                        {proposal.programName && proposal.activityName && ` | `}
                        {proposal.activityName && `Kegiatan: ${proposal.activityName}`}
                      </p>
                    )}
                    <p className="text-sm text-slate-600 mb-4">{proposal.justification}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 mb-4">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 font-medium">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {proposal.location}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 font-medium">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(proposal.estimatedBudget)}
                        {selectedConfig?.pagu ? (
                          <span className={`text-xs ml-1 ${proposal.estimatedBudget > selectedConfig.pagu ? 'text-red-500' : 'text-slate-500'}`}>
                            ({((proposal.estimatedBudget / selectedConfig.pagu) * 100).toFixed(1)}% dari Pagu Bidang)
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold border border-green-100">
                        {reqsMetCount} / {totalReqs} Syarat Lengkap
                      </div>
                    </div>

                    {/* Admin Notes Display */}
                    {proposal.adminNotes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-blue-800">
                          <Info className="w-4 h-4" /> Catatan Admin / Evaluasi:
                        </div>
                        <p className="italic text-blue-900/90 pl-5">"{proposal.adminNotes}"</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 flex flex-col justify-center min-w-[200px]">
                    {proposal.zoomLink ? (
                      <a 
                        href={proposal.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-5 py-3 rounded-xl text-sm font-bold transition-all"
                      >
                        <Video className="w-5 h-5" />
                        Gabung Google Meet
                      </a>
                    ) : (
                      <div className="text-center px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-500 font-medium">
                        Menunggu Jadwal Meet dari Admin
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeFolderProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Kelola Dokumen & Folder</h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{activeFolderProposal.projectName}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveFolderProposal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tautan Google Drive Folder:</p>
                {activeFolderProposal.documentFolderUrl || selectedConfig?.folderUrl ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={activeFolderProposal.documentFolderUrl || selectedConfig?.folderUrl || ''}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => openExternalLink(activeFolderProposal.documentFolderUrl || selectedConfig?.folderUrl)}
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Folder
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Belum ada link Google Drive yang didaftarkan untuk usulan atau bidang ini.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Berkas Dokumen Diunggah dari Aplikasi ({activeFolderProposal.attachments?.length || 0}):
                </p>
                {activeFolderProposal.attachments && activeFolderProposal.attachments.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {activeFolderProposal.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="text-lg">📄</span>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                            <p className="text-[10px] text-slate-400">{att.size || 'Berkas Dokumen'}</p>
                          </div>
                        </div>
                        <a
                          href={att.url}
                          download={att.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Unduh / Lihat
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs text-slate-500 font-medium">Belum ada berkas dokumen yang diunggah langsung dari aplikasi untuk usulan ini.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveFolderProposal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
