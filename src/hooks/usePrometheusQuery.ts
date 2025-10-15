import { useEffect, useState } from 'react';

type PrometheusVectorResult = {
  metric: Record<string, string>;
  value: [number, string];
};

export function usePrometheusQuery(query: string, intervalMs = 30000) {
  const [data, setData] = useState<PrometheusVectorResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const PROM_URL = import.meta.env.VITE_PROMETHEUS_URL || '/prometheus';

  async function fetchQuery() {
    try {
      const url = `${PROM_URL}/api/v1/query?query=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        setData(json.data.result || []);
      } else {
        setError(json.error || 'Erro ao consultar Prometheus');
      }
    } catch (err: any) {
      setError(err?.message || 'Falha na requisição');
    }
  }

  useEffect(() => {
    fetchQuery();
    const t = setInterval(fetchQuery, intervalMs);
    return () => clearInterval(t);
  }, [query, intervalMs]);

  return { data, error };
}