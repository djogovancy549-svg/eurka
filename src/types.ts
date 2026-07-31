export interface Proposal {
  id: string;
  projectName: string;
  location: string;
  estimatedBudget: number;
  justification: string;
  zoomLink?: string;
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
