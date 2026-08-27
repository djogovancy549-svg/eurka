export const formatRupiah = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const parseMoney = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // Remove all non-digits except minus
  const clean = String(val).replace(/[^0-9-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

export const printRekapanDisetujui = (
  unitName: string,
  isNonBidang: boolean,
  proposals: any[],
  pagu: number
) => {
  const approved = proposals.filter(p => p.status === 'diterima');
  const totalApprovedBudget = approved.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const titlePrefix = isNonBidang ? 'USULAN' : 'BIDANG';
  const labelUnit = isNonBidang ? unitName : `Bidang ${unitName}`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rekapitulasi Usulan Disetujui - ${labelUnit}</title>
      <style>
        @page { size: A4 landscape; margin: 15mm; }
        body {
          font-family: 'Arial', sans-serif;
          color: #111;
          margin: 0;
          padding: 20px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 3px double #111;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 16pt;
          margin: 0 0 5px 0;
          text-transform: uppercase;
        }
        .header h2 {
          font-size: 14pt;
          margin: 0;
          font-weight: bold;
        }
        .header p {
          font-size: 10pt;
          margin: 4px 0 0 0;
          color: #444;
        }
        .meta-table {
          width: 100%;
          margin-bottom: 15px;
          font-size: 11pt;
        }
        .meta-table td {
          padding: 3px 0;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          font-size: 10pt;
        }
        .data-table th, .data-table td {
          border: 1px solid #333;
          padding: 8px 10px;
          text-align: left;
          vertical-align: top;
        }
        .data-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        .data-table td.number {
          text-align: right;
          font-weight: 600;
        }
        .data-table td.center {
          text-align: center;
        }
        .summary-box {
          margin-top: 15px;
          font-size: 11pt;
          background: #fdfdfd;
          border: 1px solid #ddd;
          padding: 12px;
          border-radius: 4px;
        }
        .summary-box table {
          width: 100%;
        }
        .signatures {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sig-block {
          width: 40%;
          text-align: center;
          font-size: 11pt;
        }
        .sig-space {
          height: 70px;
        }
        .sig-name {
          font-weight: bold;
          text-decoration: underline;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PEMERINTAH KABUPATEN NAGEKEO</h1>
        <h2>REKAPITULASI USULAN RENCANA KERJA YANG DISETUJUI</h2>
        <p>Tahun Anggaran 2025/2026 &bull; Daftar Resmi Usulan Kegiatan ${titlePrefix} ${unitName.toUpperCase()}</p>
      </div>

      <table class="meta-table">
        <tr>
          <td style="width: 160px; font-weight: bold;">Unit / Bagian</td>
          <td>: <strong>${labelUnit}</strong></td>
          <td style="width: 160px; font-weight: bold;">Tanggal Cetak</td>
          <td>: ${dateStr}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Pagu Indikatif</td>
          <td>: ${formatRupiah(pagu)}</td>
          <td style="font-weight: bold;">Jumlah Disetujui</td>
          <td>: <strong>${approved.length} Usulan</strong></td>
        </tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;">No.</th>
            <th style="width: 150px;">Program & Kegiatan</th>
            <th>Nama Pekerjaan / Usulan</th>
            <th style="width: 130px;">Lokasi</th>
            <th style="width: 140px;">Anggaran Disetujui</th>
            <th>Justifikasi / Urgensi</th>
          </tr>
        </thead>
        <tbody>
          ${
            approved.length === 0
              ? `<tr><td colspan="6" class="center" style="padding: 20px; font-style: italic;">Belum ada usulan yang disetujui untuk ${labelUnit}.</td></tr>`
              : approved
                  .map(
                    (p, idx) => `
                    <tr>
                      <td class="center">${idx + 1}</td>
                      <td>
                        <strong>${p.programName || '-'}</strong>
                        <div style="font-size: 9pt; color: #555; margin-top: 2px;">${p.activityName || ''}</div>
                      </td>
                      <td><strong>${p.projectName || '-'}</strong></td>
                      <td>${p.location || '-'}</td>
                      <td class="number">${formatRupiah(p.estimatedBudget || 0)}</td>
                      <td>${p.justification || '-'}</td>
                    </tr>
                  `
                  )
                  .join('')
          }
        </tbody>
        ${
          approved.length > 0
            ? `
          <tfoot>
            <tr>
              <th colspan="4" style="text-align: right;">TOTAL ANGGARAN DISETUJUI :</th>
              <th class="number" style="background: #eef7f2;">${formatRupiah(totalApprovedBudget)}</th>
              <th></th>
            </tr>
          </tfoot>
          `
            : ''
        }
      </table>

      <div class="summary-box">
        <table>
          <tr>
            <td style="width: 250px;"><strong>Pagu Indikatif Wilayah/Bidang:</strong></td>
            <td>${formatRupiah(pagu)}</td>
          </tr>
          <tr>
            <td><strong>Total Anggaran Usulan Disetujui:</strong></td>
            <td><strong>${formatRupiah(totalApprovedBudget)}</strong></td>
          </tr>
          <tr>
            <td><strong>Sisa / Selisih Pagu:</strong></td>
            <td style="color: ${pagu - totalApprovedBudget < 0 ? '#b91c1c' : '#15803d'}; font-weight: bold;">
              ${formatRupiah(pagu - totalApprovedBudget)}
            </td>
          </tr>
        </table>
      </div>

      <div class="signatures">
        <div class="sig-block">
          <p>Mengetahui / Menyetujui,<br>Kepala Bagian / Pimpinan Unit ${unitName}</p>
          <div class="sig-space"></div>
          <p class="sig-name">( ................................................ )</p>
          <p style="font-size: 9pt; margin-top: 2px;">NIP. ........................................</p>
        </div>
        <div class="sig-block">
          <p>Mbay, ${dateStr}<br>Tim Verifikator Rencana Kerja / DPUPR</p>
          <div class="sig-space"></div>
          <p class="sig-name">( ................................................ )</p>
          <p style="font-size: 9pt; margin-top: 2px;">NIP. ........................................</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=1000,height=700');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};

export const printRekapanSiapSIPD = (
  proposals: any[],
  filterTitle: string = 'Seluruh Wilayah & Bidang'
) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const totalBudget = proposals.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);

  const getSipdBadgeText = (status?: string) => {
    switch (status) {
      case 'siap_sipd': return 'SIAP INPUT SIPD';
      case 'sudah_sipd': return 'TERDAFTAR DI SIPD';
      case 'ditolak_sipd': return 'DITOLAK / TIDAK LAYAK';
      default: return 'BELUM TERVERIFIKASI';
    }
  };

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Filterisasi Usulan Siap SIPD - Kab. Nagekeo</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body {
          font-family: 'Arial', sans-serif;
          color: #111;
          margin: 0;
          padding: 15px;
          line-height: 1.35;
        }
        .header {
          text-align: center;
          border-bottom: 3px double #111;
          padding-bottom: 12px;
          margin-bottom: 15px;
        }
        .header h1 {
          font-size: 15pt;
          margin: 0 0 4px 0;
          text-transform: uppercase;
        }
        .header h2 {
          font-size: 12pt;
          margin: 0;
          font-weight: bold;
          color: #1e3a8a;
        }
        .header p {
          font-size: 9.5pt;
          margin: 4px 0 0 0;
          color: #444;
        }
        .meta-table {
          width: 100%;
          margin-bottom: 12px;
          font-size: 10pt;
        }
        .meta-table td {
          padding: 2px 0;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 9pt;
        }
        .data-table th, .data-table td {
          border: 1px solid #444;
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
        }
        .data-table th {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: center;
          font-size: 9pt;
        }
        .data-table td.number {
          text-align: right;
          font-weight: 600;
          white-space: nowrap;
        }
        .data-table td.center {
          text-align: center;
        }
        .badge {
          display: inline-block;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 8pt;
          font-weight: bold;
          text-align: center;
        }
        .badge-siap { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .badge-sudah { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        .badge-draft { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
        .badge-tolak { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .signatures {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sig-block {
          width: 35%;
          text-align: center;
          font-size: 10pt;
        }
        .sig-space {
          height: 60px;
        }
        .sig-name {
          font-weight: bold;
          text-decoration: underline;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PEMERINTAH KABUPATEN NAGEKEO</h1>
        <h2>REKAPITULASI HASIL FILTERISASI USULAN SEBELUM INPUT SIPD RI</h2>
        <p>Instrumen Verifikasi Teknis & Penampung Usulan Perencanaan &bull; Filter: <strong>${filterTitle}</strong></p>
      </div>

      <table class="meta-table">
        <tr>
          <td style="width: 140px; font-weight: bold;">Filter Wilayah / Kategori</td>
          <td>: ${filterTitle}</td>
          <td style="width: 120px; font-weight: bold;">Tanggal Cetak</td>
          <td>: ${dateStr}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Total Usulan Terfilter</td>
          <td>: <strong>${proposals.length} Usulan</strong></td>
          <td style="font-weight: bold;">Total Anggaran</td>
          <td>: <strong>${formatRupiah(totalBudget)}</strong></td>
        </tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 25px;">No.</th>
            <th style="width: 90px;">Sumber Usulan</th>
            <th style="width: 120px;">Kecamatan / Desa</th>
            <th style="width: 140px;">Pengusul / Pokir</th>
            <th>Program & Nama Usulan</th>
            <th style="width: 110px;">Estimasi Anggaran</th>
            <th style="width: 110px;">Status SIPD</th>
            <th style="width: 120px;">No Reg / Catatan</th>
          </tr>
        </thead>
        <tbody>
          ${
            proposals.length === 0
              ? `<tr><td colspan="8" class="center" style="padding: 20px; font-style: italic;">Tidak ada data usulan yang memenuhi kriteria filter.</td></tr>`
              : proposals
                  .map(
                    (p, idx) => {
                      const pengusulText = Array.isArray(p.pengusulPokir) && p.pengusulPokir.length > 0
                        ? p.pengusulPokir.join(', ')
                        : (p.submittedBy || '-');
                      const badgeClass = p.sipdStatus === 'siap_sipd' 
                        ? 'badge-siap' 
                        : p.sipdStatus === 'sudah_sipd' 
                        ? 'badge-sudah' 
                        : p.sipdStatus === 'ditolak_sipd' 
                        ? 'badge-tolak' 
                        : 'badge-draft';

                      return `
                        <tr>
                          <td class="center">${idx + 1}</td>
                          <td><strong>${p.sumberUsulan || p.jenisUsulan || 'Usulan Rencana'}</strong></td>
                          <td>
                            ${p.kecamatan ? `<strong>Kec. ${p.kecamatan}</strong>` : ''}
                            ${p.desa ? `<div style="font-size: 8.5pt; color: #475569;">${p.desa}</div>` : ''}
                            ${!p.kecamatan && !p.desa ? (p.location || '-') : ''}
                          </td>
                          <td>
                            <div style="font-weight: 600;">${pengusulText}</div>
                          </td>
                          <td>
                            <strong>${p.projectName || '-'}</strong>
                            ${p.programName ? `<div style="font-size: 8pt; color: #64748b;">Prog: ${p.programName}</div>` : ''}
                            ${p.activityName ? `<div style="font-size: 8pt; color: #64748b;">Keg: ${p.activityName}</div>` : ''}
                          </td>
                          <td class="number">${formatRupiah(p.estimatedBudget || 0)}</td>
                          <td class="center">
                            <span class="badge ${badgeClass}">${getSipdBadgeText(p.sipdStatus)}</span>
                          </td>
                          <td>
                            ${p.sipdRegistrationNo ? `<div><strong>ID: ${p.sipdRegistrationNo}</strong></div>` : ''}
                            <div style="font-size: 8pt; color: #475569;">${p.adminNotes || p.sipdNotes || '-'}</div>
                          </td>
                        </tr>
                      `;
                    }
                  )
                  .join('')
          }
        </tbody>
        ${
          proposals.length > 0
            ? `
          <tfoot>
            <tr>
              <th colspan="5" style="text-align: right;">TOTAL ESTIMASI ANGGARAN :</th>
              <th class="number" style="background: #eef7f2;">${formatRupiah(totalBudget)}</th>
              <th colspan="2"></th>
            </tr>
          </tfoot>
          `
            : ''
        }
      </table>

      <div class="signatures">
        <div class="sig-block">
          <p>Mengetahui,<br>Kepala Bapelitbangda / DPUPR<br>Kabupaten Nagekeo</p>
          <div class="sig-space"></div>
          <p class="sig-name">( ................................................ )</p>
          <p style="font-size: 8.5pt; margin-top: 2px;">NIP. ........................................</p>
        </div>
        <div class="sig-block">
          <p>Mbay, ${dateStr}<br>Tim Verifikator & Filterisasi SIPD<br>Kabupaten Nagekeo</p>
          <div class="sig-space"></div>
          <p class="sig-name">( ................................................ )</p>
          <p style="font-size: 8.5pt; margin-top: 2px;">NIP. ........................................</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=1100,height=750');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};

export const exportCsvSIPD = (proposals: any[], filename = 'rekap_usulan_siap_sipd.csv') => {
  const headers = [
    'No',
    'ID Usulan',
    'Tahun Usulan',
    'Sumber Usulan',
    'Kecamatan',
    'Desa / Kelurahan',
    'Pengusul / Anggota DPRD',
    'Nama Proyek / Usulan',
    'Nama Program',
    'Nama Kegiatan',
    'Lokasi',
    'Estimasi Anggaran (Rp)',
    'Justifikasi / Urgensi',
    'Status Evaluasi Teknis',
    'Status Kesiapan SIPD',
    'No Registrasi SIPD',
    'Catatan Filterisasi / Admin',
    'Pengirim / Email'
  ];

  const rows = proposals.map((p, idx) => {
    const pengusulText = Array.isArray(p.pengusulPokir) && p.pengusulPokir.length > 0
      ? p.pengusulPokir.join('; ')
      : (p.submittedBy || '');
    
    return [
      idx + 1,
      `"${(p.id || '').replace(/"/g, '""')}"`,
      `"${(p.tahunUsulan || '').replace(/"/g, '""')}"`,
      `"${(p.sumberUsulan || p.jenisUsulan || '').replace(/"/g, '""')}"`,
      `"${(p.kecamatan || '').replace(/"/g, '""')}"`,
      `"${(p.desa || '').replace(/"/g, '""')}"`,
      `"${pengusulText.replace(/"/g, '""')}"`,
      `"${(p.projectName || '').replace(/"/g, '""')}"`,
      `"${(p.programName || '').replace(/"/g, '""')}"`,
      `"${(p.activityName || '').replace(/"/g, '""')}"`,
      `"${(p.location || '').replace(/"/g, '""')}"`,
      p.estimatedBudget || 0,
      `"${(p.justification || '').replace(/"/g, '""')}"`,
      `"${(p.status || '').replace(/"/g, '""')}"`,
      `"${(p.sipdStatus || 'draft').replace(/"/g, '""')}"`,
      `"${(p.sipdRegistrationNo || '').replace(/"/g, '""')}"`,
      `"${(p.adminNotes || p.sipdNotes || '').replace(/"/g, '""')}"`,
      `"${(p.submittedBy || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printDokumenRenja = (
  programs: any[],
  subKegiatan: any[],
  proposals: any[],
  tahun: string = '2025'
) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const totalPaguRenja = subKegiatan.reduce((acc, s) => acc + (s.paguSubKegiatan || 0), 0);
  const linkedCount = proposals.filter(p => p.isAkomodirRenja).length;
  const linkedBudget = proposals.filter(p => p.isAkomodirRenja).reduce((acc, p) => acc + (p.renjaPaguAlokasi || p.estimatedBudget || 0), 0);

  const sumberDanaMap: Record<string, { total: number; count: number }> = {};
  subKegiatan.forEach(s => {
    const sd = s.sumberDana || 'DAU';
    if (!sumberDanaMap[sd]) sumberDanaMap[sd] = { total: 0, count: 0 };
    sumberDanaMap[sd].total += (s.paguSubKegiatan || 0);
    sumberDanaMap[sd].count += 1;
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Dokumen Rencana Kerja (RENJA) OPD - DPUPR Nagekeo</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: 'Arial', sans-serif; color: #111; margin: 0; padding: 15px; font-size: 9pt; }
        .header { text-align: center; border-bottom: 3px double #111; padding-bottom: 10px; margin-bottom: 12px; }
        .header h1 { font-size: 14pt; margin: 0 0 3px 0; text-transform: uppercase; }
        .header h2 { font-size: 12pt; margin: 0; color: #0f172a; }
        .header p { font-size: 9pt; margin: 3px 0 0 0; color: #555; }
        .meta-box { width: 100%; margin-bottom: 12px; font-size: 9pt; border-collapse: collapse; }
        .meta-box td { padding: 3px 5px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .data-table th, .data-table td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; }
        .data-table th { background: #f1f5f9; font-weight: bold; text-align: center; }
        .prog-row { background: #e2e8f0; font-weight: bold; }
        .number { text-align: right; font-weight: 600; white-space: nowrap; }
        .center { text-align: center; }
        .badge-urk { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 3px; font-size: 7.5pt; font-weight: bold; display: inline-block; }
        .signatures { margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-block { width: 35%; text-align: center; }
        .sig-space { height: 55px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PEMERINTAH KABUPATEN NAGEKEO</h1>
        <h2>DOKUMEN RENCANA KERJA PERANGKAT DAERAH (RENJA OPD)</h2>
        <p>Dinas Pekerjaan Umum dan Penataan Ruang &bull; Tahun Anggaran ${tahun}</p>
      </div>

      <table class="meta-box">
        <tr>
          <td style="width: 180px;"><strong>Urusan Pemerintahan</strong></td>
          <td>: 1. Pekerjaan Umum dan Penataan Ruang</td>
          <td style="width: 180px;"><strong>Total Pagu Renja</strong></td>
          <td>: <strong>${formatRupiah(totalPaguRenja)}</strong></td>
        </tr>
        <tr>
          <td><strong>Organisasi / OPD</strong></td>
          <td>: 1.03.01 Dinas Pekerjaan Umum dan Penataan Ruang</td>
          <td><strong>Usulan URK Terakomodir</strong></td>
          <td>: <strong>${linkedCount} Usulan (${formatRupiah(linkedBudget)})</strong></td>
        </tr>
      </table>

      <!-- I. Rekapitulasi Sumber Dana -->
      <div style="margin-bottom: 14px;">
        <h3 style="font-size: 9.5pt; margin: 0 0 5px 0; color: #0f172a; text-transform: uppercase;">
          I. Rekapitulasi Alokasi Pagu Indikatif Berdasarkan Sumber Dana
        </h3>
        <table class="data-table" style="margin-bottom: 8px; width: 75%;">
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th>Sumber Pendanaan</th>
              <th style="width: 130px;">Jumlah Sub-Kegiatan</th>
              <th style="width: 170px;">Total Pagu Alokasi (Rp)</th>
              <th style="width: 80px;">Proporsi</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(sumberDanaMap).length === 0 ? `
              <tr><td colspan="5" class="center" style="color: #666; font-style: italic;">Belum ada data sub-kegiatan</td></tr>
            ` : Object.entries(sumberDanaMap).map(([sd, data], idx) => {
              const pct = totalPaguRenja > 0 ? ((data.total / totalPaguRenja) * 100).toFixed(1) : '0.0';
              return `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td><strong>${sd}</strong></td>
                  <td class="center">${data.count} Sub-Kegiatan</td>
                  <td class="number">${formatRupiah(data.total)}</td>
                  <td class="center"><strong>${pct}%</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <th colspan="3" style="text-align: right;">TOTAL ALOKASI PAGU INDIKATIF :</th>
              <th class="number" style="background: #dcfce7;">${formatRupiah(totalPaguRenja)}</th>
              <th class="center">100%</th>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- II. Matriks Rincian Program & Sub-Kegiatan -->
      <h3 style="font-size: 9.5pt; margin: 0 0 5px 0; color: #0f172a; text-transform: uppercase;">
        II. Matriks Rincian Program dan Sub-Kegiatan RENJA
      </h3>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 100px;">Kode Rekening</th>
            <th>Program / Kegiatan / Sub-Kegiatan</th>
            <th style="width: 160px;">Indikator & Target Kinerja</th>
            <th style="width: 120px;">Lokasi</th>
            <th style="width: 80px;">Sumber Dana</th>
            <th style="width: 120px;">Pagu Anggaran (Rp)</th>
            <th style="width: 140px;">Usulan URK Terkait</th>
          </tr>
        </thead>
        <tbody>
          ${programs.map(prog => {
            const subs = subKegiatan.filter(s => s.programId === prog.id);
            const totalProgPagu = subs.reduce((a, b) => a + (b.paguSubKegiatan || 0), 0);
            return `
              <tr class="prog-row">
                <td>${prog.kodeProgram}</td>
                <td><strong>${prog.namaProgram}</strong> (Bidang: ${prog.bidangPengampu})</td>
                <td>${prog.indikatorKinerja}<br><small>Target: <strong>${prog.targetKinerja}</strong></small></td>
                <td>Kab. Nagekeo</td>
                <td class="center">-</td>
                <td class="number">${formatRupiah(totalProgPagu || prog.paguProgram)}</td>
                <td class="center">-</td>
              </tr>
              ${subs.map(sub => {
                const linked = proposals.filter(p => p.isAkomodirRenja && p.renjaSubKegiatanId === sub.id);
                return `
                  <tr>
                    <td style="padding-left: 12px;">${sub.kodeSubKegiatan}</td>
                    <td style="padding-left: 15px;">
                      <strong>${sub.namaSubKegiatan}</strong>
                      <div style="font-size: 8pt; color: #555;">Bidang: ${sub.bidangPengampu}</div>
                    </td>
                    <td>${sub.indikatorSubKegiatan}<br><small>Vol: <strong>${sub.targetVolume} ${sub.satuan || ''}</strong></small></td>
                    <td>${sub.lokasi || 'Nagekeo'}</td>
                    <td class="center"><strong>${sub.sumberDana || 'DAU'}</strong></td>
                    <td class="number">${formatRupiah(sub.paguSubKegiatan)}</td>
                    <td>
                      ${linked.length === 0 
                        ? '<span style="color:#94a3b8; font-size:8pt;">Renja Murni Dinas</span>' 
                        : linked.map(p => `
                            <div style="margin-bottom: 3px;">
                              <span class="badge-urk">${p.sumberUsulan || 'URK'}: ${p.projectName} (${formatRupiah(p.renjaPaguAlokasi || p.estimatedBudget)})</span>
                            </div>
                          `).join('')
                      }
                    </td>
                  </tr>
                `;
              }).join('')}
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #e2e8f0; font-weight: bold;">
            <th colspan="5" style="text-align: right;">TOTAL PAGU RENJA OPD :</th>
            <th class="number" style="background: #dcfce7;">${formatRupiah(totalPaguRenja)}</th>
            <th></th>
          </tr>
        </tfoot>
      </table>

      <div class="signatures">
        <div class="sig-block">
          <p>Mengesahkan,<br>Kepala Dinas Pekerjaan Umum dan Penataan Ruang<br>Kabupaten Nagekeo</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
        <div class="sig-block">
          <p>Mbay, ${dateStr}<br>Kepala Sub Bagian Program & Evaluasi<br>Dinas PUPR Kabupaten Nagekeo</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=1100,height=750');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};

export const printMatriksUrkRenja = (
  proposals: any[],
  filterTitle: string = 'Seluruh Wilayah / Usulan'
) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const totalUsulan = proposals.length;
  const totalBudget = proposals.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
  const linkedProposals = proposals.filter(p => p.isAkomodirRenja);
  const unlinkedProposals = proposals.filter(p => !p.isAkomodirRenja);

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Matriks Penyelarasan Keterkaitan e-URK ↔ RENJA OPD - DPUPR Nagekeo</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: 'Arial', sans-serif; color: #111; margin: 0; padding: 15px; font-size: 8.5pt; line-height: 1.3; }
        .header { text-align: center; border-bottom: 3px double #111; padding-bottom: 10px; margin-bottom: 12px; }
        .header h1 { font-size: 14pt; margin: 0 0 3px 0; text-transform: uppercase; }
        .header h2 { font-size: 11.5pt; margin: 0; color: #0f172a; }
        .header p { font-size: 9pt; margin: 3px 0 0 0; color: #555; }
        .meta-box { width: 100%; margin-bottom: 12px; font-size: 9pt; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .data-table th, .data-table td { border: 1px solid #333; padding: 5px 6px; vertical-align: top; }
        .data-table th { background: #f1f5f9; font-weight: bold; text-align: center; font-size: 8pt; }
        .number { text-align: right; font-weight: 600; white-space: nowrap; }
        .center { text-align: center; }
        .badge-akomodir { background: #dcfce7; color: #166534; border: 1px solid #86efac; padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 7.5pt; display: inline-block; }
        .badge-pending { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 7.5pt; display: inline-block; }
        .signatures { margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-block { width: 35%; text-align: center; }
        .sig-space { height: 50px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PEMERINTAH KABUPATEN NAGEKEO</h1>
        <h2>MATRIKS PENYELARASAN USULAN RENCANA KERJA (e-URK) ↔ RENJA OPD DINAS PUPR</h2>
        <p>Sinergi Aspirasi Musrenbang Desa/Kecamatan & POKIR DPRD dengan Dokumen Perencanaan Kerja Dinas PUPR</p>
      </div>

      <table class="meta-box">
        <tr>
          <td><strong>Filter Wilayah/Kategori</strong>: ${filterTitle}</td>
          <td><strong>Total Usulan Aspirasi</strong>: ${totalUsulan} Usulan (${formatRupiah(totalBudget)})</td>
        </tr>
        <tr>
          <td><strong>Status Keterkaitan</strong>: <span class="badge-akomodir">${linkedProposals.length} Terakomodir di RENJA</span> &nbsp;|&nbsp; <span class="badge-pending">${unlinkedProposals.length} Belum Diakomodir</span></td>
          <td><strong>Tanggal Matriks</strong>: ${dateStr}</td>
        </tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="2" style="width: 25px;">No.</th>
            <th colspan="4" style="background: #e0f2fe; color: #0369a1;">DATA USULAN RENCANA KERJA (e-URK)</th>
            <th colspan="3" style="background: #fef3c7; color: #92400e;">INTEGRASI KE DALAM RENJA PERANGKAT DAERAH (OPD)</th>
            <th rowspan="2" style="width: 100px;">Status SIPD & Catatan</th>
          </tr>
          <tr>
            <th style="width: 90px; background: #e0f2fe;">Sumber & Pengusul</th>
            <th style="width: 90px; background: #e0f2fe;">Lokasi (Kec/Desa)</th>
            <th style="background: #e0f2fe;">Nama Usulan / Pekerjaan</th>
            <th style="width: 90px; background: #e0f2fe;">Pagu Usulan (Rp)</th>
            <th style="background: #fef3c7;">Program Renja Dinas</th>
            <th style="background: #fef3c7;">Sub-Kegiatan Renja Terkait</th>
            <th style="width: 90px; background: #fef3c7;">Alokasi Renja (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${proposals.map((p, idx) => {
            const pengusulText = Array.isArray(p.pengusulPokir) && p.pengusulPokir.length > 0 
              ? p.pengusulPokir.join(', ') 
              : (p.submittedBy || '-');

            return `
              <tr>
                <td class="center">${idx + 1}</td>
                <td>
                  <strong>${p.sumberUsulan || p.jenisUsulan || 'URK'}</strong>
                  <div style="font-size: 7.5pt; color: #555;">${pengusulText}</div>
                </td>
                <td>
                  <strong>${p.kecamatan || '-'}</strong>
                  <div style="font-size: 7.5pt; color: #555;">${p.desa || p.location || '-'}</div>
                </td>
                <td>
                  <strong>${p.projectName || '-'}</strong>
                  <div style="font-size: 7.5pt; color: #64748b; font-style: italic;">${p.justification || ''}</div>
                </td>
                <td class="number">${formatRupiah(p.estimatedBudget || 0)}</td>
                <td>
                  ${p.isAkomodirRenja && p.renjaProgramName 
                    ? `<strong>${p.renjaProgramName}</strong>` 
                    : '<span style="color: #94a3b8; font-style: italic;">- Belum dipetakan -</span>'}
                </td>
                <td>
                  ${p.isAkomodirRenja && p.renjaSubKegiatanName
                    ? `<div><span class="badge-akomodir">TERAKOMODIR</span></div><strong>${p.renjaSubKegiatanName}</strong>`
                    : `<div><span class="badge-pending">BELUM DIAKOMODIR</span></div><span style="font-size:7.5pt; color:#64748b;">Aspirasi ditampung di Bank Data URK</span>`}
                </td>
                <td class="number">
                  ${p.isAkomodirRenja ? formatRupiah(p.renjaPaguAlokasi || p.estimatedBudget || 0) : '-'}
                </td>
                <td>
                  <div style="font-weight: 600;">${(p.sipdStatus || 'draft').toUpperCase()}</div>
                  <div style="font-size: 7.5pt; color: #555;">${p.catatanAkomodasiRenja || p.adminNotes || '-'}</div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-block">
          <p>Mengetahui,<br>Kepala Bapelitbangda Kabupaten Nagekeo</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
        <div class="sig-block">
          <p>Mbay, ${dateStr}<br>Kepala Dinas Pekerjaan Umum dan Penataan Ruang</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=1100,height=750');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};

// =========================================================
// CETAK LAPORAN REALISASI DPA (DOKUMEN PELAKSANAAN ANGGARAN)
// =========================================================
export const printDokumenDpa = (
  dpaList: any[],
  sppdList: any[],
  filterBidang: string = 'Semua',
  tahun: string = '2025'
) => {
  const filteredDpa = dpaList.filter(d => filterBidang === 'Semua' || d.bidangPengampu === filterBidang);
  const totalPagu = filteredDpa.reduce((acc, d) => acc + (d.paguDpa || 0), 0);
  const totalRealisasi = filteredDpa.reduce((acc, d) => acc + (d.realisasiKeuangan || 0), 0);
  const sisaPagu = totalPagu - totalRealisasi;
  const persentaseRealisasi = totalPagu > 0 ? ((totalRealisasi / totalPagu) * 100).toFixed(2) : '0.00';

  // Hitung total SPPD terkait
  const filteredSppd = sppdList.filter(s => filterBidang === 'Semua' || s.bidangPengampu === filterBidang);
  const totalSppdTerpakai = filteredSppd.reduce((acc, s) => acc + (s.totalBiaya || 0), 0);

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Realisasi DPA - Dinas PUPR Nagekeo</title>
      <style>
        @page { size: landscape; margin: 12mm; }
        body { font-family: 'Arial', sans-serif; font-size: 8.5pt; color: #1e293b; line-height: 1.3; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { font-size: 13pt; margin: 0; text-transform: uppercase; font-weight: bold; }
        .header h2 { font-size: 10.5pt; margin: 2px 0; text-transform: uppercase; }
        .header p { font-size: 8.5pt; margin: 0; color: #475569; }
        .meta-box { width: 100%; border-collapse: collapse; margin-bottom: 12px; background: #f8fafc; border: 1px solid #cbd5e1; }
        .meta-box td { padding: 6px 10px; font-size: 8.5pt; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .data-table th, .data-table td { border: 1px solid #64748b; padding: 5px 6px; font-size: 8pt; vertical-align: top; }
        .data-table th { background-color: #0284c7; color: #ffffff; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 7.5pt; }
        .number { text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }
        .center { text-align: center; }
        .progress-bar-bg { width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden; margin-top: 3px; }
        .progress-bar-fill { height: 100%; background: #10b981; }
        .signatures { display: flex; justify-content: space-between; margin-top: 25px; page-break-inside: avoid; }
        .sig-block { width: 45%; text-align: center; }
        .sig-space { height: 55px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PEMERINTAH KABUPATEN NAGEKEO</h1>
        <h2>DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</h2>
        <p>LAPORAN REALISASI DOKUMEN PELAKSANAAN ANGGARAN (DPA) TAHUN ANGGARAN ${tahun}</p>
      </div>

      <table class="meta-box">
        <tr>
          <td><strong>Unit Organisasi</strong>: Dinas Pekerjaan Umum dan Penataan Ruang</td>
          <td><strong>Total Pagu DPA</strong>: <span style="font-weight:bold; color:#0369a1;">${formatRupiah(totalPagu)}</span></td>
        </tr>
        <tr>
          <td><strong>Bidang Teknis</strong>: ${filterBidang === 'Semua' ? 'Seluruh Bidang DPUPR' : filterBidang}</td>
          <td><strong>Total Realisasi Keuangan</strong>: <span style="font-weight:bold; color:#15803d;">${formatRupiah(totalRealisasi)} (${persentaseRealisasi}%)</span></td>
        </tr>
        <tr>
          <td><strong>Sisa Anggaran (Silpa)</strong>: <span style="font-weight:bold; color:#b91c1c;">${formatRupiah(sisaPagu)}</span></td>
          <td><strong>Total Realisasi SPPD</strong>: <span style="font-weight:bold; color:#b45309;">${formatRupiah(totalSppdTerpakai)} (${filteredSppd.length} SPT)</span></td>
        </tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 25px;">No.</th>
            <th style="width: 100px;">Kode Sub-Kegiatan</th>
            <th>Program / Sub-Kegiatan DPA</th>
            <th style="width: 70px;">Bidang</th>
            <th style="width: 75px;">Sumber Dana</th>
            <th style="width: 95px;">Pagu DPA (Rp)</th>
            <th style="width: 95px;">Realisasi (Rp)</th>
            <th style="width: 50px;">Fisik (%)</th>
            <th style="width: 95px;">Sisa Pagu (Rp)</th>
            <th style="width: 85px;">SPPD Terpakai (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${filteredDpa.length === 0 ? `
            <tr><td colspan="10" class="center" style="color: #64748b; font-style: italic; padding: 20px;">Belum ada data DPA pada filter ini</td></tr>
          ` : filteredDpa.map((item, idx) => {
            const itemSppd = filteredSppd.filter(s => s.dpaItemId === item.id || s.kodeSubKegiatan === item.kodeSubKegiatan);
            const totalItemSppd = itemSppd.reduce((a, b) => a + (b.totalBiaya || 0), 0);
            const itemSisa = (item.paguDpa || 0) - (item.realisasiKeuangan || 0);
            const persen = item.paguDpa > 0 ? ((item.realisasiKeuangan / item.paguDpa) * 100).toFixed(1) : '0';

            return `
              <tr>
                <td class="center">${idx + 1}</td>
                <td style="font-family: monospace; font-size: 7.5pt;">${item.kodeSubKegiatan}</td>
                <td>
                  <strong>${item.namaSubKegiatan}</strong>
                  <div style="font-size: 7.5pt; color: #64748b;">${item.nomorDpa || '-'} ${item.targetKinerja ? `| Target: ${item.targetKinerja}` : ''}</div>
                </td>
                <td class="center font-bold"><strong>${item.bidangPengampu}</strong></td>
                <td class="center"><span style="background: #e2e8f0; padding: 2px 4px; border-radius: 3px; font-weight: 600;">${item.sumberDana}</span></td>
                <td class="number">${formatRupiah(item.paguDpa || 0)}</td>
                <td class="number" style="color: #15803d;">
                  ${formatRupiah(item.realisasiKeuangan || 0)}
                  <div style="font-size: 7pt; color: #475569;">(${persen}%)</div>
                </td>
                <td class="center">
                  <strong>${item.realisasiFisik || 0}%</strong>
                  <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${Math.min(100, item.realisasiFisik || 0)}%;"></div></div>
                </td>
                <td class="number" style="color: ${itemSisa < 0 ? '#b91c1c' : '#334155'}; font-weight: bold;">
                  ${formatRupiah(itemSisa)}
                </td>
                <td class="number" style="color: #b45309;">
                  ${formatRupiah(totalItemSppd)}
                  <div style="font-size: 7pt; color: #64748b;">${itemSppd.length} SPT</div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: bold;">
            <th colspan="5" style="text-align: right; background: #e2e8f0; color: #0f172a;">JUMLAH TOTAL :</th>
            <th class="number" style="background: #e0f2fe; color: #0369a1;">${formatRupiah(totalPagu)}</th>
            <th class="number" style="background: #dcfce7; color: #15803d;">${formatRupiah(totalRealisasi)}</th>
            <th class="center" style="background: #e2e8f0; color: #0f172a;">${persentaseRealisasi}%</th>
            <th class="number" style="background: #fee2e2; color: #b91c1c;">${formatRupiah(sisaPagu)}</th>
            <th class="number" style="background: #fef3c7; color: #b45309;">${formatRupiah(totalSppdTerpakai)}</th>
          </tr>
        </tfoot>
      </table>

      <div class="signatures">
        <div class="sig-block">
          <p>Mengetahui,<br>Pejabat Pembuat Komitmen (PPK) / Pengelola Anggaran</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
        <div class="sig-block">
          <p>Mbay, ${dateStr}<br>Kepala Dinas Pekerjaan Umum dan Penataan Ruang<br>Kabupaten Nagekeo</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=1100,height=750');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};

// =========================================================
// CETAK REKAPITULASI BIAYA SPPD (PERJALANAN DINAS)
// =========================================================
export const printRekapSppd = (
  sppdList: any[],
  filterBidang: string = 'Semua',
  tahun: string = '2025'
) => {
  const filteredSppd = sppdList.filter(s => filterBidang === 'Semua' || s.bidangPengampu === filterBidang);
  const totalBiaya = filteredSppd.reduce((acc, s) => acc + (s.totalBiaya || 0), 0);
  const totalDalamDaerah = filteredSppd.filter(s => s.jenisPerjalanan === 'Dalam Daerah').reduce((acc, s) => acc + (s.totalBiaya || 0), 0);
  const totalLuarDaerah = filteredSppd.filter(s => s.jenisPerjalanan === 'Luar Daerah').reduce((acc, s) => acc + (s.totalBiaya || 0), 0);

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rekapitulasi SPPD - Dinas PUPR Nagekeo</title>
      <style>
        @page { size: landscape; margin: 10mm; }
        body { font-family: 'Arial', sans-serif; font-size: 8pt; color: #1e293b; line-height: 1.25; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { font-size: 12pt; margin: 0; text-transform: uppercase; font-weight: bold; }
        .header h2 { font-size: 10pt; margin: 2px 0; text-transform: uppercase; }
        .header p { font-size: 8pt; margin: 0; color: #475569; }
        .summary-grid { display: flex; gap: 10px; margin-bottom: 12px; }
        .summary-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; background: #f8fafc; }
        .summary-title { font-size: 7.5pt; color: #64748b; text-transform: uppercase; font-weight: bold; }
        .summary-val { font-size: 11pt; font-weight: bold; color: #0f172a; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .data-table th, .data-table td { border: 1px solid #94a3b8; padding: 4px 5px; font-size: 7.5pt; vertical-align: top; }
        .data-table th { background-color: #0f766e; color: #ffffff; font-weight: bold; text-align: center; text-transform: uppercase; }
        .number { text-align: right; font-family: 'Courier New', monospace; font-weight: bold; }
        .center { text-align: center; }
        .badge { display: inline-block; padding: 2px 5px; border-radius: 4px; font-size: 7pt; font-weight: bold; }
        .badge-dalam { background: #e0f2fe; color: #0369a1; }
        .badge-luar { background: #fef3c7; color: #92400e; }
        .signatures { display: flex; justify-content: space-between; margin-top: 25px; page-break-inside: avoid; }
        .sig-block { width: 45%; text-align: center; }
        .sig-space { height: 50px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PEMERINTAH KABUPATEN NAGEKEO</h1>
        <h2>DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</h2>
        <p>REKAPITULASI SURAT PERINTAH PERJALANAN DINAS (SPPD) TAHUN ANGGARAN ${tahun}</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-title">Total SPPD Terbit</div>
          <div class="summary-val">${filteredSppd.length} Dokumen SPT</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Perjalanan Dalam Daerah</div>
          <div class="summary-val" style="color:#0369a1;">${formatRupiah(totalDalamDaerah)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Perjalanan Luar Daerah</div>
          <div class="summary-val" style="color:#b45309;">${formatRupiah(totalLuarDaerah)}</div>
        </div>
        <div class="summary-card" style="background:#ecfdf5; border-color:#6ee7b7;">
          <div class="summary-title">Total Realisasi Anggaran SPPD</div>
          <div class="summary-val" style="color:#047857;">${formatRupiah(totalBiaya)}</div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 20px;">No.</th>
            <th style="width: 90px;">No. SPT / SPPD</th>
            <th style="width: 110px;">Nama Pelaksana / NIP</th>
            <th style="width: 60px;">Bidang</th>
            <th>Maksud Perjalanan & Sub-Kegiatan</th>
            <th style="width: 80px;">Tujuan & Jenis</th>
            <th style="width: 75px;">Tgl / Lama</th>
            <th style="width: 70px;">Uang Harian</th>
            <th style="width: 70px;">Transport</th>
            <th style="width: 70px;">Penginapan/Riil</th>
            <th style="width: 85px;">Total Biaya (Rp)</th>
            <th style="width: 65px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredSppd.length === 0 ? `
            <tr><td colspan="12" class="center" style="color: #64748b; font-style: italic; padding: 20px;">Tidak ada catatan SPPD pada filter ini</td></tr>
          ` : filteredSppd.map((s, idx) => `
            <tr>
              <td class="center">${idx + 1}</td>
              <td>
                <strong>${s.nomorSpt || '-'}</strong>
                <div style="font-size: 6.5pt; color: #64748b;">${s.nomorSppd || '-'}</div>
              </td>
              <td>
                <strong>${s.namaPelaksana}</strong>
                <div style="font-size: 6.5pt; color: #475569;">${s.nipPelaksana ? `NIP. ${s.nipPelaksana}` : (s.jabatan || '-')}</div>
              </td>
              <td class="center font-bold">${s.bidangPengampu}</td>
              <td>
                <strong>${s.maksudPerjalanan}</strong>
                <div style="font-size: 6.5pt; color: #0284c7;">Sub-Keg: ${s.namaSubKegiatan || s.kodeSubKegiatan || '-'} (${s.sumberDana || 'DAU'})</div>
              </td>
              <td>
                <strong>${s.lokasiTujuan}</strong>
                <div><span class="badge ${s.jenisPerjalanan === 'Dalam Daerah' ? 'badge-dalam' : 'badge-luar'}">${s.jenisPerjalanan}</span></div>
              </td>
              <td class="center">
                ${s.tanggalBerangkat}<br>
                <span style="font-weight: bold; color: #0f766e;">(${s.lamaHari || 1} Hari)</span>
              </td>
              <td class="number">${formatRupiah(s.biayaUangHarian || 0)}</td>
              <td class="number">${formatRupiah(s.biayaTransport || 0)}</td>
              <td class="number">${formatRupiah((s.biayaPenginapan || 0) + (s.biayaLainnya || 0))}</td>
              <td class="number" style="color: #047857;">${formatRupiah(s.totalBiaya || 0)}</td>
              <td class="center">
                <span style="font-weight: bold; font-size: 7pt; color: ${s.statusPencairan === 'Cair (SP2D)' ? '#15803d' : '#b45309'};">
                  ${s.statusPencairan || 'Draft'}
                </span>
                ${s.noSp2d ? `<div style="font-size: 6pt; color: #64748b;">${s.noSp2d}</div>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #e2e8f0; font-weight: bold;">
            <th colspan="10" style="text-align: right; color: #0f172a;">TOTAL PENGELUARAN SPPD :</th>
            <th class="number" style="background: #ccfbf1; color: #0f766e; font-size: 8.5pt;">${formatRupiah(totalBiaya)}</th>
            <th></th>
          </tr>
        </tfoot>
      </table>

      <div class="signatures">
        <div class="sig-block">
          <p>Bendahara Pengeluaran Dinas PUPR</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
        <div class="sig-block">
          <p>Mbay, ${dateStr}<br>Pengguna Anggaran / Kepala Dinas</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=1100,height=750');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};

// =========================================================
// CETAK RINCIAN BIAYA SPPD & KUITANSI PERORANGAN
// =========================================================
export const printRincianSppd = (sppd: any) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rincian Biaya Perjalanan Dinas - ${sppd.namaPelaksana}</title>
      <style>
        @page { size: portrait; margin: 15mm; }
        body { font-family: 'Arial', sans-serif; font-size: 9pt; color: #1e293b; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; }
        .header h1 { font-size: 12pt; margin: 0; text-transform: uppercase; font-weight: bold; }
        .header h2 { font-size: 10.5pt; margin: 3px 0; text-transform: uppercase; }
        .header p { font-size: 8.5pt; margin: 0; color: #475569; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .meta-table td { padding: 4px 6px; font-size: 9pt; vertical-align: top; }
        .table-biaya { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-biaya th, .table-biaya td { border: 1px solid #334155; padding: 6px 8px; font-size: 9pt; }
        .table-biaya th { background: #f1f5f9; font-weight: bold; text-align: center; text-transform: uppercase; }
        .number { text-align: right; font-family: 'Courier New', monospace; font-weight: bold; }
        .signatures { display: flex; justify-content: space-between; margin-top: 30px; page-break-inside: avoid; }
        .sig-block { width: 45%; text-align: center; font-size: 9pt; }
        .sig-space { height: 60px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PEMERINTAH KABUPATEN NAGEKEO</h1>
        <h2>DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</h2>
        <p>RINCIAN BIAYA PERJALANAN DINAS (LAMPIRAN SPPD)</p>
      </div>

      <table class="meta-table">
        <tr>
          <td style="width: 180px;">Lampiran SPPD Nomor</td>
          <td style="width: 10px;">:</td>
          <td><strong>${sppd.nomorSppd || '-'}</strong></td>
        </tr>
        <tr>
          <td>Nomor Surat Perintah Tugas</td>
          <td>:</td>
          <td>${sppd.nomorSpt || '-'}</td>
        </tr>
        <tr>
          <td>Tanggal Berangkat / Kembali</td>
          <td>:</td>
          <td>${sppd.tanggalBerangkat} s/d ${sppd.tanggalKembali} (${sppd.lamaHari || 1} Hari)</td>
        </tr>
      </table>

      <table class="table-biaya">
        <thead>
          <tr>
            <th style="width: 30px;">No.</th>
            <th>Perincian Biaya</th>
            <th style="width: 140px;">Jumlah (Rp)</th>
            <th style="width: 160px;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td>
              <strong>Uang Harian Perjalanan Dinas</strong>
              <div style="font-size: 8pt; color: #555;">${sppd.lamaHari || 1} hari x Uang Harian Standar SSH</div>
            </td>
            <td class="number">${formatRupiah(sppd.biayaUangHarian || 0)}</td>
            <td>${sppd.jenisPerjalanan}</td>
          </tr>
          <tr>
            <td style="text-align: center;">2</td>
            <td>
              <strong>Biaya Transportasi / Tiket</strong>
              <div style="font-size: 8pt; color: #555;">BBM / Sewa Kendaraan / Tiket Perjalanan</div>
            </td>
            <td class="number">${formatRupiah(sppd.biayaTransport || 0)}</td>
            <td>Tujuan: ${sppd.lokasiTujuan}</td>
          </tr>
          <tr>
            <td style="text-align: center;">3</td>
            <td>
              <strong>Biaya Penginapan / Hotel</strong>
              <div style="font-size: 8pt; color: #555;">Akomodasi Tempat Tinggal</div>
            </td>
            <td class="number">${formatRupiah(sppd.biayaPenginapan || 0)}</td>
            <td>${sppd.biayaPenginapan ? 'Sesuai Bukti Riil' : '-'}</td>
          </tr>
          <tr>
            <td style="text-align: center;">4</td>
            <td>
              <strong>Biaya Lain-lain / Pengeluaran Riil</strong>
              <div style="font-size: 8pt; color: #555;">Representasi / Tol / Retribusi / Parkir</div>
            </td>
            <td class="number">${formatRupiah(sppd.biayaLainnya || 0)}</td>
            <td>${sppd.catatan || '-'}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="2" style="text-align: right;">JUMLAH TOTAL :</td>
            <td class="number" style="background: #dcfce7; color: #15803d; font-size: 10pt;">${formatRupiah(sppd.totalBiaya || 0)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div style="font-size: 8.5pt; margin-top: 10px; padding: 8px; border: 1px dashed #94a3b8; background: #fafafa;">
        <strong>Beban Anggaran:</strong> Sub-Kegiatan <em>"${sppd.namaSubKegiatan || sppd.kodeSubKegiatan || '-'}"</em>, Bidang <strong>${sppd.bidangPengampu}</strong>, Sumber Dana <strong>${sppd.sumberDana || 'DAU'}</strong>.
      </div>

      <div class="signatures">
        <div class="sig-block">
          <p>Telah dibayar sejumlah<br><strong>${formatRupiah(sppd.totalBiaya || 0)}</strong><br><br>Bendahara Pengeluaran,</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
        <div class="sig-block">
          <p>Mbay, ${dateStr}<br>Telah menerima jumlah uang sebesar<br><strong>${formatRupiah(sppd.totalBiaya || 0)}</strong><br><br>Yang Menerima / Pelaksana,</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">${sppd.namaPelaksana}</p>
          <p>${sppd.nipPelaksana ? `NIP. ${sppd.nipPelaksana}` : (sppd.jabatan || 'Pelaksana Tugas')}</p>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=850,height=750');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};

/**
 * Cetak Dokumen Rekapitulasi & Berita Acara Skala Prioritas Usulan PUPR Nagekeo
 */
export const printRekapitulasiPrioritas = (
  proposals: any[],
  tahun: string = '2025',
  paguTersedia: number = 0
) => {
  const sorted = [...proposals].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  const totalBudget = sorted.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
  
  const countP1 = sorted.filter(p => p.priorityLevel === 'P1').length;
  const budgetP1 = sorted.filter(p => p.priorityLevel === 'P1').reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
  const countP2 = sorted.filter(p => p.priorityLevel === 'P2').length;
  const budgetP2 = sorted.filter(p => p.priorityLevel === 'P2').reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
  const countP3 = sorted.filter(p => p.priorityLevel === 'P3').length;
  const budgetP3 = sorted.filter(p => p.priorityLevel === 'P3').reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
  const countP4 = sorted.filter(p => p.priorityLevel === 'P4' || !p.priorityLevel).length;
  const budgetP4 = sorted.filter(p => p.priorityLevel === 'P4' || !p.priorityLevel).reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rekapitulasi Skala Prioritas Usulan e-URK - DPUPR Nagekeo</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: 'Arial', sans-serif; font-size: 8pt; color: #0f172a; line-height: 1.3; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { font-size: 13pt; margin: 0; text-transform: uppercase; font-weight: bold; }
        .header h2 { font-size: 11pt; margin: 3px 0; text-transform: uppercase; }
        .header p { font-size: 8.5pt; margin: 0; color: #475569; }
        
        .summary-grid { display: flex; gap: 8px; margin-bottom: 12px; }
        .summary-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; background: #f8fafc; }
        .summary-title { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b; }
        .summary-val { font-size: 10pt; font-weight: bold; margin-top: 2px; }
        .p1 { border-left: 4px solid #ef4444; }
        .p2 { border-left: 4px solid #f59e0b; }
        .p3 { border-left: 4px solid #3b82f6; }
        .p4 { border-left: 4px solid #64748b; }

        .table-data { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 7.5pt; }
        .table-data th, .table-data td { border: 1px solid #94a3b8; padding: 4px 6px; vertical-align: top; }
        .table-data th { background: #f1f5f9; font-weight: bold; text-align: center; text-transform: uppercase; }
        .number { text-align: right; font-family: 'Courier New', monospace; font-weight: bold; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 7pt; }
        .badge-p1 { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .badge-p2 { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
        .badge-p3 { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        .badge-p4 { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }

        .signatures { display: flex; justify-content: space-between; margin-top: 20px; page-break-inside: avoid; }
        .sig-block { width: 40%; text-align: center; font-size: 8pt; }
        .sig-space { height: 50px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PEMERINTAH KABUPATEN NAGEKEO</h1>
        <h2>DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</h2>
        <p>REKAPITULASI & PENETAPAN SKALA PRIORITAS USULAN (e-URK KE DALAM RENJA & DPA ${tahun})</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card p1">
          <div class="summary-title">Prioritas 1 (Utama / Mendesak)</div>
          <div class="summary-val text-red-600">${countP1} Usulan &bull; ${formatRupiah(budgetP1)}</div>
        </div>
        <div class="summary-card p2">
          <div class="summary-title">Prioritas 2 (Tinggi)</div>
          <div class="summary-val text-amber-600">${countP2} Usulan &bull; ${formatRupiah(budgetP2)}</div>
        </div>
        <div class="summary-card p3">
          <div class="summary-title">Prioritas 3 (Sedang)</div>
          <div class="summary-val text-blue-600">${countP3} Usulan &bull; ${formatRupiah(budgetP3)}</div>
        </div>
        <div class="summary-card p4">
          <div class="summary-title">Prioritas 4 (Cadangan)</div>
          <div class="summary-val text-slate-600">${countP4} Usulan &bull; ${formatRupiah(budgetP4)}</div>
        </div>
      </div>

      <table class="table-data">
        <thead>
          <tr>
            <th style="width: 25px;">Rank</th>
            <th style="width: 70px;">Skala Prioritas</th>
            <th style="width: 45px;">Skor</th>
            <th>Program / Nama Pekerjaan Fisik</th>
            <th style="width: 140px;">Lokasi (Desa/Kecamatan)</th>
            <th style="width: 90px;">Sumber Usulan</th>
            <th style="width: 100px;">Kebutuhan Anggaran</th>
            <th style="width: 130px;">Rekomendasi Pelaksanaan</th>
            <th style="width: 150px;">Justifikasi Teknis</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((p, idx) => {
            const pLevel = p.priorityLevel || 'P4';
            const badgeClass = pLevel === 'P1' ? 'badge-p1' : pLevel === 'P2' ? 'badge-p2' : pLevel === 'P3' ? 'badge-p3' : 'badge-p4';
            const phase = pLevel === 'P1' ? 'Tahap 1 (Mendesak/Utama)' : pLevel === 'P2' ? 'Tahap 2 (Prioritas Standar)' : pLevel === 'P3' ? 'Tahap 3 (Jadwal Reguler)' : 'Tahap 4 (Cadangan/Perubahan)';
            
            return `
              <tr>
                <td style="text-align: center; font-weight: bold;">#${idx + 1}</td>
                <td style="text-align: center;"><span class="badge ${badgeClass}">${pLevel}</span></td>
                <td style="text-align: center; font-weight: bold; font-family: monospace;">${p.priorityScore || '-'}</td>
                <td>
                  <strong>${p.projectName || '-'}</strong>
                  <div style="color: #64748b; font-size: 7pt;">${p.programName || p.activityName || ''}</div>
                </td>
                <td>${p.desa ? `Desa ${p.desa}, ` : ''}${p.kecamatan ? `Kec. ${p.kecamatan}` : p.location || '-'}</td>
                <td>${p.sumberUsulan || '-'}</td>
                <td class="number">${formatRupiah(p.estimatedBudget || 0)}</td>
                <td style="font-weight: 600;">${phase}</td>
                <td>${p.priorityCriteria?.justifikasiTeknis || p.justification || '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="6" style="text-align: right;">TOTAL KEBUTUHAN ANGGARAN (${sorted.length} USULAN) :</td>
            <td class="number" style="background: #dcfce7; color: #15803d;">${formatRupiah(totalBudget)}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>

      <div class="signatures">
        <div class="sig-block">
          <p>Mengetahui,<br>Kepala Dinas PUPR Kabupaten Nagekeo</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
        <div class="sig-block">
          <p>Mbay, ${dateStr}<br>Tim Verifikator Perencanaan & Evaluasi (URK)</p>
          <div class="sig-space"></div>
          <p style="font-weight: bold; text-decoration: underline;">( ................................................ )</p>
          <p>NIP. ........................................</p>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=1100,height=800');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};

/**
 * Ekspor Rekapitulasi Skala Prioritas ke CSV
 */
export const exportCsvPrioritas = (proposals: any[], tahun: string = '2025') => {
  const sorted = [...proposals].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  
  const headers = [
    'Ranking',
    'Skala Prioritas',
    'Total Skor',
    'Urgensi (30%)',
    'Kesiapan Dokumen (25%)',
    'Dampak Manfaat (25%)',
    'Keselarasan RPJMD (20%)',
    'Nama Usulan',
    'Program / Sub Kegiatan',
    'Kecamatan',
    'Desa / Kelurahan',
    'Sumber Aspirasi',
    'Kebutuhan Anggaran (Rp)',
    'Rekomendasi Pelaksanaan',
    'Justifikasi Teknis',
    'Penilai',
    'Tanggal Penilaian'
  ];

  const rows = sorted.map((p, idx) => {
    const pLevel = p.priorityLevel || 'P4';
    const c = p.priorityCriteria;
    const phase = pLevel === 'P1' ? 'Tahap 1 (Mendesak/Utama)' : pLevel === 'P2' ? 'Tahap 2 (Prioritas Standar)' : pLevel === 'P3' ? 'Tahap 3 (Jadwal Reguler)' : 'Tahap 4 (Cadangan/Perubahan)';
    
    return [
      `#${idx + 1}`,
      pLevel,
      p.priorityScore || 0,
      c?.urgensiKondisi || 0,
      c?.kesiapanDokumen || 0,
      c?.dampakManfaat || 0,
      c?.keselarasanRpjmd || 0,
      `"${(p.projectName || '').replace(/"/g, '""')}"`,
      `"${(p.programName || p.activityName || '').replace(/"/g, '""')}"`,
      `"${(p.kecamatan || '').replace(/"/g, '""')}"`,
      `"${(p.desa || '').replace(/"/g, '""')}"`,
      `"${(p.sumberUsulan || '').replace(/"/g, '""')}"`,
      p.estimatedBudget || 0,
      `"${phase}"`,
      `"${(c?.justifikasiTeknis || p.justification || '').replace(/"/g, '""')}"`,
      `"${(c?.evaluatedBy || '').replace(/"/g, '""')}"`,
      `"${(c?.evaluatedAt || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Rekapitulasi_Skala_Prioritas_URK_PUPR_${tahun}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};



