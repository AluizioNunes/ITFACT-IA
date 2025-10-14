export interface PrometheusMetric {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

export interface PrometheusQueryResult {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value: [number, string];
    }>;
  };
}