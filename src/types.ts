// ⚠️ UBAH EMAIL ADMIN DI SINI
// Anda dapat menambahkan lebih dari satu email admin, pisahkan dengan koma:
// export const ADMIN_EMAILS = ['admin1@gmail.com', 'admin2@gmail.com'];
export const ADMIN_EMAILS = ['djogovancy549@gmail.com'];

export const BIDANG_LIST = [
  'SDA', 'PL', 'CK', 'BM', 'Tata Ruang', 'Sekretariat',
  'Kecamatan', 'Desa', 'Kelurahan / Lurah', 'POKIR (DPRD)'
];
export const NON_BIDANG_UNITS = ['Kecamatan', 'Desa', 'Kelurahan / Lurah', 'POKIR (DPRD)'];

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
    { id: 'req_pokir_2', label: 'Kesesuaian Dapil (Daerah Pemilihan)', description: 'Lokasi usulan berada di wilayah Dapil anggota DPRD pengusul.' },
    { id: 'req_pokir_3', label: 'Sinergi dengan Program Strategis Daerah', description: 'Selaras dengan sasaran RPJMD dan RKPD Kabupaten Nagekeo.' },
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
