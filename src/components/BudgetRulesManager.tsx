import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sliders, 
  Percent, 
  Layers, 
  Building2, 
  FileCheck, 
  Check, 
  Coins, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { CostComponentRule, DEFAULT_COST_COMPONENT_RULES } from '../types';
import { getCostComponentRules, saveCostComponentRules, calculateBudgetBreakdown } from '../services/costRulesService';
import { formatRupiah } from '../utils';
import { logSecurityActivity } from '../services/securityService';
import { addNotification } from '../services/notificationService';

interface BudgetRulesManagerProps {
  userEmail: string;
  isAdmin: boolean;
}

export default function BudgetRulesManager({ userEmail, isAdmin }: BudgetRulesManagerProps) {
  const [rules, setRules] = useState<CostComponentRule[]>(DEFAULT_COST_COMPONENT_RULES);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Budget Simulation State
  const [simPagu, setSimPagu] = useState<number>(1000000000); // 1 Miliar default simulation
  const [customPctMap, setCustomPctMap] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'rules' | 'simulator'>('rules');

  useEffect(() => {
    const loadRules = async () => {
      try {
        const data = await getCostComponentRules();
        setRules(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadRules();
  }, []);

  const handleRuleChange = (index: number, field: keyof CostComponentRule, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const handleAddRequirement = (ruleIndex: number) => {
    const updated = [...rules];
    updated[ruleIndex].requirements = [...updated[ruleIndex].requirements, 'Syarat & ketentuan baru...'];
    setRules(updated);
  };

  const handleRequirementChange = (ruleIndex: number, reqIndex: number, val: string) => {
    const updated = [...rules];
    const newReqs = [...updated[ruleIndex].requirements];
    newReqs[reqIndex] = val;
    updated[ruleIndex].requirements = newReqs;
    setRules(updated);
  };

  const handleRemoveRequirement = (ruleIndex: number, reqIndex: number) => {
    const updated = [...rules];
    const newReqs = [...updated[ruleIndex].requirements];
    newReqs.splice(reqIndex, 1);
    updated[ruleIndex].requirements = newReqs;
    setRules(updated);
  };

  const handleToggleActive = (index: number) => {
    const updated = [...rules];
    updated[index].isActive = !updated[index].isActive;
    setRules(updated);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan aturan besaran biaya ke standar baku teknis DPUPR?')) {
      setRules(DEFAULT_COST_COMPONENT_RULES);
      setCustomPctMap({});
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveCostComponentRules(rules);
      
      await logSecurityActivity(
        'UPDATE_COST_COMPONENT_RULES',
        userEmail,
        'Administrator',
        'settings',
        `Admin memperbarui standar persentase dan syarat komponen biaya anggaran (${rules.length} komponen).`
      );

      await addNotification({
        title: 'Standar Persentase Biaya Diperbarui',
        message: 'Admin telah memperbarui ketentuan batas persentase biaya operasional, perencanaan, dan pengawasan.',
        type: 'system_info',
        targetRole: 'all'
      });

      setSuccessMsg('Pengaturan besaran dan syarat komponen biaya berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e) {
      alert('Gagal menyimpan aturan biaya');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate Breakdown Simulation
  const simulation = calculateBudgetBreakdown(simPagu, rules, customPctMap);

  const getCategoryBadge = (cat: CostComponentRule['category']) => {
    switch (cat) {
      case 'fisik':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">Fisik Utama</span>;
      case 'perencanaan':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-bold">Perencanaan (DED)</span>;
      case 'pengawasan':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[11px] font-bold">Pengawasan / Supervisi</span>;
      case 'operasional':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold">Operasional PPK/PPTK</span>;
      case 'atk':
        return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">ATK & Admin</span>;
      case 'sppd':
        return <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[11px] font-bold">SPPD Monitoring</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[11px] font-bold">Biaya Penunjang</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
        <p className="text-sm font-semibold text-slate-600">Memuat standar aturan biaya...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/30 border border-blue-400/40 rounded-full text-blue-200 text-xs font-bold uppercase tracking-wider">
              Standar Evaluasi Anggaran SKPD
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-blue-400" />
            Standar Besaran & Syarat Biaya Penunjang
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Atur batas persentase maksimal (Ceiling %) dan syarat pencairan untuk Jasa Perencanaan, Pengawasan/Supervisi, Operasional Tim, ATK, dan Perjalanan Dinas (SPPD) sesuai regulasi teknis.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors border border-white/20"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Standar Baku
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Pengaturan
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" /> Daftar Komponen & Persentase ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4" /> Kalkulator Simulasi Pagu Anggaran
        </button>
      </div>

      {activeTab === 'rules' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule, idx) => (
              <div 
                key={rule.id} 
                className={`bg-white rounded-2xl border transition-all p-5 ${
                  rule.isActive ? 'border-slate-200/90 shadow-xs' : 'border-slate-200 bg-slate-50/60 opacity-60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(idx)}
                      className={`mt-1 p-1 rounded-md transition-colors ${
                        rule.isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                      }`}
                      title={rule.isActive ? 'Nonaktifkan komponen' : 'Aktifkan komponen'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900">{rule.name}</h3>
                        {getCategoryBadge(rule.category)}
                        <span className="text-[11px] font-semibold text-slate-400">
                          (Basis: {rule.formulaBasis === 'total_pagu' ? 'Total Pagu Sub-Kegiatan' : 'Pagu Konstruksi Fisik'})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{rule.description}</p>
                    </div>
                  </div>

                  {/* Percentage Controls */}
                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shrink-0">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Standar Default</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          disabled={!isAdmin || !rule.isActive}
                          value={rule.defaultPercentage}
                          onChange={(e) => handleRuleChange(idx, 'defaultPercentage', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-1 px-1.5 text-blue-700 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-xs font-extrabold text-slate-500">%</span>
                      </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200" />

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Batas Maks (Ceiling)</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          disabled={!isAdmin || !rule.isActive}
                          value={rule.maxPercentage}
                          onChange={(e) => handleRuleChange(idx, 'maxPercentage', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-1 px-1.5 text-red-600 outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <span className="text-xs font-extrabold text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirements / Syarat Pencairan */}
                <div className="mt-4 pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      Syarat & Dokumen Wajib Kelayakan Biaya:
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleAddRequirement(idx)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Tambah Syarat
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {rule.requirements.map((req, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2 bg-slate-50/70 p-2 rounded-lg border border-slate-200/60">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {rIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={req}
                          disabled={!isAdmin}
                          onChange={(e) => handleRequirementChange(idx, rIdx, e.target.value)}
                          className="flex-1 text-xs text-slate-700 bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1.5 py-0.5"
                        />
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(idx, rIdx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Hapus syarat ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SIMULATOR TAB */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Simulasi Perhitungan Porsi Anggaran Sub-Kegiatan
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan total pagu anggaran definitif suatu sub-kegiatan DPA untuk melihat simulasi pembagian biaya fisik, perencanaan, pengawasan, operasional, dan SPPD.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">Total Pagu Sub-Kegiatan (Rp):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={simPagu || ''}
                    onChange={(e) => setSimPagu(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: 1000000000"
                  />
                </div>
                <span className="text-xs font-semibold text-blue-600 mt-1 block">
                  {formatRupiah(simPagu)}
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 sm:max-w-xs">
                {[100000000, 250000000, 500000000, 1000000000, 2500000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSimPagu(val)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {val >= 1000000000 ? `${val / 1000000000} M` : `${val / 1000000} Jt`}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Banner if overallocated or exceeding max */}
            {simulation.isOverAllocated && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                Alokasi melebihi total pagu tersedia! Terjadi defisit sebesar {formatRupiah(Math.abs(simulation.remainingPagu))}.
              </div>
            )}

            {simulation.hasWarnings && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Terdapat komponen biaya yang melebihi batas persentase maksimal (Ceiling %) yang diizinkan!
              </div>
            )}

            {/* Results Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Komponen Biaya</th>
                    <th className="p-3 text-center">Batas Maks</th>
                    <th className="p-3 text-center">Persentase Simulasi</th>
                    <th className="p-3 text-right">Nominal Alokasi</th>
                    <th className="p-3 text-center">Status Kelayakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {simulation.items.map((item) => (
                    <tr key={item.rule.id} className={item.exceedsMax ? 'bg-amber-50/60' : 'bg-white'}>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.rule.name}</div>
                        <div className="text-[11px] text-slate-400">{item.rule.description}</div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-500">
                        {item.rule.maxPercentage}%
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={customPctMap[item.rule.id] !== undefined ? customPctMap[item.rule.id] : item.rule.defaultPercentage}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCustomPctMap(prev => ({ ...prev, [item.rule.id]: val }));
                            }}
                            className="w-14 text-center font-bold text-xs bg-slate-50 border border-slate-300 rounded px-1 py-0.5"
                          />
                          <span className="font-bold text-slate-600">%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-extrabold text-slate-900">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="p-3 text-center">
                        {item.exceedsMax ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            Melebihi Batas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Sesuai Standar
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-extrabold text-xs">
                  <tr>
                    <td colSpan={3} className="p-3 text-right">Total Anggaran Terdistribusi:</td>
                    <td className="p-3 text-right text-emerald-400 font-black">
                      {formatRupiah(simulation.totalAllocated)}
                    </td>
                    <td className="p-3 text-center text-[11px]">
                      {simulation.remainingPagu === 0 ? (
                        <span className="text-emerald-400 font-bold">100% Pas</span>
                      ) : simulation.remainingPagu > 0 ? (
                        <span className="text-blue-300">Sisa: {formatRupiah(simulation.remainingPagu)}</span>
                      ) : (
                        <span className="text-red-400">Defisit: {formatRupiah(Math.abs(simulation.remainingPagu))}</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
