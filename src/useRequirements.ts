import React, { useState, useEffect } from 'react';
import { getAdminRequirements, saveAdminRequirements } from './services/configService';
import { Requirement, defaultRequirements } from './types';

export const useRequirements = () => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReqs = async () => {
      try {
        setLoading(true);
        const reqs = await getAdminRequirements();
        if (reqs && reqs.length > 0) {
          setRequirements(reqs);
        } else {
          setRequirements(defaultRequirements);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setRequirements(defaultRequirements);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReqs();
  }, []);

  const saveRequirements = async (newReqs: Requirement[]) => {
    try {
      setLoading(true);
      await saveAdminRequirements(newReqs);
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
