import React, { useState, useEffect } from 'react';
import { getRows, appendRow, clearRange } from './sheetsApi';
import { getAccessToken } from './auth';
import { Requirement, defaultRequirements } from './types';

export const useRequirements = (spreadsheetId: string | null) => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReqs = async () => {
      if (!spreadsheetId) {
        setLoading(false);
        return;
      }
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('No access token');
        
        const rows = await getRows(token, spreadsheetId, 'Requirements!A2:C');
        if (rows && rows.length > 0) {
          setRequirements(rows.map((row: any) => ({
            id: row[0],
            label: row[1],
            description: row[2]
          })));
        } else {
          setRequirements(defaultRequirements);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        // Fallback to default
        setRequirements(defaultRequirements);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReqs();
  }, [spreadsheetId]);

  const saveRequirements = async (newReqs: Requirement[]) => {
    if (!spreadsheetId) return;
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('No access token');
      
      // Clear existing
      await clearRange(token, spreadsheetId, 'Requirements!A2:C');
      
      // We should append all rows. Batch update would be better, but we can do append sequentially or build a batchUpdate.
      // Wait, we can just use valueInputOption=USER_ENTERED and update the range.
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Requirements!A2:C?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: newReqs.map(r => [r.id, r.label, r.description])
        })
      });
      if (!response.ok) throw new Error('Failed to update requirements');
      
      setRequirements(newReqs);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { requirements, loading, error, saveRequirements };
};
