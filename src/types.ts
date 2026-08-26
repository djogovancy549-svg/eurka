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

export type SipdStatus = 'draft' | 'siap_sipd' | 'sudah_sipd' | 'ditolak_sipd';

export interface BudgetRule {
  programName: string;
  maxPercentage: number; // e.g. 35 for 35%
}

export interface BidangConfig {
  id: string; // e.g., 'SDA', 'Kecamatan', etc.
  name: string;
  pagu: number;
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

export const DEFAULT_RENJA_PROGRAMS: RenjaProgram[] = [
  {
    id: 'prog_sda',
    kodeProgram: '1.03.02',
    namaProgram: 'Program Pengelolaan Sumber Daya Air (SDA)',
    bidangPengampu: 'SDA',
    indikatorKinerja: 'Persentase Luas Daerah Irigasi Kewenangan Kabupaten yang Berfungsi Baik',
    targetKinerja: '78 %',
    paguProgram: 15500000000,
    tahun: '2025'
  },
  {
    id: 'prog_bm',
    kodeProgram: '1.03.03',
    namaProgram: 'Program Penyelenggaraan Jalan dan Jembatan',
    bidangPengampu: 'BM',
    indikatorKinerja: 'Persentase Panjang Jalan Kabupaten dalam Kondisi Mantap',
    targetKinerja: '65 %',
    paguProgram: 28000000000,
    tahun: '2025'
  },
  {
    id: 'prog_ck_air',
    kodeProgram: '1.03.04',
    namaProgram: 'Program Pengelolaan dan Pengembangan Sistem Penyediaan Air Minum (SPAM)',
    bidangPengampu: 'CK',
    indikatorKinerja: 'Persentase Rumah Tangga yang Memiliki Akses Air Minum Layak',
    targetKinerja: '82 %',
    paguProgram: 12000000000,
    tahun: '2025'
  },
  {
    id: 'prog_pl_limbah',
    kodeProgram: '1.03.05',
    namaProgram: 'Program Pengelolaan dan Pengembangan Sistem Air Limbah dan Drainase',
    bidangPengampu: 'PL',
    indikatorKinerja: 'Persentase Rumah Tangga yang Memiliki Akses Sanitasi Layak & Drainase Lancar',
    targetKinerja: '75 %',
    paguProgram: 8500000000,
    tahun: '2025'
  },
  {
    id: 'prog_ck_gedung',
    kodeProgram: '1.03.06',
    namaProgram: 'Program Penataan Bangunan Gedung dan Lingkungan',
    bidangPengampu: 'CK',
    indikatorKinerja: 'Persentase Bangunan Gedung Pemerintah yang Memenuhi Standar Teknis',
    targetKinerja: '80 %',
    paguProgram: 6500000000,
    tahun: '2025'
  },
  {
    id: 'prog_tr',
    kodeProgram: '1.03.07',
    namaProgram: 'Program Penyelenggaraan Penataan Ruang',
    bidangPengampu: 'Tata Ruang',
    indikatorKinerja: 'Tersedianya Dokumen RDTR dan Kesesuaian Pemanfaatan Ruang (KKPR)',
    targetKinerja: '100 %',
    paguProgram: 2500000000,
    tahun: '2025'
  },
  {
    id: 'prog_sekretariat',
    kodeProgram: '1.03.01',
    namaProgram: 'Program Penunjang Urusan Pemerintahan Daerah Kabupaten',
    bidangPengampu: 'Sekretariat',
    indikatorKinerja: 'Nilai Evaluasi Akuntabilitas Kinerja Instansi Pemerintah (SAKIP) DPUPR',
    targetKinerja: 'Nilai B / Baik',
    paguProgram: 5000000000,
    tahun: '2025'
  }
];

export const DEFAULT_RENJA_SUB_KEGIATAN: RenjaSubKegiatan[] = [
  {
    id: 'sub_sda_01',
    programId: 'prog_sda',
    kodeSubKegiatan: '1.03.02.2.01.01',
    namaSubKegiatan: 'Pembangunan Jaringan Irigasi Permukaan',
    indikatorSubKegiatan: 'Panjang Saluran Irigasi Baru yang Dibangun',
    targetVolume: '4.5 Km',
    satuan: 'Km',
    lokasi: 'Kecamatan Aesesa & Boawae',
    sumberDana: 'DAK Fisik',
    paguSubKegiatan: 6000000000,
    bidangPengampu: 'SDA',
    tahun: '2025',
    linkedProposalIds: []
  },
  {
    id: 'sub_sda_02',
    programId: 'prog_sda',
    kodeSubKegiatan: '1.03.02.2.01.02',
    namaSubKegiatan: 'Rehabilitasi Jaringan Irigasi Permukaan',
    indikatorSubKegiatan: 'Panjang Saluran Irigasi yang Direhabilitasi/Ditingkatkan',
    targetVolume: '8.2 Km',
    satuan: 'Km',
    lokasi: 'Kecamatan Aesesa Selatan, Mauponggo, Keo Tengah',
    sumberDana: 'DAU',
    paguSubKegiatan: 5500000000,
    bidangPengampu: 'SDA',
    tahun: '2025',
    linkedProposalIds: []
  },
  {
    id: 'sub_bm_01',
    programId: 'prog_bm',
    kodeSubKegiatan: '1.03.03.2.01.01',
    namaSubKegiatan: 'Peningkatan / Rekonstruksi Jalan Kabupaten (Hotmix / Lapen)',
    indikatorSubKegiatan: 'Panjang Jalan Kabupaten yang Ditingkatkan',
    targetVolume: '14.0 Km',
    satuan: 'Km',
    lokasi: 'Kecamatan Wolowae, Nangaroro, Mauponggo',
    sumberDana: 'DAK Fisik',
    paguSubKegiatan: 18000000000,
    bidangPengampu: 'BM',
    tahun: '2025',
    linkedProposalIds: []
  },
  {
    id: 'sub_bm_02',
    programId: 'prog_bm',
    kodeSubKegiatan: '1.03.03.2.01.02',
    namaSubKegiatan: 'Pemeliharaan Rutin / Berkala Jalan dan Jembatan',
    indikatorSubKegiatan: 'Panjang Jalan dan Jumlah Jembatan yang Dipelihara',
    targetVolume: '22.0 Km',
    satuan: 'Km',
    lokasi: '7 Kecamatan se-Kabupaten Nagekeo',
    sumberDana: 'DAU',
    paguSubKegiatan: 6500000000,
    bidangPengampu: 'BM',
    tahun: '2025',
    linkedProposalIds: []
  },
  {
    id: 'sub_ck_01',
    programId: 'prog_ck_air',
    kodeSubKegiatan: '1.03.04.2.01.01',
    namaSubKegiatan: 'Pembangunan / Perluasan Jaringan Perpipaan SPAM Desa',
    indikatorSubKegiatan: 'Jumlah Sambungan Rumah (SR) / Panjang Pipa SPAM Terpasang',
    targetVolume: '750 SR / 12 Km',
    satuan: 'SR',
    lokasi: 'Desa-Desa Rawan Air di Nangaroro & Mauponggo',
    sumberDana: 'DAK Fisik',
    paguSubKegiatan: 7500000000,
    bidangPengampu: 'CK',
    tahun: '2025',
    linkedProposalIds: []
  },
  {
    id: 'sub_pl_01',
    programId: 'prog_pl_limbah',
    kodeSubKegiatan: '1.03.05.2.01.01',
    namaSubKegiatan: 'Pembangunan Saluran Drainase Lingkungan Permukiman',
    indikatorSubKegiatan: 'Panjang Saluran Drainase dan Trotoar Permukiman',
    targetVolume: '3.8 Km',
    satuan: 'Km',
    lokasi: 'Perkotaan Mbay & Kawasan Permukiman Padat',
    sumberDana: 'DAU',
    paguSubKegiatan: 4500000000,
    bidangPengampu: 'PL',
    tahun: '2025',
    linkedProposalIds: []
  }
];

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
