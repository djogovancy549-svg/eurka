import React, { useState, useEffect } from 'react';
import { getRows } from '../sheetsApi';
import { getAccessToken } from '../auth';
import { useRequirements } from '../useRequirements';
import { Proposal, BidangConfig } from '../types';
import { getAllBidangConfigs } from '../services/configService';
import { Video, MapPin, DollarSign, Calendar, Info, Loader2, ExternalLink } from 'lucide-react';

interface AdminDashboardProps {
  userEmail: string;
  userName: string;
  onJoinMeeting: (id: string) => void;
}

export default function AdminDashboard({ userEmail, userName, onJoinMeeting }: AdminDashboardProps) {
  const { requirements } = useRequirements();
  const [configs, setConfigs] = useState<BidangConfig[]>([]);
  const [selectedBidangId, setSelectedBidangId] = useState<string>('');
  const [selectedConfig, setSelectedConfig] = useState<BidangConfig | null>(null);
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

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
      fetchProposals(config?.sheetId);
    }
  }, [selectedBidangId, configs]);

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
      
      const rows = await getRows(token, sheetId, 'Proposals!A2:I');
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
          {selectedConfig?.folderUrl && (
            <a 
              href={selectedConfig.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-indigo-100"
            >
              <ExternalLink className="w-4 h-4" /> Drive
            </a>
          )}
        </div>
      </header>

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
                  
                  {proposal.zoomLink ? (
                    <div className="flex flex-col gap-2">
                      <a 
                        href={proposal.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                      >
                        <Video className="w-4 h-4" />
                        Link Eksternal
                      </a>
                      <button 
                        onClick={() => onJoinMeeting(proposal.id)}
                        className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all"
                      >
                        <Video className="w-4 h-4" />
                        Rapat In-App
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onJoinMeeting(proposal.id)}
                      className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <Video className="w-4 h-4" />
                      Rapat In-App
                    </button>
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
