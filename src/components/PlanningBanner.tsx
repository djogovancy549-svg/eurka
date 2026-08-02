import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, ShieldCheck, HelpCircle, ChevronLeft, ChevronRight, X, Lightbulb, CheckCircle2, ArrowRight, Bookmark, Building2, Layers } from 'lucide-react';

interface BannerSlide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  highlightText: string;
  accentColor: string;
  bgGradient: string;
  icon: React.ReactNode;
  tipsTitle: string;
  tipsList: string[];
}

const SLIDES: BannerSlide[] = [
  {
    id: 1,
    badge: 'PRIORITAS PERENCANAAN 2026',
    title: 'Sinergi Musrenbang Desa, Kecamatan & POKIR DPRD',
    subtitle: 'Wujudkan pembangunan Kabupaten Nagekeo yang partisipatif, akuntabel, dan selaras dengan prioritas daerah dari hulu ke hilir.',
    highlightText: 'Integrasi e-URK',
    accentColor: 'from-blue-600 to-indigo-700',
    bgGradient: 'from-blue-900/90 via-indigo-900/90 to-slate-900',
    icon: <Building2 className="w-8 h-8 text-blue-300" />,
    tipsTitle: 'Panduan Sinergi Perencanaan Kewilayahan & POKIR',
    tipsList: [
      'Pastikan usulan Kecamatan & Desa telah dibahas melalui Musrenbang resmi dan melampirkan Berita Acara.',
      'Usulan POKIR DPRD wajib menyertakan dokumen hasil Reses sesuai Daerah Pemilihan (Dapil).',
      'Hindari tumpang tindih usulan antar Bidang teknis (SDA, BM, CK, PL) dan usulan kewilayahan.'
    ]
  },
  {
    id: 2,
    badge: 'SYARAT WAJIB BAPPENAS',
    title: 'Kesiapan Dokumen Teknis (Readiness Criteria)',
    subtitle: 'Usulan infrastruktur fisik wajib dilengkapi DED (Detail Engineering Design), RAB terperinci, dan status kepastian lahan.',
    highlightText: '100% Siap Eksekusi',
    accentColor: 'from-emerald-600 to-teal-700',
    bgGradient: 'from-emerald-900/90 via-teal-900/90 to-slate-900',
    icon: <ShieldCheck className="w-8 h-8 text-emerald-300" />,
    tipsTitle: 'Daftar Cek Readiness Criteria Infrastruktur',
    tipsList: [
      'Kepastian Status Tanah: Surat hibah atau sertifikat lahan bebas sengketa wajib diunggah pada tautan Drive bukti.',
      'Dokumen DED & RAB: Harus spesifik mencantumkan volume, satuan kerja, serta lampiran harga satuan baku daerah.',
      'Analisis Dampak Lingkungan (SPPL / UKL-UPL): Untuk kegiatan konstruksi berskala menengah dan besar.'
    ]
  },
  {
    id: 3,
    badge: 'KEDISIPLINAN FISKAL APBD',
    title: 'Sinkronisasi Pagu Indikatif & Proporsi Program',
    subtitle: 'Kelola alokasi anggaran dengan bijak. Kuota pagu kini dipantau secara langsung untuk menjamin keadilan pembangunan antar wilayah.',
    highlightText: 'Efisiensi Anggaran',
    accentColor: 'from-amber-600 to-orange-700',
    bgGradient: 'from-amber-900/90 via-orange-900/90 to-slate-900',
    icon: <TrendingUp className="w-8 h-8 text-amber-300" />,
    tipsTitle: 'Tips Pengelolaan Pagu Indikatif Bidang & Unit',
    tipsList: [
      'Prioritaskan kegiatan lanjutan yang belum tuntas sebelum membuka usulan proyek fisik baru.',
      'Perhatikan batasan persentase anggaran per program sesuai aturan pagu yang ditetapkan Admin/Bapperida.',
      'Manfaatkan fitur Cetak Rekapitulasi untuk memonitor sisa selisih pagu secara berkala.'
    ]
  },
  {
    id: 4,
    badge: 'LAYANAN BAPPERIDA NAGEKEO',
    title: 'Klinik Perencanaan & Konsultasi Verifikasi',
    subtitle: 'Butuh pendampingan penyusunan Rencana Kerja atau koordinasi antar OPD? Manfaatkan ruang konsultasi daring bersama tim verifikator.',
    highlightText: 'Asistensi Cepat',
    accentColor: 'from-purple-600 to-indigo-700',
    bgGradient: 'from-purple-900/90 via-indigo-900/90 to-slate-900',
    icon: <Sparkles className="w-8 h-8 text-purple-300" />,
    tipsTitle: 'Layanan Asistensi e-URK Bapperida',
    tipsList: [
      'Gunakan tombol "Google Meet" di header aplikasi untuk rapat koordinasi dadakan bersama verifikator.',
      'Periksa status usulan Anda secara rutin: ikon lonceng biru menandakan pembaruan data real-time.',
      'Pastikan tautan folder Google Drive dapat diakses (set hak akses ke "Anyone with the link can view").'
    ]
  }
];

export default function PlanningBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedTips, setSelectedTips] = useState<BannerSlide | null>(null);

  useEffect(() => {
    if (isPaused || isMinimized) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, isMinimized]);

  const slide = SLIDES[currentSlide];

  if (isMinimized) {
    return (
      <div className="mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3 rounded-2xl shadow-md flex items-center justify-between border border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-200">
            Pojok Perencanaan Nagekeo: <span className="text-yellow-300 font-extrabold">{slide.title}</span>
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="text-xs font-extrabold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
        >
          <span>Tampilkan Banner</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="mb-8 relative overflow-hidden rounded-3xl shadow-xl border border-slate-700/50 bg-slate-900 text-white transition-all duration-500"
      >
        {/* Decorative ambient background */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-transparent pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-yellow-400 text-slate-950 shadow-sm">
                <Sparkles className="w-3 h-3 text-slate-900" />
                {slide.badge}
              </span>
              <span className="text-xs font-semibold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                {slide.highlightText}
              </span>
              <span className="text-xs text-slate-400">
                &bull; Slide {currentSlide + 1} dari {SLIDES.length}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
              {slide.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {slide.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelectedTips(slide)}
                className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all group"
              >
                <Lightbulb className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>Baca Tips & Panduan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
                  title="Slide Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 px-2">
                  {SLIDES.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentSlide ? 'w-6 bg-yellow-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                      }`}
                      title={`Ke Slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
                  title="Slide Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right illustration / Badge Card */}
          <div className="w-full lg:w-auto flex items-center justify-between lg:flex-col lg:items-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                {slide.icon}
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Info RKPD & e-URK
                </p>
                <p className="text-xs font-extrabold text-yellow-300">
                  BAPPERIDA NAGEKEO
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              className="text-xs text-slate-400 hover:text-white underline font-semibold transition-colors"
            >
              Sembunyikan Banner
            </button>
          </div>
        </div>
      </div>

      {/* Tips & Guidance Modal */}
      {selectedTips && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                    {selectedTips.tipsTitle}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tips Praktis Perencanaan e-URK Kabupaten Nagekeo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTips(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {selectedTips.tipsList.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
                <Bookmark className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800">
                  <strong>Catatan Bapperida:</strong> Seluruh usulan yang memenuhi syarat administrasi & kelayakan teknis akan diverifikasi sebelum penetapan akhir RKPD.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedTips(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Mengerti & Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
