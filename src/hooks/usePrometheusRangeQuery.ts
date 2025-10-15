import { useEffect, useMemo, useState } from 'react';

type RangePoint = { time: string; value: number };

type PrometheusRangeResult = {
  metric: Record<string, string>;
  values: [number, string][];
};

interface Options {
  rangeMinutes?: number;
  stepSeconds?: number;
  intervalMs?: number;
  aggregate?: boolean; // soma séries em uma única
  groupByLabel?: string; // retorna séries separadas por label (ex.: 'service')
}

export function usePrometheusRangeQuery(query: string, options: Options = {}) {
  const {
    rangeMinutes = 15,
    stepSeconds = 15,
    intervalMs = 30000,
    aggregate = true,
  } = options;

  const [raw, setRaw] = useState<PrometheusRangeResult[]>([]);
  const [data, setData] = useState<RangePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [series, setSeries] = useState<Array<{ name: string; data: RangePoint[] }>>([]);
  const PROM_URL = import.meta.env.VITE_PROMETHEUS_URL || '/prometheus';

  async function fetchRange() {
    setLoading(true);
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - rangeMinutes * 60;
      const url = `${PROM_URL}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${stepSeconds}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        const result: PrometheusRangeResult[] = json.data?.result || [];
        setRaw(result);
        if (aggregate) {
          // Assumimos que todas as séries têm mesmo número de pontos e timestamps alinhados
          const values = result[0]?.values || [];
          const sum = values.map(([ts, _], idx) => {
            const total = result.reduce((acc, serie) => acc + (Number(serie.values[idx]?.[1] || 0)), 0);
            const d = new Date(ts * 1000);
            const time = d.toTimeString().slice(0, 8);
            return { time, value: total } as RangePoint;
          });
          setData(sum);
        } else if (result[0]) {
          const points: RangePoint[] = result[0].values.map(([ts, val]) => {
            const d = new Date(ts * 1000);
            const time = d.toTimeString().slice(0, 8);
            return { time, value: Number(val) };
          });
          setData(points);
        } else {
          setData([]);
        }
        // Construir séries multi-label quando solicitado
        if (options.groupByLabel) {
          const label = options.groupByLabel;
          const multi = result.map((serie) => {
            const name = serie.metric?.[label] || 'unknown';
            const points: RangePoint[] = serie.values.map(([ts, val]) => {
              const d = new Date(ts * 1000);
              const time = d.toTimeString().slice(0, 8);
              return { time, value: Number(val) };
            });
            return { name, data: points };
          });
          setSeries(multi);
        } else {
          setSeries([]);
        }
        setError(null);
      } else {
        setError(json.error || 'Erro ao consultar Prometheus');
      }
    } catch (err: any) {
      setError(err?.message || 'Falha na requisição');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRange();
    const t = setInterval(fetchRange, intervalMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, rangeMinutes, stepSeconds, intervalMs, aggregate]);

  const seriesCount = useMemo(() => raw.length, [raw]);

  return { data, error, loading, seriesCount, series };
}