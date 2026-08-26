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

