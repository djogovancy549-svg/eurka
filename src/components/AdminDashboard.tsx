import React, { useState, useEffect } from 'react';
import { getRows, updateCell } from '../sheetsApi';
import { getAccessToken } from '../auth';
import { useRequirements } from '../useRequirements';
import { Proposal, BidangConfig } from '../types';
import { getAllBidangConfigs, saveBidangConfig } from '../services/configService';
import { Video, MapPin, DollarSign, Calendar, Info, Loader2, ExternalLink, Edit2, Settings, Save, Folder, CheckCircle, Clock, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface AdminDashboardProps {
  userEmail: string;
  userName: string;
}

export default function AdminDashboard({ userEmail, userName }: AdminDashboardProps) {
  const { requirements } = useRequirements();
  const [configs, setConfigs] = useState<BidangConfig[]>([]);
  const [selectedBidangId, setSelectedBidangId] = useState<string>('');
  const [selectedConfig, setSelectedConfig] = useState<BidangConfig | null>(null);
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingConfig, setEditingConfig] = useState(false);
  const [tempSheetId, setTempSheetId] = useState('');
  const [tempFolderUrl, setTempFolderUrl] = useState('');
  const [tempPagu, setTempPagu] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editingZoomId, setEditingZoomId] = useState<string | null>(null);
  const [tempZoomLink, setTempZoomLink] = useState('');
  const [savingZoom, setSavingZoom] = useState(false);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [activeFolderProposal, setActiveFolderProposal] = useState<Proposal | null>(null);

  const handleSaveZoomLink = async (proposal: Proposal) => {
    if (!selectedConfig?.sheetId || !proposal.rowIndex) return;
    setSavingZoom(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      await updateCell(token, selectedConfig.sheetId, `Proposals!J${proposal.rowIndex}`, tempZoomLink);
      
      setProposals(proposals.map(p => p.id === proposal.id ? { ...p, zoomLink: tempZoomLink } : p));
      setEditingZoomId(null);
    } catch (err) {
      console.error('Failed to update zoom link', err);
      alert('Gagal menyimpan link meeting');
    } finally {
      setSavingZoom(false);
    }
  };

  const handleUpdateStatus = async (proposal: Proposal, newStatus: string) => {
    try {
      const token = await getAccessToken();
      if (!token || !selectedConfig?.sheetId || !proposal.rowIndex) return;
      await updateCell(token, selectedConfig.sheetId, `Proposals!N${proposal.rowIndex}`, newStatus);
      setProposals(proposals.map(p => p.id === proposal.id ? { ...p, status: newStatus as any } : p));
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Gagal memperbarui status usulan.');
    }
  };

  const handleSaveNotes = async (proposal: Proposal) => {
    try {
      const token = await getAccessToken();
      if (!token || !selectedConfig?.sheetId || !proposal.rowIndex) return;
      await updateCell(token, selectedConfig.sheetId, `Proposals!O${proposal.rowIndex}`, tempNotes);
      setProposals(proposals.map(p => p.id === proposal.id ? { ...p, adminNotes: tempNotes } : p));
      setEditingNotesId(null);
    } catch (e) {
      console.error('Failed to save notes', e);
      alert('Gagal menyimpan catatan admin.');
    }
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
      if (data.length > 0) {
        setSelectedBidangId(data[0].id);
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
        setTempPagu(config.pagu || 0);
      }
      setEditingConfig(false);
      fetchProposals(config?.sheetId);
    }
  }, [selectedBidangId, configs]);

  const handleSaveConfig = async () => {
    if (!selectedConfig) return;
    try {
      // Extract sheet ID if user pasted full URL
      const match = tempSheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const extractedSheetId = match ? match[1] : tempSheetId.trim();

      const updated = { 
        ...selectedConfig, 
        sheetId: extractedSheetId, 
        folderUrl: tempFolderUrl,
        pagu: tempPagu
      };
      await saveBidangConfig(updated);
      setConfigs(configs.map(c => c.id === updated.id ? updated : c));
      setSelectedConfig(updated);
      setEditingConfig(false);
      fetchProposals(updated.sheetId);
      setSuccessMsg('Konfigurasi bidang berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Gagal menyimpan konfigurasi bidang.');
    }
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

  const totalBudget = proposals.reduce((sum, p) => sum + p.estimatedBudget, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between shadow-sm bg-white border-b border-slate-200 -mx-8 -mt-8 px-8 py-5 mb-8">
        <div className="flex flex-col">
          <h2 className="text-xl font-extrabold text-slate-800">Dashboard Evaluasi (Admin)</h2>
          <p className="text-sm text-slate-500">Rekapitulasi Usulan Rencana Kerja</p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <select 
            value={selectedBidangId}
            onChange={e => setSelectedBidangId(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {configs.map(c => (
              <option key={c.id} value={c.id}>Rekap Bidang {c.name}</option>
            ))}
          </select>
          <button
            onClick={() => setEditingConfig(!editingConfig)}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border ${editingConfig ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
          >
            <Settings className="w-4 h-4" /> Pengaturan Bidang
          </button>
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
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-indigo-100"
            >
              <ExternalLink className="w-4 h-4" /> Drive Bidang
            </a>
          )}
        </div>
      </header>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-200 flex items-center justify-between">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* Config Form if editing */}
      {selectedConfig && (editingConfig || !selectedConfig.sheetId) && (
        <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-6 mb-6">
          <h3 className="text-amber-900 font-bold mb-2">Konfigurasi Bidang {selectedConfig.name}</h3>
          <p className="text-amber-700 text-sm mb-4">
            Pengaturan tautan data dan pagu untuk bidang ini.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-amber-800 mb-1">Spreadsheet ID</label>
              <input 
                type="text" 
                value={tempSheetId} 
                onChange={e => setTempSheetId(e.target.value)} 
                placeholder="ID Google Sheet"
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
            <div>
              <label className="block text-xs font-bold text-amber-800 mb-1">Pagu Indikatif (Batas)</label>
              <input 
                type="number"
                min="0"
                value={tempPagu} 
                onChange={e => setTempPagu(Number(e.target.value))} 
                placeholder="0"
                className="w-full border border-amber-300 bg-white rounded-lg px-3 py-2 outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {selectedConfig.sheetId && (
              <button onClick={() => setEditingConfig(false)} className="px-4 py-2 text-amber-800 font-medium text-sm hover:bg-amber-100 rounded-lg">
                Tutup
              </button>
            )}
            <button onClick={handleSaveConfig} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
              <Save className="w-4 h-4" /> Simpan
            </button>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-blue-500">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Usulan Bidang</p>
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
              Daftar usulan kosong untuk bidang ini.
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
                            ({((proposal.estimatedBudget / selectedConfig.pagu) * 100).toFixed(1)}% dari Pagu)
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold border border-green-100">
                        {reqsMetCount} / {totalReqs} Syarat Lengkap
                      </div>
                    </div>

                    {/* Admin Verification & Notes Box */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Status Verifikasi:</span>
                          <select
                            value={proposal.status || 'pending'}
                            onChange={(e) => handleUpdateStatus(proposal, e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                          >
                            <option value="pending">⏳ Menunggu Verifikasi</option>
                            <option value="diterima">✅ Diterima</option>
                            <option value="belum_lengkap">⚠️ Belum Lengkap</option>
                            <option value="revisi">🔄 Di-revisi</option>
                            <option value="ditolak">❌ Ditolak</option>
                          </select>
                        </div>
                      </div>

                      {/* Admin Notes */}
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">Catatan Admin / Evaluasi:</span>
                          {editingNotesId !== proposal.id && (
                            <button
                              onClick={() => {
                                setEditingNotesId(proposal.id);
                                setTempNotes(proposal.adminNotes || '');
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> {proposal.adminNotes ? 'Edit Catatan' : '+ Tambah Catatan'}
                            </button>
                          )}
                        </div>

                        {editingNotesId === proposal.id ? (
                          <div className="space-y-2 mt-2">
                            <textarea
                              rows={2}
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Tuliskan catatan verifikasi, kekurangan dokumen, atau revisi..."
                              className="w-full border border-slate-300 bg-white rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleSaveNotes(proposal)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" /> Simpan Catatan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 italic">
                            {proposal.adminNotes ? `"${proposal.adminNotes}"` : 'Belum ada catatan dari admin.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex flex-col gap-2 min-w-[200px]">
                    {editingZoomId === proposal.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="url"
                          placeholder="Link Google Meet..."
                          value={tempZoomLink}
                          onChange={(e) => setTempZoomLink(e.target.value)}
                          className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingZoomId(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold transition-all"
                          >
                            Batal
                          </button>
                          <button 
                            onClick={() => handleSaveZoomLink(proposal)}
                            disabled={savingZoom}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {savingZoom ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Simpan'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {proposal.zoomLink ? (
                          <a 
                            href={proposal.zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                          >
                            <Video className="w-4 h-4" />
                            Gabung Meet
                          </a>
                        ) : (
                          <div className="text-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-500 font-medium mb-1">
                            Belum ada link
                          </div>
                        )}
                        <button 
                          onClick={() => {
                            setTempZoomLink(proposal.zoomLink || '');
                            setEditingZoomId(proposal.id);
                          }}
                          className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2 rounded-xl text-sm font-bold transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                          Atur Google Meet
                        </button>
                      </>
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
                    <a
                      href={activeFolderProposal.documentFolderUrl || selectedConfig?.folderUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Folder
                    </a>
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
