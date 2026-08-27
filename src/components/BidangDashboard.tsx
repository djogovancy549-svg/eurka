import { IndependenceDayBanner } from './IndependenceDayBanner';
import React, { useState, useEffect, useRef } from 'react';
import { getRows, appendRow } from '../sheetsApi';
import { getAccessToken } from '../auth';
import { useRequirements } from '../useRequirements';
import { Proposal, BidangConfig, BIDANG_LIST, NON_BIDANG_UNITS, getUnitActiveRequirements, SUMBER_USULAN_OPTIONS, SipdStatus } from '../types';
import { getAllBidangConfigs, saveBidangConfig, notifyAdminNewProposal, getNagekeoWilayah } from '../services/configService';
import { parseMoney, formatRupiah, printRekapanDisetujui, printRekapanSiapSIPD, exportCsvSIPD } from '../utils';
import { DEFAULT_NAGEKEO_WILAYAH, KecamatanDesa, countTotalDesa } from '../data/nagekeoWilayah';
import { useRegisterRefresh } from '../context/RefreshContext';
import { SSH_TIK_NAGEKEO } from '../data/sshKominfo';
import { Plus, Video, MapPin, DollarSign, Calendar, Info, Loader2, Save, ExternalLink, Edit2, Folder, CheckCircle, Clock, AlertTriangle, RefreshCw, XCircle, Printer, Download, Users, Layers, ShieldCheck, Tag, X, Trash2 } from 'lucide-react';
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
  const activeRequirements = getUnitActiveRequirements(selectedConfig, requirements);
  
  // Wilayah Master
  const [wilayahList, setWilayahList] = useState<KecamatanDesa[]>(DEFAULT_NAGEKEO_WILAYAH);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasNewData, setHasNewData] = useState(false);
  const proposalsRef = useRef<Proposal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [editingConfig, setEditingConfig] = useState(false);
  const [tempSheetId, setTempSheetId] = useState('');
  const [tempFolderUrl, setTempFolderUrl] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedProposalDetail, setSelectedProposalDetail] = useState<Proposal | null>(null);

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('ALL');
  const [filterDesa, setFilterDesa] = useState('ALL');
  const [filterSumber, setFilterSumber] = useState('ALL');
  const [filterSipd, setFilterSipd] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    tahunUsulan: '2025',
    jenisUsulan: 'Baru',
    sumberUsulan: 'Musrenbang Desa / Kelurahan',
    kecamatan: '',
    desa: '',
    programName: '',
    activityName: '',
    projectName: '',
    sshId: '',
    location: '',
    estimatedBudget: '',
    justification: '',
    zoomLink: '',
    reqs: {} as Record<string, boolean>
  });

  // Multiple Pokir Proposers state
  const [pokirList, setPokirList] = useState<string[]>([]);
  const [newPokirInput, setNewPokirInput] = useState('');

  const [attachments, setAttachments] = useState<{ name: string; url: string; size?: string; type?: string; uploadedAt?: string }[]>([]);

  const handleAddPokir = () => {
    if (!newPokirInput.trim()) return;
    const name = newPokirInput.trim();
    if (!pokirList.includes(name)) {
      setPokirList([...pokirList, name]);
    }
    setNewPokirInput('');
  };

  const handleRemovePokir = (index: number) => {
    setPokirList(pokirList.filter((_, i) => i !== index));
  };

  const openExternalLink = (rawUrl?: string) => {
    if (!rawUrl) {
      alert('Tautan folder belum diisi.');
      return;
    }
    let url = rawUrl.trim();
    if (url.match(/^(\d{1,3}\.){3}\d{1,3}$/) || url.includes('0.0.7.234') || url === '0.0.7.234') {
      alert(`Tautan folder tidak valid (${url}). Harap masukkan tautan Google Drive yang valid.`);
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
        return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-200"><CheckCircle className="w-3 h-3" /> Diterima Teknis</span>;
      case 'belum_lengkap':
        return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-200"><AlertTriangle className="w-3 h-3" /> Belum Lengkap</span>;
      case 'revisi':
        return <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-purple-200"><RefreshCw className="w-3 h-3" /> Di-revisi</span>;
      case 'ditolak':
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-200"><XCircle className="w-3 h-3" /> Ditolak (Bank Data Evaluasi)</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-yellow-200"><Clock className="w-3 h-3" /> Menunggu Verifikasi</span>;
    }
  };

  const renderSipdBadge = (sipdStatus?: string, regNo?: string) => {
    switch (sipdStatus) {
      case 'siap_sipd':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-300">
            <ShieldCheck className="w-3 h-3" /> Siap Input SIPD
          </span>
        );
      case 'sudah_sipd':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-300">
            <CheckCircle className="w-3 h-3" /> Terdaftar SIPD {regNo ? `(${regNo})` : ''}
          </span>
        );
      case 'ditolak_sipd':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-rose-300">
            <XCircle className="w-3 h-3" /> Tidak Memenuhi Syarat SIPD
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" /> Pra-SIPD (Draft)
          </span>
        );
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configsData, wData] = await Promise.all([
          getAllBidangConfigs(),
          getNagekeoWilayah()
        ]);
        setConfigs(configsData);
        setWilayahList(wData);
        if (!selectedBidangId && configsData.length > 0) {
          handleBidangSelect(configsData[0].id);
        }
        if (wData.length > 0) {
          setFormData(prev => ({
            ...prev,
            kecamatan: prev.kecamatan || wData[0].kecamatan,
            desa: prev.desa || (wData[0].desaList[0] || '')
          }));
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBidangId && configs.length > 0) {
      const config = configs.find(c => c.id === selectedBidangId) || null;
      setSelectedConfig(config);
      if (config) {
        setTempSheetId(config.sheetId || '');
        setTempFolderUrl(config.folderUrl || '');
        // Auto set default sumber usulan based on unit selected
        if (config.id === 'POKIR (DPRD)') {
          setFormData(prev => ({ ...prev, sumberUsulan: 'POKIR (DPRD)' }));
        } else if (config.id === 'RENJA (OPD/Dinas)') {
          setFormData(prev => ({ ...prev, sumberUsulan: 'RENJA Perangkat Daerah / OPD' }));
        } else if (config.id === 'Kecamatan') {
          setFormData(prev => ({ ...prev, sumberUsulan: 'Musrenbang Kecamatan' }));
        } else if (config.id === 'Desa' || config.id === 'Kelurahan / Lurah') {
          setFormData(prev => ({ ...prev, sumberUsulan: 'Musrenbang Desa / Kelurahan' }));
        }
      }
      setEditingConfig(false);
      fetchProposals(config?.sheetId);
    }
  }, [selectedBidangId, configs]);

  useEffect(() => {
    proposalsRef.current = proposals;
  }, [proposals]);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    setHasNewData(false);
    try {
      let currentSheetId = selectedConfig?.sheetId;
      try {
        const data = await getAllBidangConfigs();
        setConfigs(data);
        if (selectedBidangId) {
          const updatedConfig = data.find(c => c.id === selectedBidangId);
          if (updatedConfig) {
            setSelectedConfig(updatedConfig);
            currentSheetId = updatedConfig.sheetId;
          }
        }
      } catch (err) {
        console.error('Failed to refresh configs', err);
      }

      if (currentSheetId) {
        await fetchProposals(currentSheetId);
        setSuccessMsg('Data usulan & pagu berhasil disegarkan!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert('ID Google Sheet belum dikonfigurasi.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Register with global refresh button in top navigation bar
  useRegisterRefresh('bidang-dashboard', handleRefreshData, [selectedBidangId, selectedConfig?.sheetId]);

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

  const handleDelete = async (rowIndex: number) => {
    if (!selectedConfig?.sheetId) return;
    if (!window.confirm('Yakin ingin menghapus usulan ini? Aksi ini tidak dapat dibatalkan.')) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      const { deleteProposalRow } = await import('../sheetsApi');
      await deleteProposalRow(token, selectedConfig.sheetId, rowIndex);
      
      setSuccessMsg('Data usulan berhasil dihapus.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchProposals(selectedConfig.sheetId);
    } catch (err) {
      console.error('Failed to delete proposal', err);
      alert('Gagal menghapus data usulan.');
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
      
      const rows = await getRows(token, sheetId, 'Proposals!A2:X');
      const formatted = rows.map((r: any[], index: number) => {
        let reqs = {};
        try { reqs = JSON.parse(r[10] || '{}'); } catch (e) {}
        let atts = [];
        try { atts = JSON.parse(r[15] || '[]'); } catch (e) {}
        let pokirArr: string[] = [];
        try { 
          if (r[20]) {
            pokirArr = r[20].startsWith('[') ? JSON.parse(r[20]) : r[20].split(',').map((s: string) => s.trim());
          }
        } catch (e) {}
        
        return {
          id: r[0],
          rowIndex: index + 2,
          submittedAt: r[1],
          tahunUsulan: r[2],
          programName: r[3],
          activityName: r[4],
          projectName: r[5],
          location: r[6],
          estimatedBudget: parseMoney(r[7]),
          justification: r[8],
          zoomLink: r[9],
          requirementsMet: reqs,
          submittedBy: r[11],
          documentFolderUrl: r[12] || '',
          status: (r[13] as any) || 'pending',
          adminNotes: r[14] || '',
          attachments: atts,
          jenisUsulan: r[16],
          sumberUsulan: r[17] || '',
          kecamatan: r[18] || '',
          desa: r[19] || '',
          pengusulPokir: pokirArr,
          sipdStatus: (r[21] as SipdStatus) || 'draft',
          sipdRegistrationNo: r[22] || '',
          sipdNotes: r[23] || ''
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
    
    const latestConfigs = await getAllBidangConfigs();
    const currentConfig = latestConfigs.find(c => c.id === selectedBidangId) || null;
    const configToUse = currentConfig || selectedConfig;

    if (!configToUse?.sheetId) {
      alert("Spreadsheet belum dikonfigurasi oleh Admin untuk unit/bidang ini.");
      return;
    }

    const numericBudget = parseMoney(formData.estimatedBudget);
    if (configToUse?.budgetRules && configToUse.budgetRules.length > 0 && configToUse.pagu > 0) {
      const rule = configToUse.budgetRules.find(r => 
        r.programName.toLowerCase().trim() === formData.programName.toLowerCase().trim()
      );
      if (rule) {
        const maxAllowed = (configToUse.pagu * rule.maxPercentage) / 100;
        if (numericBudget > maxAllowed) {
          alert(`Gagal mengirim: Anggaran usulan (${formatRupiah(numericBudget)}) melebihi batasan maksimal untuk program "${rule.programName}" (${rule.maxPercentage}% dari Pagu = ${formatRupiah(maxAllowed)}) yang ditentukan.`);
          return;
        }
      }
    }

    if (formData.sshId) {
      const sshItem = SSH_TIK_NAGEKEO.find(s => s.id === formData.sshId);
      if (sshItem) {
        if (numericBudget < sshItem.minPrice || numericBudget > sshItem.maxPrice) {
           alert(`Gagal mengirim: Anggaran usulan (${formatRupiah(numericBudget)}) di luar Rentang Harga SSH SIPD untuk kategori ini (${formatRupiah(sshItem.minPrice)} - ${formatRupiah(sshItem.maxPrice)}).`);
           return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const timestamp = new Date().toISOString();
      const id = uuidv4().substring(0, 8);
      
      const rowData = [
        id,                                // 0: ID
        timestamp,                         // 1: Timestamp
        formData.tahunUsulan,              // 2: Tahun Usulan
        formData.programName,              // 3: Program Name
        formData.activityName,             // 4: Activity Name
        formData.projectName,              // 5: Project Name
        formData.location,                 // 6: Location
        numericBudget,                     // 7: Estimated Budget
        formData.justification,            // 8: Justification
        formData.zoomLink,                 // 9: Zoom Link
        JSON.stringify(formData.reqs),     // 10: Requirements Met
        userName || userEmail,             // 11: Submitter
        configToUse?.folderUrl || '',      // 12: Folder URL
        'pending',                         // 13: Status
        '',                                // 14: Admin Notes
        JSON.stringify(attachments),       // 15: Attachments
        formData.jenisUsulan,              // 16: Jenis Usulan
        formData.sumberUsulan,             // 17: Sumber Usulan
        formData.kecamatan,                // 18: Kecamatan
        formData.desa,                     // 19: Desa / Kelurahan
        JSON.stringify(pokirList),         // 20: Pengusul Pokir
        'draft',                           // 21: Status SIPD (Default draft pra-sipd)
        '',                                // 22: No Registrasi SIPD
        '',                                // 23: Catatan SIPD
        '',                                // 24: JSON string for Priority (optional)
        formData.sshId || '',              // 25: SSH ID
      ];
      await appendRow(token, configToUse.sheetId, 'Proposals!A:Z', rowData);
      
      await notifyAdminNewProposal();

      setShowForm(false);
      setFormData(prev => ({
        ...prev,
        projectName: '',
        location: '',
        estimatedBudget: '',
        justification: '',
        zoomLink: '',
        reqs: {}
      }));
      setPokirList([]);
      setAttachments([]);
      fetchProposals(configToUse.sheetId);
      setSuccessMsg('Usulan berhasil dikirim sebagai data pra-SIPD!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Submit failed', err);
      alert(`Gagal mengirim usulan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReq = (reqId: string) => {
    setFormData(prev => ({ ...prev, reqs: { ...prev.reqs, [reqId]: !prev.reqs[reqId] } }));
  };

  // Find desas for current selected kecamatan in form
  const currentKecDesaList = wilayahList.find(k => k.kecamatan === formData.kecamatan)?.desaList || [];

  // Filtered proposals
  const filteredProposals = proposals.filter(p => {
    if (filterKecamatan !== 'ALL' && p.kecamatan !== filterKecamatan) return false;
    if (filterDesa !== 'ALL' && p.desa !== filterDesa) return false;
    if (filterSumber !== 'ALL' && p.sumberUsulan !== filterSumber) return false;
    if (filterSipd !== 'ALL' && (p.sipdStatus || 'draft') !== filterSipd) return false;
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      const matchProject = (p.projectName || '').toLowerCase().includes(q);
      const matchLocation = (p.location || '').toLowerCase().includes(q);
      const matchDesa = (p.desa || '').toLowerCase().includes(q);
      const matchKec = (p.kecamatan || '').toLowerCase().includes(q);
      const matchPokir = Array.isArray(p.pengusulPokir) && p.pengusulPokir.some(pok => pok.toLowerCase().includes(q));
      if (!matchProject && !matchLocation && !matchDesa && !matchKec && !matchPokir) return false;
    }
    return true;
  });

  const totalBudget = proposals.reduce((sum, p) => sum + p.estimatedBudget, 0);
  const siapSipdCount = proposals.filter(p => p.sipdStatus === 'siap_sipd' || p.sipdStatus === 'sudah_sipd').length;

  return (
    <div className="space-y-6">
      <IndependenceDayBanner />
      <header className="flex flex-col sm:flex-row sm:items-center justify-between shadow-sm bg-white border-b border-slate-200 -mx-8 -mt-8 px-8 py-5 mb-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800">Dashboard Usulan Rencana Kerja (e-URK)</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full">
              Filterisasi Pra-SIPD
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Kab. Nagekeo &bull; 7 Kecamatan & 115+ Desa/Kelurahan &bull; Musrenbang, Pokir & Renja</p>
        </div>
        <div className="flex items-center flex-wrap gap-3 mt-4 sm:mt-0">
          <select 
            value={selectedBidangId}
            onChange={e => handleBidangSelect(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Pilih Bidang / Unit</option>
            {configs.map(c => (
              <option key={c.id} value={c.id}>
                {NON_BIDANG_UNITS.includes(c.id) ? `Usulan ${c.name}` : `Bidang ${c.name}`}
              </option>
            ))}
          </select>

          <button
            onClick={() => window.open('https://meet.google.com/new', '_blank')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-emerald-200 shadow-sm text-xs"
            title="Buka Google Meet untuk Diskusi & Berbagi Layar"
          >
            <Video className="w-4 h-4 text-emerald-600" /> Meet
          </button>

          <button
            onClick={() => printRekapanSiapSIPD(filteredProposals, `${selectedConfig?.name || 'Unit'} - Filter Aktif`)}
            disabled={filteredProposals.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-xs disabled:opacity-50"
            title="Cetak format rekapitulasi usulan yang telah terverifikasi/siap input ke SIPD"
          >
            <Printer className="w-4 h-4" /> Cetak Pra-SIPD
          </button>

          <button
            onClick={() => exportCsvSIPD(filteredProposals, `rekap_usulan_${selectedConfig?.id || 'all'}_pra_sipd.csv`)}
            disabled={filteredProposals.length === 0}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-xs disabled:opacity-50"
            title="Ekspor data usulan ke format CSV/Excel untuk mempermudah input ke SIPD"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-blue-200 shadow-sm text-xs"
            title="Segarkan data tabel langsung"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan'}</span>
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!selectedConfig?.sheetId}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all text-xs disabled:opacity-50"
          >
            {showForm ? 'Batal' : <><Plus className="w-4 h-4" /> Tambah Usulan</>}
          </button>
        </div>
      </header>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-xs font-bold border border-green-200 flex items-center justify-between shadow-sm">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700 font-bold">&times;</button>
        </div>
      )}

      {/* Overview Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-blue-500">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Usulan Ditampung</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-black text-slate-800">{proposals.length}</span>
            <span className="text-blue-500 text-xs font-bold">Penampung Pra-SIPD</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-emerald-500">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Siap / Masuk SIPD</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700">{siapSipdCount}</span>
            <span className="text-emerald-600 text-xs font-bold">Terverifikasi</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-yellow-400">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Anggaran Usulan</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-lg font-black text-slate-800 truncate">
              {formatRupiah(totalBudget)}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-purple-500">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pagu Indikatif Wilayah</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-lg font-black text-slate-800 truncate">
              {formatRupiah(selectedConfig?.pagu || 0)}
            </span>
            <span className={`text-[10px] font-bold ${totalBudget > (selectedConfig?.pagu || 0) ? 'text-red-500' : 'text-green-500'}`}>
              {totalBudget > (selectedConfig?.pagu || 0) ? 'Over Pagu' : 'Aman'}
            </span>
          </div>
        </div>
      </section>

      {/* FORM USULAN BARU */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Form Usulan Baru (Pra-SIPD) - {selectedConfig?.name}</h3>
            </div>
            <span className="text-xs font-semibold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
              Kabupaten Nagekeo
            </span>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tahun Usulan *</label>
                <input required type="text" value={formData.tahunUsulan} onChange={e => setFormData({...formData, tahunUsulan: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Jenis Usulan *</label>
                <select required value={formData.jenisUsulan} onChange={e => setFormData({...formData, jenisUsulan: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold">
                  <option value="Baru">Baru</option>
                  <option value="Lanjutan">Lanjutan</option>
                  <option value="Rehabilitasi">Rehabilitasi / Pemeliharaan</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Sumber Usulan *</label>
                <select 
                  required 
                  value={formData.sumberUsulan} 
                  onChange={e => setFormData({...formData, sumberUsulan: e.target.value})} 
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-blue-900 bg-blue-50/50"
                >
                  {SUMBER_USULAN_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* WILAYAH: KECAMATAN & DESA SE-KAB NAGEKEO */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Kecamatan (Kab. Nagekeo) *
                </label>
                <select
                  required
                  value={formData.kecamatan}
                  onChange={e => {
                    const newKec = e.target.value;
                    const defaultDesa = wilayahList.find(k => k.kecamatan === newKec)?.desaList[0] || '';
                    setFormData({ ...formData, kecamatan: newKec, desa: defaultDesa });
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="" disabled>Pilih Kecamatan</option>
                  {wilayahList.map(k => (
                    <option key={k.kecamatan} value={k.kecamatan}>Kecamatan {k.kecamatan}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Desa / Kelurahan *
                </label>
                <select
                  required
                  value={formData.desa}
                  onChange={e => setFormData({...formData, desa: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="" disabled>Pilih Desa/Kelurahan</option>
                  {currentKecDesaList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Lokasi Spesifik / Dusun / RT *</label>
                <input required type="text" placeholder="Contoh: Dusun 2, RT 04 / Ruas Jl. Danga" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* POKIR MULTIPLE PENGUSUL SECTION */}
              {(formData.sumberUsulan === 'POKIR (DPRD)' || selectedBidangId === 'POKIR (DPRD)') && (
                <div className="md:col-span-3 bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-700" /> Nama-Nama Pengusul Pokir (Anggota DPRD / Fraksi):
                    </label>
                    <span className="text-[10px] text-purple-700 font-semibold">Bisa input lebih dari satu nama pengusul</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPokirInput}
                      onChange={e => setNewPokirInput(e.target.value)}
                      placeholder="Masukkan nama Anggota Dewan / Fraksi / Dapil..."
                      className="flex-1 border border-purple-300 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPokir(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddPokir}
                      className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                    >
                      + Tambah Pengusul
                    </button>
                  </div>
                  {pokirList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {pokirList.map((pok, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 bg-white border border-purple-300 text-purple-900 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                          <span>{pok}</span>
                          <button type="button" onClick={() => handleRemovePokir(idx)} className="text-purple-400 hover:text-red-600 font-bold">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Program *</label>
                {selectedConfig?.budgetRules && selectedConfig.budgetRules.length > 0 ? (
                  <select 
                    required 
                    value={formData.programName} 
                    onChange={e => setFormData({...formData, programName: e.target.value})} 
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="">Pilih Program</option>
                    {selectedConfig.budgetRules.map((rule, idx) => (
                      <option key={idx} value={rule.programName}>{rule.programName}</option>
                    ))}
                  </select>
                ) : (
                  <input required type="text" placeholder="Contoh: Program Pengelolaan SDA" value={formData.programName} onChange={e => setFormData({...formData, programName: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Kegiatan</label>
                <input type="text" placeholder="Contoh: Pembangunan Saluran Irigasi Tersier" value={formData.activityName} onChange={e => setFormData({...formData, activityName: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Estimasi Anggaran (Rp) *</label>
                <input required type="text" placeholder="Contoh: 150000000" value={formData.estimatedBudget} onChange={e => setFormData({...formData, estimatedBudget: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900" />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700">Kategori Standar Satuan Harga (SSH) SIPD</label>
                <select
                  value={formData.sshId}
                  onChange={e => {
                    const id = e.target.value;
                    const item = SSH_TIK_NAGEKEO.find(s => s.id === id);
                    setFormData({
                      ...formData, 
                      sshId: id,
                      projectName: item ? item.uraian : formData.projectName
                    });
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-blue-50"
                >
                  <option value="">-- Usulan Kustom (Tidak Menggunakan SSH) --</option>
                  {SSH_TIK_NAGEKEO.map(ssh => (
                    <option key={ssh.id} value={ssh.id}>
                      {ssh.kategori} - {ssh.uraian} ({formatRupiah(ssh.minPrice)} - {formatRupiah(ssh.maxPrice)})
                    </option>
                  ))}
                </select>
                {formData.sshId && (
                  <div className="text-[11px] text-blue-700 bg-blue-100 p-2 rounded-lg mt-1 border border-blue-200">
                    <strong>Spesifikasi:</strong> {SSH_TIK_NAGEKEO.find(s => s.id === formData.sshId)?.spesifikasi}
                  </div>
                )}
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Usulan / Pekerjaan (Otomatis / Manual) *</label>
                <input required type="text" placeholder="Contoh: Pembangunan Tembok Penahan Tanah..." value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700">Justifikasi / Urgensi Kebutuhan (Indikator Kelayakan) *</label>
                <textarea required rows={3} placeholder="Jelaskan kondisi saat ini, manfaat langsung bagi masyarakat, dan urgensi penanganan..." value={formData.justification} onChange={e => setFormData({...formData, justification: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-indigo-600" /> Upload Berkas / Proposal Pendukung (PDF, Word, Excel, Gambar)
                </label>
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileUpload}
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-xs font-medium text-indigo-900">
                        <span>{att.name} ({att.size})</span>
                        <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 mb-3 text-sm">Syarat & Kesiapan Dokumen ({selectedConfig ? selectedConfig.name : 'Standar'})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeRequirements.map((req) => (
                  <label key={req.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={formData.reqs[req.id] || false} onChange={() => toggleReq(req.id)} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{req.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{req.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-700 text-xs font-bold hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kirim Usulan ke Penampung Pra-SIPD
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & PENCARIAN BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Filter & Pemilahan Usulan Pra-SIPD</h3>
          </div>
          <span className="text-xs text-slate-500">
            Menampilkan <strong>{filteredProposals.length}</strong> dari <strong>{proposals.length}</strong> usulan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Kata Kunci</label>
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Cari proyek / desa / pengusul..."
              className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kecamatan</label>
            <select
              value={filterKecamatan}
              onChange={e => {
                setFilterKecamatan(e.target.value);
                setFilterDesa('ALL');
              }}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none text-slate-700"
            >
              <option value="ALL">Semua Kecamatan (7)</option>
              {wilayahList.map(k => (
                <option key={k.kecamatan} value={k.kecamatan}>Kec. {k.kecamatan}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desa / Kelurahan</label>
            <select
              value={filterDesa}
              onChange={e => setFilterDesa(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none text-slate-700"
            >
              <option value="ALL">Semua Desa/Kelurahan</option>
              {filterKecamatan === 'ALL'
                ? wilayahList.flatMap(k => k.desaList).map(d => <option key={d} value={d}>{d}</option>)
                : (wilayahList.find(k => k.kecamatan === filterKecamatan)?.desaList || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))
              }
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sumber Usulan</label>
            <select
              value={filterSumber}
              onChange={e => setFilterSumber(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none text-slate-700"
            >
              <option value="ALL">Semua Sumber Usulan</option>
              {SUMBER_USULAN_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Kesiapan SIPD</label>
            <select
              value={filterSipd}
              onChange={e => setFilterSipd(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none text-emerald-800 bg-emerald-50/50"
            >
              <option value="ALL">Semua Status SIPD</option>
              <option value="draft">Pra-SIPD (Draft)</option>
              <option value="siap_sipd">Siap Input ke SIPD</option>
              <option value="sudah_sipd">Sudah Masuk SIPD</option>
              <option value="ditolak_sipd">Ditolak / Tidak Layak</option>
            </select>
          </div>
        </div>
      </div>

      {/* PROPOSALS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Daftar Usulan Rencana Kerja ({filteredProposals.length} item)
          </h3>
          <div className="flex items-center gap-3">
            {selectedConfig?.sheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${selectedConfig.sheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-1 rounded-lg"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Sheet ({selectedConfig.name})
              </a>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Memuat usulan dari Google Sheets...</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Belum ada data usulan yang sesuai dengan kriteria filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Usulan & Program</th>
                  <th className="py-3 px-4">Sumber & Wilayah</th>
                  <th className="py-3 px-4">Pengusul / Pokir</th>
                  <th className="py-3 px-4">Estimasi Anggaran</th>
                  <th className="py-3 px-4">Evaluasi Teknis</th>
                  <th className="py-3 px-4">Status Pra-SIPD</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProposals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 max-w-xs">{p.projectName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.programName ? `Prog: ${p.programName}` : ''} {p.activityName ? `• Keg: ${p.activityName}` : ''}
                      </div>
                      {p.isAkomodirRenja ? (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>RENJA: {p.renjaSubKegiatanName || p.renjaProgramName || 'Terakomodir'}</span>
                        </div>
                      ) : (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px]">
                          <span>Bank Data URK</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-blue-900">{p.sumberUsulan || p.jenisUsulan || 'Usulan Rencana'}</div>
                      <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                        {p.kecamatan ? `Kec. ${p.kecamatan}` : ''} {p.desa ? `• ${p.desa}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400">{p.location}</div>
                    </td>
                    <td className="py-3 px-4">
                      {Array.isArray(p.pengusulPokir) && p.pengusulPokir.length > 0 ? (
                        <div className="space-y-1">
                          {p.pengusulPokir.map((pok, i) => (
                            <span key={i} className="inline-block bg-purple-50 text-purple-900 border border-purple-200 rounded px-2 py-0.5 text-[10px] font-bold mr-1 mb-1">
                              {pok}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-medium">{p.submittedBy}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(p.estimatedBudget)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderStatusBadge(p.status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderSipdBadge(p.sipdStatus, p.sipdRegistrationNo)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedProposalDetail(p)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleDelete(p.rowIndex!)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          title="Hapus Data"
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

      {/* DETAIL MODAL */}
      {selectedProposalDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  ID: {selectedProposalDetail.id}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">Detail Usulan Perencanaan</h3>
              </div>
              <button onClick={() => setSelectedProposalDetail(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 bg-slate-50 p-3 rounded-xl">
                <p className="text-slate-500 font-bold">Nama Proyek / Pekerjaan:</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedProposalDetail.projectName}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Sumber Usulan:</p>
                <p className="font-bold text-blue-900">{selectedProposalDetail.sumberUsulan || '-'}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Estimasi Anggaran:</p>
                <p className="font-bold text-slate-900 text-sm">{formatRupiah(selectedProposalDetail.estimatedBudget)}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Wilayah Kecamatan:</p>
                <p className="font-bold text-emerald-800">{selectedProposalDetail.kecamatan || '-'}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Desa / Kelurahan:</p>
                <p className="font-bold text-emerald-800">{selectedProposalDetail.desa || '-'}</p>
              </div>

              <div className="col-span-2">
                <p className="text-slate-500 font-bold">Nama Pengusul / Pokir DPRD:</p>
                {Array.isArray(selectedProposalDetail.pengusulPokir) && selectedProposalDetail.pengusulPokir.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProposalDetail.pengusulPokir.map((pok, i) => (
                      <span key={i} className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-bold">
                        {pok}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium text-slate-800">{selectedProposalDetail.submittedBy || '-'}</p>
                )}
              </div>

              <div className="col-span-2">
                <p className="text-slate-500 font-bold">Justifikasi / Urgensi Penanganan:</p>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg mt-1">{selectedProposalDetail.justification || '-'}</p>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Status Evaluasi Teknis:</p>
                <div className="mt-1">{renderStatusBadge(selectedProposalDetail.status)}</div>
              </div>

              <div>
                <p className="text-slate-500 font-bold">Status Kesiapan SIPD:</p>
                <div className="mt-1">{renderSipdBadge(selectedProposalDetail.sipdStatus, selectedProposalDetail.sipdRegistrationNo)}</div>
              </div>

              {/* KETERKAITAN RENJA OPD */}
              <div className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Keterkaitan Dokumen RENJA OPD Dinas PUPR:
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedProposalDetail.isAkomodirRenja ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {selectedProposalDetail.isAkomodirRenja ? 'TERAKOMODIR DI RENJA' : 'BANK DATA URK'}
                  </span>
                </div>
                {selectedProposalDetail.isAkomodirRenja ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-slate-500">Program Renja:</span>
                      <p className="font-bold text-slate-800">{selectedProposalDetail.renjaProgramName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Sub-Kegiatan Renja:</span>
                      <p className="font-bold text-slate-800">{selectedProposalDetail.renjaSubKegiatanName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Pagu Alokasi Renja:</span>
                      <p className="font-extrabold text-emerald-700">{formatRupiah(selectedProposalDetail.renjaPaguAlokasi || selectedProposalDetail.estimatedBudget)}</p>
                    </div>
                    {selectedProposalDetail.catatanAkomodasiRenja && (
                      <div className="col-span-2">
                        <span className="text-slate-500">Catatan Penyelarasan:</span>
                        <p className="text-slate-700 italic">{selectedProposalDetail.catatanAkomodasiRenja}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-600 text-xs mt-1">
                    Usulan ini masih tersimpan dalam penampungan e-URK dan belum diintegrasikan ke Sub-Kegiatan RENJA OPD.
                  </p>
                )}
              </div>

              {selectedProposalDetail.adminNotes && (
                <div className="col-span-2 bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
                  <p className="font-bold text-yellow-900">Catatan Verifikator / Admin:</p>
                  <p className="text-yellow-800 mt-0.5">{selectedProposalDetail.adminNotes}</p>
                </div>
              )}

              {selectedProposalDetail.attachments && selectedProposalDetail.attachments.length > 0 && (
                <div className="col-span-2">
                  <p className="text-slate-500 font-bold mb-1">Dokumen Lampiran ({selectedProposalDetail.attachments.length}):</p>
                  <div className="space-y-1.5">
                    {selectedProposalDetail.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-lg">
                        <span className="font-medium truncate">{att.name}</span>
                        {att.url && (
                          <a href={att.url} download={att.name} className="text-blue-600 hover:text-blue-800 font-bold shrink-0 ml-2">
                            Unduh
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedProposalDetail(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold"
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
