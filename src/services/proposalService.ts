import { Proposal, SipdStatus } from '../types';
import { getAccessToken } from '../auth';
import { getRows } from '../sheetsApi';
import { parseMoney } from '../utils';
import { getRenjaMasterData } from './renjaService';

/**
 * Fetch proposals for a specific Bidang/Unit given its sheetId
 */
export async function getProposalsByBidang(bidangId: string, sheetId?: string): Promise<Proposal[]> {
  if (!sheetId) return [];

  try {
    const token = await getAccessToken();
    if (!token) return [];

    const rows = await getRows(token, sheetId, 'Proposals!A2:X');
    if (!rows || !Array.isArray(rows)) return [];

    // Also get renja master data to populate linkage if stored
    const renjaData = await getRenjaMasterData();
    const renjaSubKegiatanMap = new Map(renjaData.subKegiatan.map(s => [s.id, s]));
    const renjaProgMap = new Map(renjaData.programs.map(p => [p.id, p]));

    const formatted: Proposal[] = rows.map((r: any[], index: number) => {
      let reqs = {};
      try { reqs = JSON.parse(r[10] || '{}'); } catch (e) {}
      let atts = [];
      try { atts = JSON.parse(r[15] || '[]'); } catch (e) {}
      let pokirArr: string[] = [];
      try {
        if (r[20]) {
          pokirArr = r[20].startsWith('[') ? JSON.parse(r[20]) : r[20].split(',').map((s: string) => s.trim());
        }
      } catch (e) {}

      const proposalId = r[0] || `prop-${index}`;

      // Check if this proposal is linked in any renja sub-kegiatan
      const linkedSub = renjaData.subKegiatan.find(s => s.linkedProposalIds && s.linkedProposalIds.includes(proposalId));
      const linkedProg = linkedSub ? renjaProgMap.get(linkedSub.programId) : undefined;

      return {
        id: proposalId,
        rowIndex: index + 2,
        submittedAt: r[1],
        tahunUsulan: r[2],
        programName: r[3],
        activityName: r[4],
        projectName: r[5],
        location: r[6],
        estimatedBudget: parseMoney(r[7]),
        justification: r[8],
        zoomLink: r[9],
        requirementsMet: reqs,
        submittedBy: r[11],
        documentFolderUrl: r[12] || '',
        status: (r[13] as any) || 'pending',
        adminNotes: r[14] || '',
        attachments: atts,
        jenisUsulan: r[16],
        sumberUsulan: r[17] || '',
        kecamatan: r[18] || '',
        desa: r[19] || '',
        pengusulPokir: pokirArr,
        sipdStatus: (r[21] as SipdStatus) || 'draft',
        sipdRegistrationNo: r[22] || '',
        sipdNotes: r[23] || '',
        // Linkage to Renja
        isAkomodirRenja: !!linkedSub,
        renjaSubKegiatanId: linkedSub?.id,
        renjaSubKegiatanName: linkedSub?.namaSubKegiatan,
        renjaProgramName: linkedProg?.namaProgram,
        renjaPaguAlokasi: linkedSub?.paguSubKegiatan
      } as Proposal;
    });

    return formatted.reverse();
  } catch (err) {
    console.error(`Failed to fetch proposals for bidang ${bidangId}:`, err);
    return [];
  }
}
