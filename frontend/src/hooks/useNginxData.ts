import { useState, useCallback } from 'react';

interface NginxMetrics {
  requestsPerSecond: number;
  activeConnections: number;
  errorRate: number;
  averageLatency: number;
  totalRequests: number;
  uptime: {
    seconds: number;
    formatted: string;
  };
  timestamp: string;
}

interface NginxUpstream {
  name: string;
  status: string;
  requests: number;
  latency: number;
  responseTime: number;
  lastCheck: string;
}

interface NginxLocation {
  path: string;
  requests: number;
  errors: number;
  avgResponseTime: number;
  errorRate: string;
  requestsPerMinute: number;
}

interface NginxPerformancePoint {
  timestamp: string;
  time: string;
  requestsPerSecond: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
}

interface NginxStatus {
  service: string;
  status: string;
  lastCheck: string;
  ports: string[];
  ssl: string;
}

interface NginxData {
  metrics: NginxMetrics | null;
  upstreams: NginxUpstream[];
  locations: NginxLocation[];
  performance: NginxPerformancePoint[];
  status: NginxStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useNginxData = (): NginxData => {
  const [data, setData] = useState<NginxData>({
    metrics: null,
    upstreams: [],
    locations: [],
    performance: [],
    status: null,
    loading: false,
    error: null,
    refetch: async () => {}
  });

  // Mock data para fallback durante desenvolvimento
  const getMockData = (): Omit<NginxData, 'loading' | 'error' | 'refetch'> => {
    const currentTime = new Date();
    const mockPerformance: NginxPerformancePoint[] = [];
    
    // Gerar 10 pontos de dados históricos
    for (let i = 9; i >= 0; i--) {
      const timestamp = new Date(currentTime.getTime() - (i * 30000));
      mockPerformance.push({
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        requestsPerSecond: 1200 + Math.floor(Math.random() * 300),
        activeConnections: 320 + Math.floor(Math.random() * 100),
        responseTime: 40 + Math.floor(Math.random() * 20),
        errorRate: 0.1 + Math.random() * 0.3
      });
    }

    return {
      metrics: {
        requestsPerSecond: 1250,
        activeConnections: 342,
        errorRate: 0.2,
        averageLatency: 45,
        totalRequests: 1280000,
        uptime: {
          seconds: 3600,
          formatted: '1h 0m'
        },
        timestamp: new Date().toISOString()
      },
      upstreams: [
        {
          name: 'frontend',
          status: 'up',
          requests: 8500,
          latency: 35,
          responseTime: 35,
          lastCheck: new Date().toISOString()
        },
        {
          name: 'backend',
          status: 'up',
          requests: 3200,
          latency: 25,
          responseTime: 25,
          lastCheck: new Date().toISOString()
        }
      ],
      locations: [
        {
          path: '/',
          requests: 12400,
          errors: 5,
          avgResponseTime: 45,
          errorRate: '0.04',
          requestsPerMinute: 206
        },
        {
          path: '/api/',
          requests: 8900,
          errors: 12,
          avgResponseTime: 38,
          errorRate: '0.13',
          requestsPerMinute: 148
        },
        {
          path: '/grafana',
          requests: 5600,
          errors: 2,
          avgResponseTime: 52,
          errorRate: '0.04',
          requestsPerMinute: 93
        },
        {
          path: '/n8n',
          requests: 3200,
          errors: 1,
          avgResponseTime: 41,
          errorRate: '0.03',
          requestsPerMinute: 53
        },
        {
          path: '/chatwoot',
          requests: 2100,
          errors: 0,
          avgResponseTime: 39,
          errorRate: '0.00',
          requestsPerMinute: 35
        }
      ],
      performance: mockPerformance,
      status: {
        service: 'Nginx',
        status: 'Active',
        lastCheck: new Date().toISOString(),
        ports: ['80', '443', '8080'],
        ssl: 'Enabled'
      }
    };
  };

  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const baseUrl = window.location.origin;
      
      // Buscar todos os endpoints em paralelo
      const [metricsRes, upstreamsRes, locationsRes, performanceRes, statusRes] = await Promise.all([
        fetch(`${baseUrl}/api/nginx/metrics`),
        fetch(`${baseUrl}/api/nginx/upstreams`),
        fetch(`${baseUrl}/api/nginx/locations`),
        fetch(`${baseUrl}/api/nginx/performance`),
        fetch(`${baseUrl}/api/nginx/status`)
      ]);

      // Verificar se todas as respostas são válidas
      const responses = [metricsRes, upstreamsRes, locationsRes, performanceRes, statusRes];
      const allValid = responses.every(res => res.ok && res.headers.get('content-type')?.includes('application/json'));

      if (!allValid) {
        console.warn('Algumas APIs do Nginx não estão disponíveis, usando dados mock');
        const mockData = getMockData();
        setData(prev => ({
          ...prev,
          ...mockData,
          loading: false,
          error: null
        }));
        return;
      }

      // Parse das respostas
      const [metrics, upstreams, locations, performance, status] = await Promise.all([
        metricsRes.json(),
        upstreamsRes.json(),
        locationsRes.json(),
        performanceRes.json(),
        statusRes.json()
      ]);

      setData(prev => ({
        ...prev,
        metrics,
        upstreams: upstreams.upstreams || [],
        locations: locations.locations || [],
        performance: performance.performanceHistory || [],
        status,
        loading: false,
        error: null
      }));

    } catch (error) {
      console.error('Erro ao buscar dados do Nginx:', error);
      console.log('Usando dados mock como fallback');
      
      const mockData = getMockData();
      setData(prev => ({
        ...prev,
        ...mockData,
        loading: false,
        error: 'Usando dados simulados - API indisponível'
      }));
    }
  }, []);

  // Configurar refetch na data
  const dataWithRefetch = {
    ...data,
    refetch: fetchData
  };

  return dataWithRefetch;
};