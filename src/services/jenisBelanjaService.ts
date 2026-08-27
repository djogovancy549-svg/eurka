import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { JenisBelanjaItem, Proposal, BidangConfig } from '../types';

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export const DEFAULT_JENIS_BELANJA: JenisBelanjaItem[] = [
  // A. BELANJA MODAL PERANGKAT LUNAK (PEMBUATAN SISTEM & SOURCE CODE)
  {
    id: 'jb_software_basic',
    kodeBelanja: '5.2.02.01.0001',
    namaJenisBelanja: 'Aplikasi Internal (Skala Kecil) - Apps Script Basic',
    kategori: 'Belanja Modal Perangkat Lunak',
    paguAnggaran: 50000000,
    satuanDefault: 'Paket',
    rentangHargaDefault: '7.500.000 - 15.000.000',
    keterangan: 'Otomatisasi form, spreadsheet, notifikasi. Output: Script & Manual Book.',
    paguPerBidang: { 'Sekretariat': 25000000, 'PL': 25000000 }
  },
  {
    id: 'jb_software_medium',
    kodeBelanja: '5.2.02.01.0002',
    namaJenisBelanja: 'Aplikasi Internal (Skala Menengah) - Custom Web App',
    kategori: 'Belanja Modal Perangkat Lunak',
    paguAnggaran: 150000000,
    satuanDefault: 'Paket',
    rentangHargaDefault: '25.000.000 - 50.000.000',
    keterangan: 'Custom Web App internal, integrasi API, dashboard pimpinan. Output: Source code & HKI.',
    paguPerBidang: { 'BM': 50000000, 'SDA': 50000000, 'CK': 50000000 }
  },
  {
    id: 'jb_cloud_basic',
    kodeBelanja: '5.2.02.01.0003',
    namaJenisBelanja: 'Sistem Cloud Native (Basic) - Layanan OPD Spesifik',
    kategori: 'Belanja Modal Perangkat Lunak',
    paguAnggaran: 250000000,
    satuanDefault: 'Paket',
    rentangHargaDefault: '75.000.000 - 120.000.000',
    keterangan: 'Aplikasi web publik, database terkelola, otentikasi standar.',
    paguPerBidang: { 'Tata Ruang': 120000000, 'PL': 130000000 }
  },
  {
    id: 'jb_cloud_medium',
    kodeBelanja: '5.2.02.01.0004',
    namaJenisBelanja: 'Sistem Cloud Native (Medium) - Layanan Publik Kabupaten',
    kategori: 'Belanja Modal Perangkat Lunak',
    paguAnggaran: 450000000,
    satuanDefault: 'Paket',
    rentangHargaDefault: '150.000.000 - 300.000.000',
    keterangan: 'Arsitektur microservices, API Gateway, akses tinggi bersamaan.',
    paguPerBidang: { 'Sekretariat': 250000000, 'BM': 200000000 }
  },
  {
    id: 'jb_cloud_premium',
    kodeBelanja: '5.2.02.01.0005',
    namaJenisBelanja: 'Sistem Cloud Native (Premium) - Smart City / Super App',
    kategori: 'Belanja Modal Perangkat Lunak',
    paguAnggaran: 750000000,
    satuanDefault: 'Paket',
    rentangHargaDefault: '350.000.000 - 750.000.000',
    keterangan: 'Kubernetes, integrasi lintas instansi, standar DevSecOps.',
    paguPerBidang: { 'Sekretariat': 750000000 }
  },

  // B. BELANJA SEWA INFRASTRUKTUR CLOUD & LAYANAN PIHAK KETIGA
  {
    id: 'jb_sewa_cloud_kecil',
    kodeBelanja: '5.1.02.02.0001',
    namaJenisBelanja: 'Sewa Cloud Server (Skala Kecil)',
    kategori: 'Belanja Sewa Cloud & Infrastruktur',
    paguAnggaran: 70000000,
    satuanDefault: 'Tahun',
    rentangHargaDefault: '15.000.000 - 35.000.000',
    keterangan: '1-2 Instance Server (Compute), Storage Standar, Bandwidth Terbatas.',
    paguPerBidang: { 'Sekretariat': 35000000, 'PL': 35000000 }
  },
  {
    id: 'jb_sewa_cloud_menengah',
    kodeBelanja: '5.1.02.02.0002',
    namaJenisBelanja: 'Sewa Cloud Server (Skala Menengah - High Availability)',
    kategori: 'Belanja Sewa Cloud & Infrastruktur',
    paguAnggaran: 300000000,
    satuanDefault: 'Tahun',
    rentangHargaDefault: '60.000.000 - 150.000.000',
    keterangan: 'High Availability, Load Balancer, Multi-Zone Database.',
    paguPerBidang: { 'Sekretariat': 150000000, 'BM': 150000000 }
  },
  {
    id: 'jb_lisensi_api',
    kodeBelanja: '5.1.02.02.0003',
    namaJenisBelanja: 'Lisensi / API Gateway Pihak Ketiga (Notifikasi WA/Maps)',
    kategori: 'Belanja Sewa Cloud & Infrastruktur',
    paguAnggaran: 60000000,
    satuanDefault: 'Tahun',
    rentangHargaDefault: '10.000.000 - 30.000.000',
    keterangan: 'Email Gateway, SMS/WA Gateway (Notifikasi), Maps API.',
    paguPerBidang: { 'Sekretariat': 30000000, 'Tata Ruang': 30000000 }
  },

  // C. BELANJA JASA PEMELIHARAAN SISTEM & DUKUNGAN TEKNIS (SLA)
  {
    id: 'jb_sla_level1',
    kodeBelanja: '5.1.02.03.0001',
    namaJenisBelanja: 'Pemeliharaan Level 1 (Standar / Jam Kerja)',
    kategori: 'Belanja Jasa Pemeliharaan & SLA',
    paguAnggaran: 100000000,
    satuanDefault: 'Tahun',
    rentangHargaDefault: '30.000.000 - 50.000.000',
    keterangan: 'Dukungan hari/jam kerja, monitoring mingguan, perbaikan bug minor.',
    paguPerBidang: { 'Sekretariat': 50000000, 'PL': 50000000 }
  },
  {
    id: 'jb_sla_level2',
    kodeBelanja: '5.1.02.03.0002',
    namaJenisBelanja: 'Pemeliharaan Level 2 (Menengah / Uptime 99%)',
    kategori: 'Belanja Jasa Pemeliharaan & SLA',
    paguAnggaran: 240000000,
    satuanDefault: 'Tahun',
    rentangHargaDefault: '75.000.000 - 120.000.000',
    keterangan: 'Monitoring harian, jaminan uptime 99%, backup harian, respon cepat.',
    paguPerBidang: { 'BM': 120000000, 'SDA': 120000000 }
  },
  {
    id: 'jb_sla_level3',
    kodeBelanja: '5.1.02.03.0003',
    namaJenisBelanja: 'Pemeliharaan Level 3 (Premium / Siaga 24/7)',
    kategori: 'Belanja Jasa Pemeliharaan & SLA',
    paguAnggaran: 500000000,
    satuanDefault: 'Tahun',
    rentangHargaDefault: '150.000.000 - 250.000.000',
    keterangan: 'Siaga 24/7 (24 jam), penanganan insiden darurat, audit keamanan.',
    paguPerBidang: { 'Sekretariat': 250000000, 'CK': 250000000 }
  },

  // D. BELANJA SEWA APLIKASI PIHAK KETIGA (SaaS / MANAGED SERVICE)
  {
    id: 'jb_saas_basic',
    kodeBelanja: '5.1.02.04.0001',
    namaJenisBelanja: 'Sewa Aplikasi Standar (Basic SaaS)',
    kategori: 'Belanja Sewa Aplikasi (SaaS)',
    paguAnggaran: 80000000,
    satuanDefault: 'Tahun',
    rentangHargaDefault: '15.000.000 - 40.000.000',
    keterangan: 'Aplikasi siap pakai tanpa kustomisasi rumit. Server & pemeliharaan ditanggung vendor.',
    paguPerBidang: { 'Sekretariat': 40000000, 'PL': 40000000 }
  },
  {
    id: 'jb_saas_medium',
    kodeBelanja: '5.1.02.04.0002',
    namaJenisBelanja: 'Sewa Aplikasi Skala Menengah (Managed Service e-Office)',
    kategori: 'Belanja Sewa Aplikasi (SaaS)',
    paguAnggaran: 240000000,
    satuanDefault: 'Tahun',
    rentangHargaDefault: '50.000.000 - 120.000.000',
    keterangan: 'Aplikasi dikustomisasi khusus untuk proses bisnis Pemda. Contoh: e-Office, SID.',
    paguPerBidang: { 'Sekretariat': 120000000, 'Tata Ruang': 120000000 }
  },

  // E. BELANJA MODAL INFRASTRUKTUR PUPR (FISIK)
  {
    id: 'jb_modal_jalan_irigasi',
    kodeBelanja: '5.2.04.01.0001',
    namaJenisBelanja: 'Belanja Modal Jalan, Jaringan, dan Irigasi',
    kategori: 'Belanja Modal Infrastruktur PUPR',
    paguAnggaran: 12500000000,
    satuanDefault: 'Kegiatan',
    rentangHargaDefault: 'Sesuai RAB / DPA Definitif',
    keterangan: 'Pembangunan, peningkatan, dan rehabilitasi jaringan jalan, jembatan, dan irigasi.',
    paguPerBidang: { 'BM': 7500000000, 'SDA': 5000000000 }
  },
  {
    id: 'jb_modal_gedung',
    kodeBelanja: '5.2.03.01.0001',
    namaJenisBelanja: 'Belanja Modal Gedung dan Bangunan',
    kategori: 'Belanja Modal Infrastruktur PUPR',
    paguAnggaran: 4000000000,
    satuanDefault: 'Unit',
    rentangHargaDefault: 'Sesuai RAB / DPA Definitif',
    keterangan: 'Pembangunan dan rehabilitasi gedung kantor, fasilitas umum, dan sarana permukiman.',
    paguPerBidang: { 'CK': 2500000000, 'PL': 1500000000 }
  },
  {
    id: 'jb_operasional_barang',
    kodeBelanja: '5.1.02.01.0001',
    namaJenisBelanja: 'Belanja Operasional, Barang & Jasa, Pemeliharaan Rutin',
    kategori: 'Belanja Operasional & Pemeliharaan',
    paguAnggaran: 2000000000,
    satuanDefault: 'Paket',
    rentangHargaDefault: 'Sesuai RKA / DPA',
    keterangan: 'Belanja ATK, perjalanan dinas, jasa pengawasan/perencanaan, dan operasional rutin.',
    paguPerBidang: { 'Sekretariat': 800000000, 'BM': 300000000, 'SDA': 300000000, 'CK': 300000000, 'PL': 300000000 }
  }
];

export const getAllJenisBelanja = async (): Promise<JenisBelanjaItem[]> => {
  try {
    const cached = localStorage.getItem('cached_master_jenis_belanja');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Asynchronously check Firestore in background
        syncFromFirestoreInBackground();
        return parsed;
      }
    }
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'masterJenisBelanja');
    const docSnap = await withTimeout(getDoc(docRef), 8000, null as any);
    if (docSnap && docSnap.exists() && docSnap.data().items) {
      const items = docSnap.data().items as JenisBelanjaItem[];
      localStorage.setItem('cached_master_jenis_belanja', JSON.stringify(items));
      return items;
    }
  } catch (e) {
    console.warn('Using default jenis belanja due to network delay/error:', e);
  }

  localStorage.setItem('cached_master_jenis_belanja', JSON.stringify(DEFAULT_JENIS_BELANJA));
  return DEFAULT_JENIS_BELANJA;
};

const syncFromFirestoreInBackground = async () => {
  try {
    const docRef = doc(db, 'appConfig', 'masterJenisBelanja');
    const docSnap = await getDoc(docRef);
    if (docSnap && docSnap.exists() && docSnap.data().items) {
      const items = docSnap.data().items as JenisBelanjaItem[];
      localStorage.setItem('cached_master_jenis_belanja', JSON.stringify(items));
    }
  } catch (e) {}
};

export const saveAllJenisBelanja = async (items: JenisBelanjaItem[]) => {
  try {
    localStorage.setItem('cached_master_jenis_belanja', JSON.stringify(items));
  } catch (e) {}

  try {
    const docRef = doc(db, 'appConfig', 'masterJenisBelanja');
    await withTimeout(setDoc(docRef, { items, lastUpdated: new Date().toISOString() }, { merge: true }), 8000, undefined);
  } catch (e) {
    console.warn('Saved jenis belanja locally, Firestore sync delayed:', e);
  }
};

export const resetToDefaultJenisBelanja = async (): Promise<JenisBelanjaItem[]> => {
  await saveAllJenisBelanja(DEFAULT_JENIS_BELANJA);
  return DEFAULT_JENIS_BELANJA;
};

export interface PaguSummary {
  totalPaguKeseluruhan: number;
  totalUsulanKeseluruhan: number;
  sisaPaguKeseluruhan: number;
  persenSerapanKeseluruhan: number;
  summaryPerJenisBelanja: {
    item: JenisBelanjaItem;
    totalPagu: number;
    totalUsulan: number;
    countUsulan: number;
    sisaPagu: number;
    persenSerapan: number;
    status: 'Sisa' | 'Pas / Optimal' | 'Defisit / Over Budget';
  }[];
  summaryPerBidang: {
    bidang: string;
    totalPaguBidang: number;
    totalUsulanBidang: number;
    sisaPaguBidang: number;
    countUsulan: number;
    persenSerapanBidang: number;
  }[];
}

export const calculatePaguSummary = (
  jenisBelanjaList: JenisBelanjaItem[],
  proposals: Proposal[],
  bidangConfigs: BidangConfig[] = []
): PaguSummary => {
  // 1. Total Pagu Keseluruhan from Master Jenis Belanja
  const totalPaguKeseluruhan = jenisBelanjaList.reduce((acc, curr) => acc + (Number(curr.paguAnggaran) || 0), 0);
  const totalUsulanKeseluruhan = proposals.reduce((acc, curr) => acc + (Number(curr.estimatedBudget) || 0), 0);
  const sisaPaguKeseluruhan = totalPaguKeseluruhan - totalUsulanKeseluruhan;
  const persenSerapanKeseluruhan = totalPaguKeseluruhan > 0 ? (totalUsulanKeseluruhan / totalPaguKeseluruhan) * 100 : 0;

  // 2. Summary per Jenis Belanja
  const summaryPerJenisBelanja = jenisBelanjaList.map(item => {
    const matchedProposals = proposals.filter(p => {
      if (p.jenisBelanjaId && p.jenisBelanjaId === item.id) return true;
      if (p.jenisBelanja) {
        const pjb = p.jenisBelanja.toLowerCase().trim();
        const itemNama = item.namaJenisBelanja.toLowerCase().trim();
        const itemKat = item.kategori.toLowerCase().trim();
        return pjb.includes(itemNama) || itemNama.includes(pjb) || pjb.includes(itemKat);
      }
      return false;
    });

    const totalUsulan = matchedProposals.reduce((sum, p) => sum + (Number(p.estimatedBudget) || 0), 0);
    const countUsulan = matchedProposals.length;
    const totalPagu = Number(item.paguAnggaran) || 0;
    const sisaPagu = totalPagu - totalUsulan;
    const persenSerapan = totalPagu > 0 ? (totalUsulan / totalPagu) * 100 : 0;

    let status: 'Sisa' | 'Pas / Optimal' | 'Defisit / Over Budget' = 'Sisa';
    if (sisaPagu < 0) {
      status = 'Defisit / Over Budget';
    } else if (sisaPagu === 0) {
      status = 'Pas / Optimal';
    }

    return {
      item,
      totalPagu,
      totalUsulan,
      countUsulan,
      sisaPagu,
      persenSerapan,
      status
    };
  });

  // 3. Summary per Bidang
  // Collect all bidang IDs from configs + default list
  const bidangSet = new Set<string>();
  bidangConfigs.forEach(bc => bidangSet.add(bc.id));
  ['SDA', 'PL', 'CK', 'BM', 'Tata Ruang', 'Sekretariat'].forEach(b => bidangSet.add(b));

  const summaryPerBidang = Array.from(bidangSet).map(bidang => {
    // Calculate Pagu for this Bidang across all Jenis Belanja (paguPerBidang) or fall back to BidangConfig.pagu
    let totalPaguBidang = 0;
    jenisBelanjaList.forEach(jb => {
      if (jb.paguPerBidang && jb.paguPerBidang[bidang] !== undefined) {
        totalPaguBidang += Number(jb.paguPerBidang[bidang]) || 0;
      }
    });

    // If no specific paguPerBidang was set in Master Jenis Belanja, check BidangConfig pagu
    if (totalPaguBidang === 0) {
      const bc = bidangConfigs.find(c => c.id === bidang);
      if (bc && bc.pagu > 0) {
        totalPaguBidang = bc.pagu;
      }
    }

    // Match proposals for this bidang
    const bidangProposals = proposals.filter(p => {
      // In this app, proposals in a bidang sheet belong to that bidang
      // or if p has a field matching bidang
      return true; // We will pass filtered proposals per bidang when calculating per bidang or filter by proposal origin
    });

    const totalUsulanBidang = bidangProposals.reduce((sum, p) => sum + (Number(p.estimatedBudget) || 0), 0);
    const countUsulan = bidangProposals.length;
    const sisaPaguBidang = totalPaguBidang - totalUsulanBidang;
    const persenSerapanBidang = totalPaguBidang > 0 ? (totalUsulanBidang / totalPaguBidang) * 100 : 0;

    return {
      bidang,
      totalPaguBidang,
      totalUsulanBidang,
      sisaPaguBidang,
      countUsulan,
      persenSerapanBidang
    };
  });

  return {
    totalPaguKeseluruhan,
    totalUsulanKeseluruhan,
    sisaPaguKeseluruhan,
    persenSerapanKeseluruhan,
    summaryPerJenisBelanja,
    summaryPerBidang
  };
};
