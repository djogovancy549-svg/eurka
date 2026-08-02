export const createSpreadsheet = async (accessToken: string, title: string) => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
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
  });
  
  if (!response.ok) {
    throw new Error('Failed to create spreadsheet');
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
  const metaResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const meta = await metaResponse.json();
  const proposalsSheetId = meta.sheets.find((s: any) => s.properties.title === 'Proposals')?.properties.sheetId;
  const reqSheetId = meta.sheets.find((s: any) => s.properties.title === 'Requirements')?.properties.sheetId;

  if (proposalsSheetId !== undefined && reqSheetId !== undefined) {
    requests[0].updateCells.range.sheetId = proposalsSheetId;
    requests[1].updateCells.range.sheetId = reqSheetId;

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests })
    });
  }
};

export const ensureProposalsSheet = async (accessToken: string, spreadsheetId: string) => {
  try {
    const metaResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!metaResponse.ok) return;
    const meta = await metaResponse.json();
    const hasProposals = meta.sheets?.some((s: any) => s.properties.title === 'Proposals');

    if (!hasProposals) {
      // Add Proposals sheet
      const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
      });
      if (addRes.ok) {
        // Initialize header row
        await initSpreadsheetHeaders(accessToken, spreadsheetId);
      }
    } else {
      // Check if A1 is empty, if so initialize headers
      const valRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Proposals!A1:A1`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
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
  
  // Find exactly how many rows exist so we don't append to row 1001 if there are empty formatted rows.
  // Assuming range is something like 'Proposals!A:P', we fetch 'Proposals!A:A'
  const sheetName = range.split('!')[0];
  const rowResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:A`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  let nextRow = 2; // Default to row 2 if only header or empty
  if (rowResponse.ok) {
    const rowData = await rowResponse.json();
    if (rowData.values) {
      nextRow = rowData.values.length + 1;
    }
  }

  // Update exactly at the next row
  const updateRange = `${sheetName}!A${nextRow}:P${nextRow}`;
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values]
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    console.error('Append row error details:', errText);
    throw new Error(`Failed to append row to ${range}: ${errText}`);
  }
  
  return response.json();
};

export const getRows = async (accessToken: string, spreadsheetId: string, range: string) => {
  await ensureProposalsSheet(accessToken, spreadsheetId);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });
  
  if (!response.ok) {
    // If range doesn't exist yet, return empty array instead of throwing
    return [];
  }
  
  const data = await response.json();
  return data.values || [];
};

export const updateCell = async (accessToken: string, spreadsheetId: string, range: string, value: string) => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[value]]
    })
  });
  if (!response.ok) {
    throw new Error(`Failed to update cell at ${range}`);
  }
};

export const clearRange = async (accessToken: string, spreadsheetId: string, range: string) => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to clear range ${range}`);
  }
};
