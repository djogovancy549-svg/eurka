const fs = require('fs');
let code = fs.readFileSync('src/components/BidangDashboard.tsx', 'utf8');

if (!code.includes('getProposalsByBidang')) {
  code = code.replace(
    "import { getAllBidangConfigs, saveBidangConfig, notifyAdminNewProposal, getNagekeoWilayah } from '../services/configService';",
    "import { getAllBidangConfigs, saveBidangConfig, notifyAdminNewProposal, getNagekeoWilayah } from '../services/configService';\nimport { getProposalsByBidang } from '../services/proposalService';"
  );
}

const targetFetch = `  const fetchProposals = async (sheetId?: string) => {
    if (!sheetId) {
      setProposals([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) return;
      
      const rows = await getRows(token, sheetId, 'Proposals!A2:X');
      const formatted = rows.map((r: any[], index: number) => {
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
        
        return {
          id: r[0],
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
          sipdNotes: r[23] || ''
        } as Proposal;
      });
      
      setProposals(formatted.reverse());
    } catch (err) {
      console.error('Failed to fetch proposals', err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };`;

const replacement = `  const fetchProposals = async (sheetId?: string) => {
    if (!sheetId) {
      setProposals([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await getProposalsByBidang(selectedBidangId, sheetId);
      setProposals(data.reverse());
    } catch (err) {
      console.error('Failed to fetch proposals', err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(targetFetch, replacement);
fs.writeFileSync('src/components/BidangDashboard.tsx', code);
