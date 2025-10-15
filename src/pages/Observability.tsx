import { useEffect, useState } from 'react';
import { Select, Space } from 'antd';
import { usePrometheusQuery } from '../hooks/usePrometheusQuery';
import { usePrometheusRangeQuery } from '../hooks/usePrometheusRangeQuery';
import ApiChart from '../components/ApiChart';
import MultiSeriesChart from '../components/MultiSeriesChart';

export default function Observability() {
  const [rangeMinutes, setRangeMinutes] = useState<number>(15);
  const [stepSeconds, setStepSeconds] = useState<number>(10);
  // QPS por serviço (NestJS + FastAPI) usando label de job/service
  const { data: qpsByService } = usePrometheusQuery(
    'sum(rate(http_request_duration_seconds_count[1m])) by (service)'
  );

  // Latência P95 e P99 agregadas
  const { data: p95Latency } = usePrometheusQuery(
    'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))'
  );
  const { data: p99Latency } = usePrometheusQuery(
    'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))'
  );

  // Taxa de erro por status e serviço
  const { data: errorByStatusService } = usePrometheusQuery(
    'sum(rate(http_errors_total[5m])) by (status, service)'
  );

  // Nginx: requests e conexões
  const { data: nginxQps } = usePrometheusQuery('sum(rate(nginx_http_requests_total[1m]))');
  const { data: nginxConn } = usePrometheusQuery('nginx_connections_active');

  // PostgreSQL: sessões ativas
  const { data: pgSessions } = usePrometheusQuery('sum(pg_stat_activity_count)');

  // Containers (cAdvisor): CPU e memória total
  const { data: cpuTotal } = usePrometheusQuery('sum(rate(container_cpu_usage_seconds_total[1m]))');
  const { data: memTotal } = usePrometheusQuery('sum(container_memory_usage_bytes)');

  // Range queries para gráficos
  const qpsTotalRange = usePrometheusRangeQuery('sum(rate(http_request_duration_seconds_count[1m]))', { rangeMinutes, stepSeconds });
  const p95Range = usePrometheusRangeQuery('histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))', { rangeMinutes, stepSeconds });
  const p99Range = usePrometheusRangeQuery('histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))', { rangeMinutes, stepSeconds });
  const errTotalRange = usePrometheusRangeQuery('sum(rate(http_errors_total[5m]))', { rangeMinutes, stepSeconds });
  const nginxQpsRange = usePrometheusRangeQuery('sum(rate(nginx_http_requests_total[1m]))', { rangeMinutes, stepSeconds });
  const nginxConnRange = usePrometheusRangeQuery('sum(nginx_connections_active)', { rangeMinutes, stepSeconds });
  const pgSessionsRange = usePrometheusRangeQuery('sum(pg_stat_activity_count)', { rangeMinutes, stepSeconds });
  const cpuRange = usePrometheusRangeQuery('sum(rate(container_cpu_usage_seconds_total[1m]))', { rangeMinutes, stepSeconds });
  const memRange = usePrometheusRangeQuery('sum(container_memory_usage_bytes)', { rangeMinutes, stepSeconds });

  // Multi-série por serviço
  const qpsByServiceRange = usePrometheusRangeQuery('sum(rate(http_request_duration_seconds_count[1m])) by (service)', { rangeMinutes, stepSeconds, aggregate: false, groupByLabel: 'service' });
  const errByServiceRange = usePrometheusRangeQuery('sum(rate(http_errors_total[5m])) by (service)', { rangeMinutes, stepSeconds, aggregate: false, groupByLabel: 'service' });

  const [sseLatency, setSseLatency] = useState<number | null>(null);
  useEffect(() => {
    const es = new EventSource('/api/events/metrics');
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload?.latency) setSseLatency(payload.latency);
      } catch {}
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Observabilidade</h1>
      {/* Filtros de intervalo e granularidade */}
      <Space style={{ marginBottom: 12 }}>
        <span>Intervalo:</span>
        <Select
          value={rangeMinutes}
          onChange={setRangeMinutes}
          options={[
            { value: 15, label: '15m' },
            { value: 30, label: '30m' },
            { value: 60, label: '1h' },
            { value: 360, label: '6h' },
          ]}
          style={{ width: 100 }}
        />
        <span>Step:</span>
        <Select
          value={stepSeconds}
          onChange={setStepSeconds}
          options={[
            { value: 10, label: '10s' },
            { value: 30, label: '30s' },
            { value: 60, label: '60s' },
          ]}
          style={{ width: 100 }}
        />
      </Space>
      <section>
        <h2>Métricas (Prometheus)</h2>
        {/* Gráficos reais com ECharts (range queries) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* QPS agregado */}
          <ApiChart title="QPS (total)" data={qpsTotalRange.data} height={220} type="spline" />

          {/* Latência P95 e P99 (um gráfico por métrica) */}
          <ApiChart title="Latência P95 (ms)" data={p95Range.data.map(p => ({ ...p, value: p.value * 1000 }))} color="#13c2c2" unit=" ms" height={220} type="area" />

          <ApiChart title="Latência P99 (ms)" data={p99Range.data.map(p => ({ ...p, value: p.value * 1000 }))} color="#9254de" unit=" ms" height={220} type="area" />

          {/* Taxa de erros agregada */}
          <ApiChart title="Erros/s (5m)" data={errTotalRange.data} color="#f5222d" height={220} type="line" />

          {/* Nginx */}
          <ApiChart title="Nginx QPS" data={nginxQpsRange.data} color="#fa8c16" height={220} type="spline" />

          <ApiChart title="Nginx Conexões Ativas" data={nginxConnRange.data} color="#722ed1" height={220} type="line" />

          {/* PostgreSQL sessões */}
          <ApiChart title="PostgreSQL Sessões" data={pgSessionsRange.data} color="#2f54eb" height={220} type="line" />

          {/* Containers CPU e Memória */}
          <ApiChart title="CPU Containers (1m)" data={cpuRange.data} color="#1890ff" unit="" height={220} type="spline" />

          <ApiChart title="Memória Containers (bytes)" data={memRange.data} color="#597ef7" unit="" height={220} type="area" />
        </div>

        {/* Multi-série por serviço */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <MultiSeriesChart title="QPS por Serviço" series={qpsByServiceRange.series} height={260} />
          <MultiSeriesChart title="Erros/s por Serviço (5m)" series={errByServiceRange.series} height={260} />
        </div>

        {/* Resumo textual para breakdown por serviço */}
        <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          <div>
            QPS por serviço:{' '}
            {qpsByService?.length
              ? qpsByService.map((r) => `${r.metric.service || 'unknown'}:${Number(r.value[1]).toFixed(2)}`).join(' | ')
              : '—'}
          </div>
          <div>
            Erros (5m) por status/serviço:{' '}
            {errorByStatusService?.length
              ? errorByStatusService.map((r) => `${r.metric.service || 'unknown'}:${r.metric.status}=${r.value[1]}`).join(' | ')
              : '—'}
          </div>
        </div>
      </section>

      <section>
        <h2>Logs (Loki)</h2>
        <p>Consumo via Promtail configurado. Explorar em Grafana/Loki UI.</p>
      </section>

      <section>
        <h2>Traces (Tempo)</h2>
        <p>OTLP habilitado em FastAPI e NestJS. Visualizar no Grafana/Tempo.</p>
      </section>

      <section>
        <h2>Atualização em tempo real (SSE)</h2>
        <p>Latência (último evento): {sseLatency ? `${sseLatency} ms` : '—'}</p>
      </section>
    </div>
  );
}