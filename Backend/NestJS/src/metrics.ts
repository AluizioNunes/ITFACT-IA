import { INestApplication } from '@nestjs/common';
import client, { Counter, Histogram } from 'prom-client';

let errorCounter: Counter<string>;
let latencyHistogram: Histogram<string>;

export function setupMetrics(app: INestApplication) {
  client.collectDefaultMetrics({ prefix: 'cmm_core_' });

  errorCounter = new client.Counter({
    name: 'http_errors_total',
    help: 'Total de erros por status',
    labelNames: ['status', 'route', 'method'],
  });

  latencyHistogram = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Histograma de latência por rota',
    labelNames: ['route', 'method', 'status'],
    buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  });

  app.use((req: any, res: any, next: any) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e9;
      const route = (req.route && req.route.path) || req.path || 'unknown';
      const method = req.method || 'GET';
      const status = String(res.statusCode || 200);
      latencyHistogram.labels(route, method, status).observe(duration);
      if (res.statusCode >= 400) {
        errorCounter.labels(status, route, method).inc();
      }
    });
    next();
  });
}

export async function metricsText() {
  return await client.register.metrics();
}