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
  'DAU (Dana Alokasi Umum)',
  'DAU Earmark / Spesifik (PUPR/Kelurahan)',
  'DAK Fisik (Dana Alokasi Khusus)',
  'DAK Non-Fisik',
  'PAD (Pendapatan Asli Daerah)',
  'DBH (Dana Bagi Hasil)',
  'BKP (Bantuan Keuangan Provinsi NTT)',
  'Dana Desa (APBDes / APBN)',
  'Pinjaman / Hibah / Lainnya'
];

export type SipdStatus = 'draft' | 'siap_sipd' | 'sudah_sipd' | 'ditolak_sipd';

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
  folderUrl: string;
  budgetRules?: BudgetRule[];
  customRequirements?: Requirement[];
}

export interface Proposal {
  id: string;
  rowIndex?: number;
  projectName: string;
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
  renjaSubKegiatanId?: string;
  renjaSubKegiatanName?: string;
  renjaPaguAlokasi?: number;
  catatanAkomodasiRenja?: string;
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

export interface RenjaSubKegiatan {
  id: string;
  programId: string;
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
}

export const DEFAULT_RENJA_PROGRAMS: RenjaProgram[] = [];

export const DEFAULT_RENJA_SUB_KEGIATAN: RenjaSubKegiatan[] = [];

// ==========================================
// DPA (DOKUMEN PELAKSANAAN ANGGARAN) & SPPD
// ==========================================

export interface DpaItem {
  id: string;
  tahun: string;
  nomorDpa: string;
  kodeProgram: string;
  namaProgram: string;
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
