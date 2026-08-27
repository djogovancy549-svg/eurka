import { getAccessToken, isTokenExpired, clearToken, googleSignIn } from './auth';

/**
 * Universal helper for Google Sheets API requests that handles token retrieval,
 * automatic token expiration detection, retry on 401 UNAUTHENTICATED, and friendly error messages.
 */
export const fetchSheetsApi = async (url: string, options: RequestInit = {}, customToken?: string): Promise<Response> => {
  let token = customToken || await getAccessToken();

  // If token is missing or expired (> 50 mins), attempt silent/interactive renewal
  if (!token || isTokenExpired()) {
    try {
      const signInRes = await googleSignIn();
      token = signInRes?.accessToken || null;
    } catch (e) {
      console.warn('Auto token renewal on expired token failed:', e);
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    console.warn('Google Sheets API returned HTTP 401 UNAUTHENTICATED. Attempting re-authentication...');
    clearToken();
    try {
      const signInRes = await googleSignIn();
      if (signInRes?.accessToken) {
        token = signInRes.accessToken;
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${token}`);
        response = await fetch(url, { ...options, headers: retryHeaders });
      }
    } catch (reAuthErr) {
      console.error('Re-authentication prompt failed:', reAuthErr);
      throw new Error('🔑 Sesi otorisasi Google Sheets telah kadaluarsa (UNAUTHENTICATED). Silakan lakukan Login dengan Google ulang untuk memperbarui akses Google Sheets.');
    }
  }

  return response;
};

export const createSpreadsheet = async (accessToken: string, title: string) => {
  const response = await fetchSheetsApi('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: [
        {
          properties: { title: 'Proposals' }
        },
        {
          properties: { title: 'Requirements' }
        }
      ]
    })
  }, accessToken);
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal membuat spreadsheet Google Sheets: ${errText}`);
  }
  
  const data = await response.json();
  try {
    await initSpreadsheetHeaders(accessToken, data.spreadsheetId);
  } catch (err) {
    console.warn('Failed to init spreadsheet headers on create:', err);
  }
  return data;
};

export const initSpreadsheetHeaders = async (accessToken: string, spreadsheetId: string) => {
  const requests = [
    {
      updateCells: {
        range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
        rows: [{
          values: [
            { userEnteredValue: { stringValue: 'ID' } },
            { userEnteredValue: { stringValue: 'Timestamp' } },
            { userEnteredValue: { stringValue: 'Tahun Usulan' } },
            { userEnteredValue: { stringValue: 'Program Name' } },
            { userEnteredValue: { stringValue: 'Activity Name' } },
            { userEnteredValue: { stringValue: 'Project Name' } },
            { userEnteredValue: { stringValue: 'Location' } },
            { userEnteredValue: { stringValue: 'Estimated Budget' } },
            { userEnteredValue: { stringValue: 'Justification' } },
            { userEnteredValue: { stringValue: 'Zoom Link' } },
            { userEnteredValue: { stringValue: 'Requirements Met' } },
            { userEnteredValue: { stringValue: 'Submitter' } },
            { userEnteredValue: { stringValue: 'Document Folder URL' } },
            { userEnteredValue: { stringValue: 'Status' } },
            { userEnteredValue: { stringValue: 'Admin Notes' } },
            { userEnteredValue: { stringValue: 'Attachments' } },
            { userEnteredValue: { stringValue: 'Jenis Usulan' } },
            { userEnteredValue: { stringValue: 'Sumber Usulan' } },
            { userEnteredValue: { stringValue: 'Kecamatan' } },
            { userEnteredValue: { stringValue: 'Desa / Kelurahan' } },
            { userEnteredValue: { stringValue: 'Pengusul Pokir DPRD' } },
            { userEnteredValue: { stringValue: 'Status SIPD' } },
            { userEnteredValue: { stringValue: 'No Registrasi SIPD' } },
            { userEnteredValue: { stringValue: 'Catatan Kelayakan SIPD' } },
          ]
        }],
        fields: 'userEnteredValue'
      }
    },
    {
      updateCells: {
        range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1 },
        rows: [{
          values: [
            { userEnteredValue: { stringValue: 'ID' } },
            { userEnteredValue: { stringValue: 'Label' } },
            { userEnteredValue: { stringValue: 'Description' } },
          ]
        }],
        fields: 'userEnteredValue'
      }
    }
  ];

  // We need the actual sheetIds for Proposals and Requirements
  const metaResponse = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {}, accessToken);
  const meta = await metaResponse.json();
  const proposalsSheetId = meta.sheets?.find((s: any) => s.properties.title === 'Proposals')?.properties.sheetId;
  const reqSheetId = meta.sheets?.find((s: any) => s.properties.title === 'Requirements')?.properties.sheetId;

  if (proposalsSheetId !== undefined && reqSheetId !== undefined) {
    requests[0].updateCells.range.sheetId = proposalsSheetId;
    requests[1].updateCells.range.sheetId = reqSheetId;

    await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests })
    }, accessToken);
  }
};

export const ensureProposalsSheet = async (accessToken: string, spreadsheetId: string) => {
  try {
    const metaResponse = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {}, accessToken);
    if (!metaResponse.ok) return;
    const meta = await metaResponse.json();
    const hasProposals = meta.sheets?.some((s: any) => s.properties.title === 'Proposals');

    if (!hasProposals) {
      // Add Proposals sheet
      const addRes = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: { title: 'Proposals' }
              }
            }
          ]
        })
      }, accessToken);
      if (addRes.ok) {
        // Initialize header row
        await initSpreadsheetHeaders(accessToken, spreadsheetId);
      }
    } else {
      // Check if A1 is empty, if so initialize headers
      const valRes = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Proposals!A1:A1`, {}, accessToken);
      if (valRes.ok) {
        const valData = await valRes.json();
        if (!valData.values || valData.values.length === 0 || !valData.values[0][0]) {
          await initSpreadsheetHeaders(accessToken, spreadsheetId);
        }
      }
    }
  } catch (e) {
    console.warn('Could not ensure Proposals sheet:', e);
  }
};

export const appendRow = async (accessToken: string, spreadsheetId: string, range: string, values: any[]) => {
  await ensureProposalsSheet(accessToken, spreadsheetId);
  
  const sheetName = range.split('!')[0];
  const rowResponse = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:A`, {}, accessToken);
  
  let nextRow = 2; // Default to row 2 if only header or empty
  if (rowResponse.ok) {
    const rowData = await rowResponse.json();
    if (rowData.values) {
      nextRow = rowData.values.length + 1;
    }
  }

  // Calculate the column letter based on values length
  const getColLetter = (colIndex: number): string => {
    let temp = '';
    let num = colIndex;
    while (num > 0) {
      const rem = (num - 1) % 26;
      temp = String.fromCharCode(65 + rem) + temp;
      num = Math.floor((num - 1) / 26);
    }
    return temp || 'A';
  };

  const endColLetter = getColLetter(Math.max(values.length, 17));
  const updateRange = `${sheetName}!A${nextRow}:${endColLetter}${nextRow}`;
  const response = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values]
    })
  }, accessToken);
  
  if (!response.ok) {
    const errText = await response.text();
    console.error('Append row error details:', errText);
    let message = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) message = parsed.error.message;
    } catch (e) {}
    throw new Error(`Gagal menyimpan data usulan ke Google Sheets: ${message}`);
  }
  
  return response.json();
};

export const getRows = async (accessToken: string, spreadsheetId: string, range: string) => {
  await ensureProposalsSheet(accessToken, spreadsheetId);
  const response = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {}, accessToken);
  
  if (!response.ok) {
    // If range doesn't exist yet, return empty array instead of throwing
    return [];
  }
  
  const data = await response.json();
  return data.values || [];
};

export const updateCell = async (accessToken: string, spreadsheetId: string, range: string, value: string) => {
  const response = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[value]]
    })
  }, accessToken);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal memperbarui sel di ${range}: ${errText}`);
  }
};

export const updateRow = async (accessToken: string, spreadsheetId: string, range: string, values: any[]) => {
  const response = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values]
    })
  }, accessToken);
  if (!response.ok) {
    const errText = await response.text();
    let message = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) message = parsed.error.message;
    } catch (e) {}
    throw new Error(`Gagal memperbarui baris di ${range}: ${message}`);
  }
  return response.json();
};

export const deleteProposalRow = async (accessToken: string, spreadsheetId: string, rowIndex: number) => {
  // 1. Get the sheetId for 'Proposals'
  const metaResponse = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {}, accessToken);
  if (!metaResponse.ok) throw new Error('Gagal mengambil metadata spreadsheet Google Sheets');
  const meta = await metaResponse.json();
  const proposalsSheetId = meta.sheets?.find((s: any) => s.properties.title === 'Proposals')?.properties.sheetId;
  
  if (proposalsSheetId === undefined) {
    throw new Error('Proposals sheet tidak ditemukan');
  }

  // 2. Delete the row
  const response = await fetchSheetsApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: proposalsSheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }
      ]
    })
  }, accessToken);
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal menghapus baris ${rowIndex}: ${errText}`);
  }
};
