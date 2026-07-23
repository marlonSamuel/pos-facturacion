import { useState, useCallback } from 'react';
import api from '../api/axios';

export function useReport<T = any>(endpoint: string, params: Record<string, any> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (customParams?: Record<string, any>) => {
    setLoading(true);
    try {
      const p = { ...params, ...customParams };
      const qs = Object.entries(p)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
      const r = await api.get<T>(`/reports/${endpoint}${qs ? '?' + qs : ''}`);
      setData(r.data);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [endpoint]);

  return { data, loading, fetch };
}
