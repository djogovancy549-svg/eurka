import React, { useState, useEffect } from 'react';
import { getRows, appendRow } from '../sheetsApi';
import { getAccessToken } from '../auth';
import { useRequirements } from '../useRequirements';
import { Proposal } from '../types';
import { Plus, Video, MapPin, DollarSign, Calendar, Info, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface DashboardProps {
  spreadsheetId: string | null;
  userEmail: string;
  userName: string;
}

export default function Dashboard({ spreadsheetId, userEmail, userName }: DashboardProps) {
  const { requirements } = useRequirements(spreadsheetId);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    projectName: '',
    location: '',
    estimatedBudget: '',
    justification: '',
    zoomLink: '',
    reqs: {} as Record<string, boolean>
  });

  const fetchProposals = async () => {
    if (!spreadsheetId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) return;
      
      const rows = await getRows(token, spreadsheetId, 'Proposals!A2:I');
      const formatted = rows.map((r: any[]) => {
        let reqs = {};
        try { reqs = JSON.parse(r[7] || '{}'); } catch (e) {}
        
        return {
          id: r[0],
          submittedAt: r[1],
          projectName: r[2],
          location: r[3],
          estimatedBudget: parseFloat(r[4]) || 0,
          justification: r[5],
          zoomLink: r[6],
          requirementsMet: reqs,
          submittedBy: r[8]
        } as Proposal;
      });
      
      setProposals(formatted.reverse()); // Show newest first
    } catch (err) {
      console.error('Failed to fetch proposals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [spreadsheetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetId) return;

    try {
      setIsSubmitting(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const timestamp = new Date().toISOString();
      const id = uuidv4().substring(0, 8);
      
      const rowData = [
        id,
        timestamp,
        formData.projectName,
        formData.location,
        formData.estimatedBudget,
        formData.justification,
        formData.zoomLink,
        JSON.stringify(formData.reqs),
        userName || userEmail
      ];

      await appendRow(token, spreadsheetId, 'Proposals!A:I', rowData);
      
      // Reset form
      setShowForm(false);
      setFormData({
        projectName: '',
        location: '',
        estimatedBudget: '',
        justification: '',
        zoomLink: '',
        reqs: {}
      });
      
      // Refresh
      fetchProposals();
    } catch (err) {
      console.error('Submit failed', err);
      alert('Gagal mengirim usulan. Pastikan Google Sheet sudah dikonfigurasi dan Anda memiliki akses edit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReq = (reqId: string) => {
    setFormData(prev => ({
      ...prev,
      reqs: {
        ...prev.reqs,
        [reqId]: !prev.reqs[reqId]
      }
    }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between shadow-sm bg-white border-b border-slate-200 -mx-8 -mt-8 px-8 py-5 mb-8">
        <div className="flex flex-col">
          <h2 className="text-xl font-extrabold text-slate-800">Dashboard Usulan Rencana Kerja</h2>
          <p className="text-sm text-slate-500">Tahun Anggaran 2025 &bull; Kab. Nagekeo</p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!spreadsheetId}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showForm ? 'Batal' : <><Plus className="w-5 h-5" /> Usulan Baru</>}
          </button>
          <div className="h-10 w-10 bg-slate-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600 hidden sm:flex">
            {userName ? userName.substring(0, 2).toUpperCase() : 'AD'}
          </div>
        </div>
      </header>

      {/* Overview Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-blue-500">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Usulan</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-800">{proposals.length}</span>
            <span className="text-blue-500 text-xs font-bold">Terdaftar</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-yellow-400">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Pagu Dana</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-800">
              Rp {(proposals.reduce((sum, p) => sum + p.estimatedBudget, 0) / 1000000000).toFixed(1)}M
            </span>
            <span className="text-slate-400 text-[10px]">Estimasi</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-purple-500">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Rapat Zoom</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-800">{proposals.filter(p => p.zoomLink).length}</span>
            <span className="text-purple-600 text-xs font-bold">Tersedia</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-green-500">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Status Sinkron</p>
          <div className="flex items-end justify-between">
            <span className="text-xl font-black text-slate-800 text-green-600 uppercase">{spreadsheetId ? 'Aktif' : 'Off'}</span>
            <span className="text-slate-400 text-[10px]">Real-time</span>
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
                <label className="text-sm font-medium text-slate-700">Nama Proyek / Pekerjaan *</label>
                <input 
                  required
                  type="text"
                  value={formData.projectName}
                  onChange={e => setFormData({...formData, projectName: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Misal: Pembangunan Jalan Desa X"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Lokasi Pekerjaan *</label>
                <input 
                  required
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Kecamatan / Desa"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Estimasi Anggaran (Rp) *</label>
                <input 
                  required
                  type="number"
                  min="0"
                  value={formData.estimatedBudget}
                  onChange={e => setFormData({...formData, estimatedBudget: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="100000000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Link Zoom Meeting (Opsional)</label>
                <input 
                  type="url"
                  value={formData.zoomLink}
                  onChange={e => setFormData({...formData, zoomLink: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-slate-700">Justifikasi / Urgensi *</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.justification}
                  onChange={e => setFormData({...formData, justification: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Alasan mengapa pekerjaan ini sangat dibutuhkan..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-medium text-slate-900 mb-4">Syarat & Dokumen Pendukung</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {requirements.map((req) => (
                  <label key={req.id} className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <input 
                        type="checkbox"
                        checked={formData.reqs[req.id] || false}
                        onChange={() => toggleReq(req.id)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
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
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
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
              Daftar usulan kosong atau Anda belum mengatur Spreadsheet ID. Klik tombol Buat Usulan untuk memulai.
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
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(proposal.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-500">Oleh {proposal.submittedBy}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{proposal.projectName}</h3>
                    <p className="text-sm text-slate-600 mb-4">{proposal.justification}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 font-medium">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {proposal.location}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 font-medium">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(proposal.estimatedBudget)}
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold border border-green-100">
                        {reqsMetCount} / {totalReqs} Syarat Lengkap
                      </div>
                    </div>
                  </div>
                  
                  {proposal.zoomLink && (
                    <a 
                      href={proposal.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <Video className="w-4 h-4" />
                      Gabung Zoom
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
