// ⚠️ UBAH EMAIL ADMIN DI SINI
// Anda dapat menambahkan lebih dari satu email admin, pisahkan dengan koma:
// export const ADMIN_EMAILS = ['admin1@gmail.com', 'admin2@gmail.com'];
export const ADMIN_EMAILS = ['djogovancy549@gmail.com'];
export const BIDANG_LIST = [
  'SDA', 'PL', 'CK', 'BM', 'Tata Ruang', 'Sekretariat',
  'Kecamatan', 'Desa', 'Kelurahan / Lurah', 'POKIR (DPRD)', 'RENJA (OPD/Dinas)'
];
export const NON_BIDANG_UNITS = ['Kecamatan', 'Desa', 'Kelurahan / Lurah', 'POKIR (DPRD)', 'RENJA (OPD/Dinas)'];
export const SUMBER_USULAN_OPTIONS = [
  'Musrenbang Desa / Kelurahan',
  'Musrenbang Kecamatan',
  'POKIR (DPRD)',
  'RENJA Perangkat Daerah / OPD',
  'Bidang Teknis Internal DPUPR'
];
export const SUMBER_DANA_LIST = [
  'Pajak Daerah',
  'Lain-lain PAD Yang Sah',
  'Dana Alokasi Umum (DAU)',
  'Opsen PKB',
  'Pendapatan Bagi Hasil Pajak Kendaraan Bermotor',
  'DAU Earmark / Spesifik (PUPR/Kelurahan)',
  'DAK Fisik (Dana Alokasi Khusus)',
  'DAK Non-Fisik',
  'PAD (Pendapatan Asli Daerah)',
  'DBH (Dana Bagi Hasil)',
  'BKP (Bantuan Keuangan Provinsi NTT)',
  'Dana Desa (APBDes / APBN)',
  'Pinjaman / Hibah / Lainnya'
];

export interface SumberDanaItem {
  id: string;
  kodeDana?: string;
  namaSumberDana: string;
  kategori?: string; // e.g. 'PAD', 'Transfer Pusat', 'Transfer Provinsi', 'Lainnya'
  keterangan?: string;
  paguTotal?: number;
  isActive?: boolean;
  updatedAt?: string;
}

export interface SshItem {
  id: string;
  kodeSsh?: string;
  kategori: string;
  uraian: string;
  spesifikasi: string;
  satuan: string;
  minPrice: number;
  maxPrice: number;
  programId?: string;
  kegiatanId?: string;
  subKegiatanId?: string;
  subKegiatanName?: string;
  updatedAt?: string;
}

export type SipdStatus = 'draft' | 'siap_sipd' | 'sudah_sipd' | 'ditolak_sipd';
export interface JenisBelanjaItem {
  id: string;
  kodeBelanja?: string;
  namaJenisBelanja: string; // E.g. 'Aplikasi Internal Basic', 'Belanja Modal Jalan', etc.
  kategori: string; // E.g. 'Belanja Modal Perangkat Lunak', 'Belanja Sewa Cloud', 'Belanja Modal Infrastruktur PUPR'
  paguAnggaran: number; // Pagu Anggaran yang diinput Admin
  paguPerBidang?: Record<string, number>; // Allocations per Bidang { "SDA": 500000000, "BM": 1000000000 }
  satuanDefault?: string; // E.g. Paket, Tahun, Unit, Meter
  rentangHargaDefault?: string; // E.g. '25.000.000 - 50.000.000'
  keterangan?: string;
  updatedAt?: string;
}

export interface BudgetRule {
  programName: string;
  maxPercentage: number; // e.g. 35 for 35%
}
export interface BidangConfig {
  id: string; // e.g., 'SDA', 'Kecamatan', etc.
  name: string;
  pagu: number; // Total Pagu Indikatif
  paguPerSumberDana?: Record<string, number>; // Pemisahan Pagu Indikatif per Sumber Dana (e.g. { "DAU": 5000000000, "DAK Fisik": 10000000000 })
  sheetId: string;
  folderUrl?: string;
  driveUrl?: string;
  budgetRules?: BudgetRule[];
  customRequirements?: Requirement[];
}
export interface Proposal {
  id: string;
  rowIndex?: number;
  projectName: string;
  sshId?: string;
  jenisBelanja?: string; // Nama / Kategori Jenis Belanja yang dipilih
  jenisBelanjaId?: string; // ID Jenis Belanja
  programName?: string;
  activityName?: string;
  tahunUsulan?: string;
  jenisUsulan?: string;
  sumberUsulan?: string;
  sumberDanaTarget?: string; // Target sumber dana usulan (DAU, DAK Fisik, dll)
  kecamatan?: string;
  desa?: string;
  pengusulPokir?: string[]; // Multiple pengusul for Pokir DPRD
  location: string;
  estimatedBudget: number;
  justification: string;
  zoomLink?: string;
  documentFolderUrl?: string;
  status?: 'pending' | 'diterima' | 'belum_lengkap' | 'revisi' | 'ditolak';
  adminNotes?: string;
  attachments?: { name: string; url: string; size?: string; type?: string; uploadedAt?: string }[];
  requirementsMet: Record<string, boolean>;
  submittedBy: string;
  submittedAt: string;
  sipdStatus?: SipdStatus;
  sipdRegistrationNo?: string;
  sipdNotes?: string;
  // Linkage Keterkaitan dengan RENJA OPD
  isAkomodirRenja?: boolean;
  renjaProgramId?: string;
  renjaProgramName?: string;
  renjaKegiatanId?: string;
  renjaKegiatanName?: string;
  renjaSubKegiatanId?: string;
  renjaSubKegiatanName?: string;
  renjaPaguAlokasi?: number;
  catatanAkomodasiRenja?: string;
  // Penentuan Skala Prioritas Pelaksanaan
  priorityLevel?: PriorityLevel;
  priorityScore?: number; // Nilai 0 - 100
  priorityCriteria?: PriorityCriteria;
}
// ==========================================
// SKALA PRIORITAS & INDIKATOR PELAKSANAAN
// ==========================================
export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';
export interface PriorityLevelMeta {
  code: PriorityLevel;
  label: string;
  shortLabel: string;
  description: string;
  minScore: number;
  colorClass: string;
  badgeClass: string;
  ringClass: string;
  executionPhase: string;
}
export const PRIORITY_LEVELS: Record<PriorityLevel, PriorityLevelMeta> = {
  P1: {
    code: 'P1',
    label: 'Prioritas 1 (Sangat Mendesak / Utama)',
    shortLabel: 'P1 - Utama',
    description: 'Wajib dilaksanakan paling awal pada APBD Murni. Kondisi kritis, dokumen lengkap, dampak luas.',
    minScore: 80,
    colorClass: 'text-red-600 bg-red-50 border-red-200',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    ringClass: 'ring-red-500',
    executionPhase: 'Tahap 1 (Mendesak / Utama)'
  },
  P2: {
    code: 'P2',
    label: 'Prioritas 2 (Prioritas Tinggi)',
    shortLabel: 'P2 - Tinggi',
    description: 'Sangat direkomendasikan masuk DPA Induk. Kesiapan teknis baik, mendukung sentra ekonomi.',
    minScore: 65,
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    ringClass: 'ring-amber-500',
    executionPhase: 'Tahap 2 (Prioritas Standar)'
  },
  P3: {
    code: 'P3',
    label: 'Prioritas 3 (Prioritas Sedang)',
    shortLabel: 'P3 - Sedang',
    description: 'Kategori penanganan reguler/pemeliharaan berkala atau menunggu kelengkapan DED.',
    minScore: 50,
    colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    ringClass: 'ring-blue-500',
    executionPhase: 'Tahap 3 (Jadwal Reguler)'
  },
  P4: {
    code: 'P4',
    label: 'Prioritas 4 (Cadangan / Ditunda)',
    shortLabel: 'P4 - Cadangan',
    description: 'Usulan cadangan (backlog) atau dialokasikan pada Perubahan APBD / tahun berikutnya.',
    minScore: 0,
    colorClass: 'text-slate-600 bg-slate-50 border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    ringClass: 'ring-slate-400',
    executionPhase: 'Tahap 4 (Cadangan / Perubahan)'
  }
};
export interface PriorityCriteria {
  urgensiKondisi: number; // 1-5 (Bobot 30%): Tingkat Kerusakan/Bahaya Fisik
  kesiapanDokumen: number; // 1-5 (Bobot 25%): Kesiapan Lahan Bebas Sengketa & DED/RAB
  dampakManfaat: number; // 1-5 (Bobot 25%): Jumlah Jiwa/Penerima Manfaat & Konektivitas
  keselarasanRpjmd: number; // 1-5 (Bobot 20%): Sinergi RPJMD/Stunting/Kemiskinan Ekstrem
  totalScore: number; // 0 - 100
  priorityLevel: PriorityLevel;
  justifikasiTeknis?: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
}
export function computePriorityScore(
  urgensi: number,
  kesiapan: number,
  dampak: number,
  rpjmd: number
): { totalScore: number; level: PriorityLevel } {
  // Bobot:
  // Urgensi: 30% -> (nilai/5)*30
  // Kesiapan: 25% -> (nilai/5)*25
  // Dampak: 25% -> (nilai/5)*25
  // RPJMD: 20% -> (nilai/5)*20
  const u = Math.min(5, Math.max(1, urgensi || 1));
  const k = Math.min(5, Math.max(1, kesiapan || 1));
  const d = Math.min(5, Math.max(1, dampak || 1));
  const r = Math.min(5, Math.max(1, rpjmd || 1));
  const score = Math.round(
    (u / 5) * 30 +
    (k / 5) * 25 +
    (d / 5) * 25 +
    (r / 5) * 20
  );
  let level: PriorityLevel = 'P4';
  if (score >= 80) level = 'P1';
  else if (score >= 65) level = 'P2';
  else if (score >= 50) level = 'P3';
  else level = 'P4';
  return { totalScore: score, level };
}
export interface RenjaProgram {
  id: string;
  kodeProgram: string;
  namaProgram: string;
  bidangPengampu: string;
  indikatorKinerja: string;
  targetKinerja: string;
  paguProgram: number;
  tahun: string;
}
export interface RenjaKegiatan {
  id: string;
  programId: string;
  kodeKegiatan: string;
  namaKegiatan: string;
  bidangPengampu: string;
  indikatorKegiatan?: string;
  targetKinerja?: string;
  paguKegiatan?: number;
  tahun: string;
}
export interface RenjaSubKegiatan {
  id: string;
  programId: string;
  kegiatanId?: string;
  kodeKegiatan?: string;
  namaKegiatan?: string;
  kodeSubKegiatan: string;
  namaSubKegiatan: string;
  indikatorSubKegiatan: string;
  targetVolume: string;
  satuan: string;
  lokasi: string;
  sumberDana: string;
  paguSubKegiatan: number;
  bidangPengampu: string;
  tahun: string;
  linkedProposalIds?: string[]; // List of URK Proposal IDs linked/absorbed
  priorityLevel?: PriorityLevel;
  priorityScore?: number;
}
export const DEFAULT_RENJA_PROGRAMS: RenjaProgram[] = [];
export const DEFAULT_RENJA_KEGIATAN: RenjaKegiatan[] = [];
export const DEFAULT_RENJA_SUB_KEGIATAN: RenjaSubKegiatan[] = [];
// ==========================================
// PENGATURAN BESARAN & SYARAT BIAYA (COST RULES)
// ==========================================
export interface CostComponentRule {
  id: string;
  name: string;
  category: 'perencanaan' | 'pengawasan' | 'operasional' | 'atk' | 'sppd' | 'fisik' | 'lainnya';
  defaultPercentage: number;
  maxPercentage: number;
  description: string;
  requirements: string[];
  isActive: boolean;
  formulaBasis: 'total_pagu' | 'pagu_fisik';
}
export const DEFAULT_COST_COMPONENT_RULES: CostComponentRule[] = [
  {
    id: 'cost_fisik',
    name: 'Pekerjaan Konstruksi / Fisik Utama',
    category: 'fisik',
    defaultPercentage: 80.0,
    maxPercentage: 95.0,
    description: 'Pagu utama pelaksanaan konstruksi/pembangunan infrastruktur fisik di lapangan.',
    requirements: [
      'Tersedia Gambar Kerja / Detail Engineering Design (DED)',
      'Tersedia Rencana Anggaran Biaya (RAB) dan HPS yang disahkan PPK',
      'Kesiapan Lokasi / Bebas Sengketa Lahan (Surat Pernyataan Hibah / Kepemilikan)'
    ],
    isActive: true,
    formulaBasis: 'total_pagu'
  },
  {
    id: 'cost_perencanaan',
    name: 'Jasa Konsultansi Perencanaan (DED / Masterplan / FS)',
    category: 'perencanaan',
    defaultPercentage: 4.0,
    maxPercentage: 6.0,
    description: 'Biaya konsultan perencana penyusun DED, survei topografi, dan dokumen lelang.',
    requirements: [
      'Kerangka Acuan Kerja (KAK / TOR) Perencanaan disetujui PPK',
      'Surat Perjanjian Kontrak Konsultansi Perencanaan',
      'Laporan Pendahuluan, Antara, dan Laporan Akhir Perencanaan DED'
    ],
    isActive: true,
    formulaBasis: 'total_pagu'
  },
  {
    id: 'cost_pengawasan',
    name: 'Jasa Konsultansi Pengawasan / Supervisi Lapangan',
    category: 'pengawasan',
    defaultPercentage: 3.5,
    maxPercentage: 5.0,
    description: 'Biaya konsultan pengawas teknis independen selama pelaksanaan konstruksi berlangsung.',
    requirements: [
      'Kerangka Acuan Kerja (KAK) Pengawasan / Supervisi Lapangan',
      'Tenaga Ahli bersertifikat keahlian konstruksi (SKA / SKT)',
      'Laporan Berkala Mingguan, Bulanan, dan Berita Acara MC-0 s/d MC-100'
    ],
    isActive: true,
    formulaBasis: 'total_pagu'
  },
  {
    id: 'cost_operasional',
    name: 'Biaya Pengelolaan Kegiatan / Operasional PPK-PPTK',
    category: 'operasional',
    defaultPercentage: 3.0,
    maxPercentage: 5.0,
    description: 'Honorarium pengelola anggaran, rapat koordinasi teknis, dan administrasi tim pelaksana.',
    requirements: [
      'Surat Keputusan (SK) Pengguna Anggaran tentang Tim Pengelola Teknis / PPTK',
      'Daftar Hadir & Notulensi Rapat Koordinasi Teknis Proyek',
      'Kuitansi Riil Beban Operasional Sesuai Standar Satuan Harga (SSH)'
    ],
    isActive: true,
    formulaBasis: 'total_pagu'
  },
  {
    id: 'cost_atk',
    name: 'Biaya ATK, Penggandaan & Administrasi Dokumen',
    category: 'atk',
    defaultPercentage: 1.5,
    maxPercentage: 2.5,
    description: 'Pembelian kertas, tinta printer, penggandaan dokumen kontrak, dan arsip resmi.',
    requirements: [
      'Nota dan Kuitansi Pembelian Resmi dari Toko/Penyedia',
      'Faktur Pajak dan Tanda Terima Pembelian ATK'
    ],
    isActive: true,
    formulaBasis: 'total_pagu'
  },
  {
    id: 'cost_sppd',
    name: 'Biaya Perjalanan Dinas (SPPD) Monitoring & Pengukuran',
    category: 'sppd',
    defaultPercentage: 2.5,
    maxPercentage: 4.5,
    description: 'Uang harian, BBM/transport, dan akomodasi tim teknis dinas untuk monitoring berkala ke lokasi proyek.',
    requirements: [
      'Surat Perintah Tugas (SPT) ditandatangani Kepala Dinas / PPK',
      'Surat Perintah Perjalanan Dinas (SPPD) yang telah dilegalisir di lokasi tujuan',
      'Laporan Hasil Perjalanan Dinas & Dokumentasi Foto Lapangan'
    ],
    isActive: true,
    formulaBasis: 'total_pagu'
  },
  {
    id: 'cost_lainnya',
    name: 'Biaya Penunjang Lainnya / General Overhead',
    category: 'lainnya',
    defaultPercentage: 1.0,
    maxPercentage: 2.0,
    description: 'Biaya uji laboratorium mutu beton/aspal, sounding tanah, papan proyek, dan sosialisasi masyarakat.',
    requirements: [
      'Hasil Pengujian Laboratorium Bahan yang terakreditasi',
      'Berita Acara Sosialisasi bersama aparat desa & masyarakat'
    ],
    isActive: true,
    formulaBasis: 'total_pagu'
  }
];
// ==========================================
// NOTIFIKASI SISTEM & AUDIT KEAMANAN
// ==========================================
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'proposal_new' | 'proposal_status' | 'renja_linked' | 'dpa_updated' | 'sppd_submitted' | 'sppd_cair' | 'security_alert' | 'system_info';
  targetRole: 'all' | 'admin' | 'user';
  targetUserEmail?: string;
  readBy: string[];
  linkUrl?: string;
  createdAt: string;
  metaData?: Record<string, any>;
}
export interface SecurityAuditLog {
  id: string;
  action: string;
  userEmail: string;
  userName?: string;
  category: 'auth' | 'proposal' | 'renja' | 'dpa' | 'sppd' | 'settings' | 'security';
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
// ==========================================
// DPA (DOKUMEN PELAKSANAAN ANGGARAN) & SPPD
// ==========================================
export interface DpaItem {
  id: string;
  tahun: string;
  nomorDpa: string;
  kodeProgram: string;
  namaProgram: string;
  kodeKegiatan?: string;
  namaKegiatan?: string;
  kodeSubKegiatan: string;
  namaSubKegiatan: string;
  bidangPengampu: string; // SDA, BM, CK, PL, Tata Ruang, Sekretariat
  sumberDana: string; // DAU, DAK Fisik, PAD, etc.
  paguDpa: number; // Pagu Anggaran Definitif DPA
  paguSppd?: number; // Porsi pagu belanja perjalanan dinas dalam sub-kegiatan
  realisasiKeuangan: number; // Total realisasi belanja (SP2D)
  realisasiFisik: number; // Persentase realisasi fisik (0 - 100%)
  targetKinerja?: string;
  keterangan?: string;
  priorityLevel?: PriorityLevel;
  priorityScore?: number;
  updatedAt: string;
}
export interface SppdRecord {
  id: string;
  dpaItemId?: string; // ID Sub-Kegiatan DPA terkait
  kodeSubKegiatan?: string;
  namaSubKegiatan?: string;
  bidangPengampu: string;
  nomorSpt: string; // Nomor Surat Perintah Tugas
  nomorSppd: string; // Nomor SPPD
  namaPelaksana: string; // Pegawai yang bertugas
  nipPelaksana?: string;
  pangkatGolongan?: string; // Penata / III/c, dll
  jabatan?: string;
  maksudPerjalanan: string; // Keperluan dinas / tujuan kegiatan
  jenisPerjalanan: 'Dalam Daerah' | 'Luar Daerah';
  lokasiTujuan: string; // Desa/Kecamatan atau Kota Tujuan
  tanggalBerangkat: string;
  tanggalKembali: string;
  lamaHari: number;
  biayaUangHarian: number;
  biayaTransport: number;
  biayaPenginapan: number;
  biayaLainnya: number;
  totalBiaya: number; // Total SPPD yang terpakai
  sumberDana: string;
  statusPencairan: 'Draft' | 'Pengajuan' | 'Disetujui' | 'Cair (SP2D)';
  noSp2d?: string;
  tglSp2d?: string;
  buktiUrl?: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Requirement {
  id: string;
  label: string;
  description: string;
  required?: boolean;
}
export const defaultRequirements: Requirement[] = [
  { id: 'req_1', label: 'Kesesuaian dengan RTRW', description: 'Usulan harus sesuai dengan Rencana Tata Ruang Wilayah (RTRW) Kabupaten Nagekeo.' },
  { id: 'req_2', label: 'Studi Kelayakan (Feasibility Study)', description: 'Terdapat dokumen studi kelayakan untuk proyek fisik besar.' },
  { id: 'req_3', label: 'DED (Detail Engineering Design)', description: 'Dokumen DED sudah tersedia.' },
  { id: 'req_4', label: 'Kesesuaian RPJMD', description: 'Mendukung target RPJMD Kabupaten Nagekeo.' },
];
export const defaultNonBidangRequirements: Record<string, Requirement[]> = {
  'Kecamatan': [
    { id: 'req_kec_1', label: 'Berita Acara Musrenbang Kecamatan', description: 'Terdapat lampiran Berita Acara Musrenbang tingkat Kecamatan.' },
    { id: 'req_kec_2', label: 'Daftar Hadir & Dokumentasi Musrenbang', description: 'Bukti pelaksanaan Musrenbang bersama perwakilan desa/kelurahan.' },
    { id: 'req_kec_3', label: 'Kesesuaian dengan Prioritas Kecamatan', description: 'Usulan selaras dengan prioritas pembangunan wilayah kecamatan.' },
  ],
  'Desa': [
    { id: 'req_desa_1', label: 'Berita Acara Musrenbang Desa (Musdes)', description: 'Terdapat dokumen hasil Musyawarah Desa.' },
    { id: 'req_desa_2', label: 'Proposal Resmi Desa / Kepala Desa', description: 'Surat pengantar atau proposal resmi dari Pemerintah Desa.' },
    { id: 'req_desa_3', label: 'Kesesuaian dengan RKPDes / RPJMDes', description: 'Sesuai dengan dokumen perencanaan desa.' },
  ],
  'Kelurahan / Lurah': [
    { id: 'req_lurah_1', label: 'Berita Acara Musrenbang Kelurahan', description: 'Terdapat dokumen hasil Musyawarah Kelurahan.' },
    { id: 'req_lurah_2', label: 'Proposal Resmi Kelurahan / Lurah', description: 'Surat pengantar atau proposal resmi dari Pemerintah Kelurahan.' },
    { id: 'req_lurah_3', label: 'Urgensi Kebutuhan Warga Kelurahan', description: 'Mendukung pelayanan umum dan fasilitas publik kelurahan.' },
  ],
  'POKIR (DPRD)': [
    { id: 'req_pokir_1', label: 'Dokumen Reses / Usulan Pokir DPRD', description: 'Surat usulan resmi Pokok-Pokok Pikiran (POKIR) Anggota DPRD.' },
    { id: 'req_pokir_2', label: 'Identitas Pengusul & Dapil (Daerah Pemilihan)', description: 'Nama-nama pengusul (anggota dewan/fraksi) dan wilayah Dapil pengusul.' },
    { id: 'req_pokir_3', label: 'Sinergi dengan Program Strategis Daerah', description: 'Selaras dengan sasaran RPJMD dan RKPD Kabupaten Nagekeo.' },
  ],
  'RENJA (OPD/Dinas)': [
    { id: 'req_renja_1', label: 'Kesesuaian Renstra / Renja Perangkat Daerah', description: 'Usulan masuk dalam Renstra & Rancangan Awal Renja OPD.' },
    { id: 'req_renja_2', label: 'Kesiapan Dokumen Teknis & KAK/TOR', description: 'Kerangka Acuan Kerja (KAK) dan rincian teknis telah disiapkan.' },
    { id: 'req_renja_3', label: 'Analisis Standar Biaya & Kelayakan Anggaran', description: 'Rincian anggaran telah memenuhi Standar Satuan Harga (SSH) Nagekeo.' }
  ]
};
export function getUnitActiveRequirements(config: BidangConfig | null, defaultGlobalReqs: Requirement[]): Requirement[] {
  if (!config) return defaultGlobalReqs;
  if (config.customRequirements && config.customRequirements.length > 0) {
    return config.customRequirements;
  }
  if (NON_BIDANG_UNITS.includes(config.id) && defaultNonBidangRequirements[config.id]) {
    return defaultNonBidangRequirements[config.id];
  }
  return defaultGlobalReqs;
}
