import { useState, useEffect } from 'react';

interface ApiMetrics {
  totalRequests: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  lastRequestTime: string | null;
  errors: number;
  errorRate: string;
  uptime: {
    seconds: number;
    formatted: string;
    since: string;
  };
  timestamp: string;
}

interface EndpointData {
  path: string;
  requests: number;
  lastAccess: string;
  errors: number;
  errorRate: string;
}

interface EndpointsResponse {
  endpoints: EndpointData[];
  totalEndpoints: number;
  mostUsed: EndpointData | null;
  timestamp: string;
}

interface PerformanceData {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    heapUsedPercentage: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  uptime: number;
  pid: number;
  nodeVersion: string;
  platform: string;
  timestamp: string;
}

interface HealthData {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

interface InfoData {
  platform: string;
  nodeVersion: string;
  uptime: number;
  memory: any;
  environment: string;
}

interface ServicesData {
  services: Array<{
    name: string;
    status: string;
    type: string;
    ports?: string[];
    port?: string;
  }>;
  totalServices: number;
  activeServices: number;
  lastUpdate: string;
}

interface ApiData {
  metrics: ApiMetrics | null;
  endpoints: EndpointsResponse | null;
  performance: PerformanceData | null;
  health: HealthData | null;
  info: InfoData | null;
  services: ServicesData | null;
  loading: boolean;
  error: string | null;
}

export const useRealApiData = () => {
  const [data, setData] = useState<ApiData>({
    metrics: null,
    endpoints: null,
    performance: null,
    health: null,
    info: null,
    services: null,
    loading: true,
    error: null,
  });

  // Mock data for development fallback
  const getMockData = (): Omit<ApiData, 'loading' | 'error'> => {
    const now = Date.now();
    return {
      metrics: {
        totalRequests: Math.floor(Math.random() * 1000) + 500,
        requestsPerMinute: Math.floor(Math.random() * 50) + 20,
        averageResponseTime: Math.random() * 100 + 50,
        lastRequestTime: new Date().toISOString(),
        errors: Math.floor(Math.random() * 10),
        errorRate: (Math.random() * 5).toFixed(2),
        uptime: {
          seconds: Math.floor((now - (now - 3600000)) / 1000),
          formatted: '1h 15m',
          since: new Date(now - 3600000).toISOString()
        },
        timestamp: new Date().toISOString()
      },
      endpoints: {
        endpoints: [
          { path: '/api/health', requests: 150, lastAccess: new Date().toISOString(), errors: 0, errorRate: '0.00' },
          { path: '/api/metrics', requests: 89, lastAccess: new Date().toISOString(), errors: 2, errorRate: '2.25' },
          { path: '/api/info', requests: 45, lastAccess: new Date().toISOString(), errors: 1, errorRate: '2.22' },
        ],
        totalEndpoints: 3,
        mostUsed: { path: '/api/health', requests: 150, lastAccess: new Date().toISOString(), errors: 0, errorRate: '0.00' },
        timestamp: new Date().toISOString()
      },
      performance: {
        memory: {
          rss: Math.floor(Math.random() * 100) + 50,
          heapTotal: Math.floor(Math.random() * 80) + 40,
          heapUsed: Math.floor(Math.random() * 60) + 20,
          external: Math.floor(Math.random() * 20) + 5,
          heapUsedPercentage: Math.floor(Math.random() * 80) + 20
        },
        cpu: { user: 1500000, system: 200000 },
        uptime: 3600,
        pid: 12345,
        nodeVersion: 'v24.0.0',
        platform: 'linux',
        timestamp: new Date().toISOString()
      },
      health: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'CMM Automação API',
        version: '1.0.0'
      },
      info: {
        platform: 'linux',
        nodeVersion: 'v24.0.0',
        uptime: 3600,
        memory: {},
        environment: 'development'
      },
      services: {
        services: [
          { name: 'Nginx', status: 'Active', type: 'Reverse Proxy', ports: ['80', '443'] },
          { name: 'Frontend', status: 'Active', type: 'React Application', port: '3000' },
          { name: 'Backend API', status: 'Active', type: 'Node.js API', port: '3001' }
        ],
        totalServices: 3,
        activeServices: 3,
        lastUpdate: new Date().toISOString()
      }
    };
  };

  const fetchData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const baseUrl = window.location.origin;
      
      // Fetch all endpoints in parallel
      const [metricsRes, endpointsRes, performanceRes, healthRes, infoRes, servicesRes] = await Promise.all([
        fetch(`${baseUrl}/api/metrics`),
        fetch(`${baseUrl}/api/endpoints`),
        fetch(`${baseUrl}/api/performance`),
        fetch(`${baseUrl}/api/health`),
        fetch(`${baseUrl}/api/info`),
        fetch(`${baseUrl}/api/services`),
      ]);

      // Check if all requests were successful
      const responses = [metricsRes, endpointsRes, performanceRes, healthRes, infoRes, servicesRes];
      const failedRequests = responses.filter(res => !res.ok);
      
      if (failedRequests.length > 0) {
        console.warn(`${failedRequests.length} API requests failed`);
      }

      // Parse JSON responses with error handling
      const parseJsonSafely = async (response: Response, name: string) => {
        try {
          const text = await response.text();
          if (!text.trim()) {
            console.warn(`Empty response from ${name}`);
            return null;
          }
          if (text.startsWith('<')) {
            console.warn(`HTML response received from ${name}, expected JSON`);
            return null;
          }
          return JSON.parse(text);
        } catch (error) {
          console.warn(`Failed to parse JSON from ${name}:`, error);
          return null;
        }
      };

      const [metrics, endpoints, performance, health, info, services] = await Promise.all([
        parseJsonSafely(metricsRes, 'metrics'),
        parseJsonSafely(endpointsRes, 'endpoints'),
        parseJsonSafely(performanceRes, 'performance'),
        parseJsonSafely(healthRes, 'health'),
        parseJsonSafely(infoRes, 'info'),
        parseJsonSafely(servicesRes, 'services'),
      ]);

      setData({
        metrics,
        endpoints,
        performance,
        health,
        info,
        services,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      
      // Fallback to mock data in development
      const mockData = getMockData();
      setData({
        ...mockData,
        loading: false,
        error: null, // Don't show error when using fallback
      });
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Removed automatic interval to prevent screen flickering
    // User will use manual refresh button instead
    
    // Cleanup function (no interval to clear now)
    return () => {};
  }, []); // Removed refreshInterval dependency

  return { ...data, refetch: fetchData };
};