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
  
  return response.json();
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
            { userEnteredValue: { stringValue: 'Project Name' } },
            { userEnteredValue: { stringValue: 'Location' } },
            { userEnteredValue: { stringValue: 'Estimated Budget' } },
            { userEnteredValue: { stringValue: 'Justification' } },
            { userEnteredValue: { stringValue: 'Zoom Link' } },
            { userEnteredValue: { stringValue: 'Requirements Met' } },
            { userEnteredValue: { stringValue: 'Submitter' } },
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

export const appendRow = async (accessToken: string, spreadsheetId: string, range: string, values: any[]) => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to append row to ${range}`);
  }
  
  return response.json();
};

export const getRows = async (accessToken: string, spreadsheetId: string, range: string) => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get rows from ${range}`);
  }
  
  const data = await response.json();
  return data.values || [];
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
