export interface SshItem {
  id: string;
  kategori: string;
  uraian: string;
  spesifikasi: string;
  satuan: string;
  minPrice: number;
  maxPrice: number;
}

export const SSH_TIK_NAGEKEO: SshItem[] = [
  {
    id: 'ssh_1',
    kategori: 'A. BELANJA MODAL PERANGKAT LUNAK (PEMBUATAN SISTEM & SOURCE CODE)',
    uraian: 'Aplikasi Internal (Skala Kecil) (Google Apps Script - Basic)',
    spesifikasi: 'Otomatisasi form, spreadsheet, notifikasi. Tanpa UI kompleks. Output: Script, Manual Book.',
    satuan: 'Paket',
    minPrice: 7500000,
    maxPrice: 15000000
  },
  {
    id: 'ssh_2',
    kategori: 'A. BELANJA MODAL PERANGKAT LUNAK (PEMBUATAN SISTEM & SOURCE CODE)',
    uraian: 'Aplikasi Internal (Skala Menengah) (Google Apps Script - Premium)',
    spesifikasi: 'Custom Web App internal, integrasi API eksternal, dashboard pimpinan. Output: Source code, HKI, Manual.',
    satuan: 'Paket',
    minPrice: 25000000,
    maxPrice: 50000000
  },
  {
    id: 'ssh_3',
    kategori: 'A. BELANJA MODAL PERANGKAT LUNAK (PEMBUATAN SISTEM & SOURCE CODE)',
    uraian: 'Sistem Cloud Native (Basic) (Layanan OPD Spesifik)',
    spesifikasi: 'Aplikasi web publik, database terkelola, otentikasi standar. Kapasitas: Skala dinas/badan.',
    satuan: 'Paket',
    minPrice: 75000000,
    maxPrice: 120000000
  },
  {
    id: 'ssh_4',
    kategori: 'A. BELANJA MODAL PERANGKAT LUNAK (PEMBUATAN SISTEM & SOURCE CODE)',
    uraian: 'Sistem Cloud Native (Medium) (Layanan Publik Kabupaten)',
    spesifikasi: 'Arsitektur microservices, API Gateway, akses tinggi bersamaan. Kapasitas: Skala kabupaten (publik).',
    satuan: 'Paket',
    minPrice: 150000000,
    maxPrice: 300000000
  },
  {
    id: 'ssh_5',
    kategori: 'A. BELANJA MODAL PERANGKAT LUNAK (PEMBUATAN SISTEM & SOURCE CODE)',
    uraian: 'Sistem Cloud Native (Premium) (Smart City / Super App)',
    spesifikasi: 'Skalabilitas Kubernetes, integrasi lintas instansi, standar DevSecOps. Kapasitas: Sentralisasi lintas sektor.',
    satuan: 'Paket',
    minPrice: 350000000,
    maxPrice: 750000000
  },
  {
    id: 'ssh_6',
    kategori: 'B. BELANJA SEWA INFRASTRUKTUR CLOUD & LAYANAN PIHAK KETIGA',
    uraian: 'Sewa Cloud Server (Skala Kecil)',
    spesifikasi: '1-2 Instance Server (Compute), Storage Standar, Bandwidth Terbatas.',
    satuan: 'Tahun',
    minPrice: 15000000,
    maxPrice: 35000000
  },
  {
    id: 'ssh_7',
    kategori: 'B. BELANJA SEWA INFRASTRUKTUR CLOUD & LAYANAN PIHAK KETIGA',
    uraian: 'Sewa Cloud Server (Skala Menengah)',
    spesifikasi: 'High Availability, Load Balancer, Multi-Zone Database.',
    satuan: 'Tahun',
    minPrice: 60000000,
    maxPrice: 150000000
  },
  {
    id: 'ssh_8',
    kategori: 'B. BELANJA SEWA INFRASTRUKTUR CLOUD & LAYANAN PIHAK KETIGA',
    uraian: 'Lisensi / API Gateway Pihak Ketiga',
    spesifikasi: 'Email Gateway, SMS/WA Gateway (Notifikasi), Maps API.',
    satuan: 'Tahun',
    minPrice: 10000000,
    maxPrice: 30000000
  },
  {
    id: 'ssh_9',
    kategori: 'C. BELANJA JASA PEMELIHARAAN SISTEM & DUKUNGAN TEKNIS (SLA)',
    uraian: 'Pemeliharaan Level 1 (Standar)',
    spesifikasi: 'Dukungan hari/jam kerja, monitoring mingguan, perbaikan bug minor.',
    satuan: 'Tahun',
    minPrice: 30000000,
    maxPrice: 50000000
  },
  {
    id: 'ssh_10',
    kategori: 'C. BELANJA JASA PEMELIHARAAN SISTEM & DUKUNGAN TEKNIS (SLA)',
    uraian: 'Pemeliharaan Level 2 (Menengah)',
    spesifikasi: 'Monitoring harian, jaminan uptime 99%, backup harian, respon cepat.',
    satuan: 'Tahun',
    minPrice: 75000000,
    maxPrice: 120000000
  },
  {
    id: 'ssh_11',
    kategori: 'C. BELANJA JASA PEMELIHARAAN SISTEM & DUKUNGAN TEKNIS (SLA)',
    uraian: 'Pemeliharaan Level 3 (Premium)',
    spesifikasi: 'Siaga 24/7 (24 jam), penanganan insiden darurat, audit keamanan.',
    satuan: 'Tahun',
    minPrice: 150000000,
    maxPrice: 250000000
  },
  {
    id: 'ssh_12',
    kategori: 'D. BELANJA SEWA APLIKASI PIHAK KETIGA (SOFTWARE AS A SERVICE / MANAGED SERVICE)',
    uraian: 'Sewa Aplikasi Standar (Basic SaaS)',
    spesifikasi: 'Aplikasi siap pakai tanpa kustomisasi rumit. Server & pemeliharaan ditanggung vendor. Contoh: Aplikasi absensi online standar, antrean digital.',
    satuan: 'Tahun',
    minPrice: 15000000,
    maxPrice: 40000000
  },
  {
    id: 'ssh_13',
    kategori: 'D. BELANJA SEWA APLIKASI PIHAK KETIGA (SOFTWARE AS A SERVICE / MANAGED SERVICE)',
    uraian: 'Sewa Aplikasi Skala Menengah (Managed Service)',
    spesifikasi: 'Aplikasi dikustomisasi khusus untuk proses bisnis Pemda, namun source code tetap milik vendor. Contoh: Sistem e-Office OPD, Sistem Informasi Desa terpadu.',
    satuan: 'Tahun',
    minPrice: 50000000,
    maxPrice: 120000000
  },
  {
    id: 'ssh_14',
    kategori: 'D. BELANJA SEWA APLIKASI PIHAK KETIGA (SOFTWARE AS A SERVICE / MANAGED SERVICE)',
    uraian: 'Sewa Aplikasi Premium (Sistem Transaksional/ KSO)',
    spesifikasi: 'Sistem kompleks dengan tingkat keamanan tinggi. Contoh: e-Pajak, e-Retribusi, e-Parkir.',
    satuan: 'Tahun',
    minPrice: 150000000,
    maxPrice: 300000000
  }
];
