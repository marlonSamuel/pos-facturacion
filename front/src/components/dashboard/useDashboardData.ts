import { useEffect, useState } from 'react';
import api from '../../api/axios';

/**
 * Hook genérico para cargar datos de un endpoint del dashboard.
 */
export function useDashboardData<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get<T>(`/dashboard/${endpoint}`)
      .then(r => { if (!cancelled) setData(r.data); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [endpoint]);

  return { data, loading };
}
