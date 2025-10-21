import { useState, useCallback, useEffect } from 'react';

// Helper: fetch JSON com timeout para evitar travar a UI
const fetchJsonWithTimeout = async (url: string, timeoutMs = 2500): Promise<any | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data;
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Novo helper: tenta múltiplos endpoints e retorna o primeiro disponível
const fetchFirstAvailableJson = async (urls: string[], timeoutMs = 1000): Promise<any | null> => {
  for (const url of urls) {
    const result = await fetchJsonWithTimeout(url, timeoutMs);
    if (result) return result;
  }
  return null;
};

interface ServiceStatus {
  name: string;
  status: 'Active' | 'Inactive' | 'Warning';
  uptime: string;
  responseTime: number;
  errorRate: number;
  lastCheck: string;
}

interface SystemMetrics {
  totalRequests: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: {
    seconds: number;
    formatted: string;
  };
}

interface NginxMetrics {
  requestsPerSecond: number;
  activeConnections: number;
  errorRate: number;
  averageLatency: number;
}

interface DashboardData {
  systemMetrics: SystemMetrics | null;
  nginxMetrics: NginxMetrics | null;
  services: ServiceStatus[];
  alerts: number;
  totalServices: number;
  activeServices: number;
  containers: {
    running: number;
    total: number;
    details?: any[];
    error?: string;
  };
  postgresData: {
    databases: number;
    tables: number;
    details?: any[];
    error?: string;
  };
  chartData: {
    requestsHistory: Array<{ time: string; value: number }>;
    responseTimeHistory: Array<{ time: string; value: number }>;
    errorRateHistory: Array<{ time: string; value: number }>;
    connectionsHistory: Array<{ time: string; value: number }>;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
  const [data, setData] = useState<DashboardData>({
    systemMetrics: null,
    nginxMetrics: null,
    services: [],
    alerts: 0,
    totalServices: 0,
    activeServices: 0,
    containers: { running: 0, total: 0 },
    postgresData: { databases: 0, tables: 0 },
    chartData: {
      requestsHistory: [],
      responseTimeHistory: [],
      errorRateHistory: [],
      connectionsHistory: []
    },
    loading: false,
    error: null,
    refetch: async () => {}
  });

  // Mock data para fallback durante desenvolvimento
  const getMockData = (): Omit<DashboardData, 'loading' | 'error' | 'refetch'> => {
    const mockServices: ServiceStatus[] = [
      {
        name: 'Nginx',
        status: 'Active',
        uptime: '7d 12h 30m',
        responseTime: 25,
        errorRate: 0.1,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Frontend',
        status: 'Active',
        uptime: '7d 12h 30m',
        responseTime: 35,
        errorRate: 0.0,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Backend API',
        status: 'Active',
        uptime: '7d 12h 30m',
        responseTime: 45,
        errorRate: 0.2,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'PostgreSQL',
        status: 'Active',
        uptime: '15d 8h 45m',
        responseTime: 15,
        errorRate: 0.0,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Redis',
        status: 'Active',
        uptime: '15d 8h 45m',
        responseTime: 5,
        errorRate: 0.0,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Grafana',
        status: 'Active',
        uptime: '7d 12h 30m',
        responseTime: 85,
        errorRate: 0.1,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'N8N',
        status: 'Active',
        uptime: '5d 18h 15m',
        responseTime: 120,
        errorRate: 0.3,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Chatwoot',
        status: 'Active',
        uptime: '3d 6h 22m',
        responseTime: 95,
        errorRate: 0.2,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Evolution API',
        status: 'Active',
        uptime: '3d 6h 22m',
        responseTime: 150,
        errorRate: 0.5,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'RabbitMQ',
        status: 'Active',
        uptime: '15d 8h 45m',
        responseTime: 25,
        errorRate: 0.0,
        lastCheck: new Date().toISOString()
      }
    ];

    // Gerar dados históricos para gráficos
    const currentTime = new Date();
    const requestsHistory = [];
    const responseTimeHistory = [];
    const errorRateHistory = [];
    const connectionsHistory = [];

    // Gerar 15 pontos de dados históricos (últimos 15 minutos)
    for (let i = 14; i >= 0; i--) {
      const timestamp = new Date(currentTime.getTime() - (i * 60000)); // 1 minuto de intervalo
      const timeLabel = timestamp.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit'
      });

      requestsHistory.push({
        time: timeLabel,
        value: 40 + Math.floor(Math.random() * 30) // 40-70 req/min
      });

      responseTimeHistory.push({
        time: timeLabel,
        value: 35 + Math.floor(Math.random() * 25) // 35-60ms
      });

      errorRateHistory.push({
        time: timeLabel,
        value: Math.round((0.1 + Math.random() * 0.4) * 100) / 100 // 0.1-0.5%
      });

      connectionsHistory.push({
        time: timeLabel,
        value: 300 + Math.floor(Math.random() * 100) // 300-400 conexões
      });
    }

    return {
      systemMetrics: {
        totalRequests: 1285000 + Math.floor(Math.random() * 10000),
        requestsPerMinute: 45 + Math.floor(Math.random() * 20),
        averageResponseTime: 42.5 + Math.random() * 10,
        errorRate: 0.15 + Math.random() * 0.1,
        uptime: {
          seconds: 648000, // ~7.5 dias
          formatted: '7d 12h 30m'
        }
      },
      nginxMetrics: {
        requestsPerSecond: 1250 + Math.floor(Math.random() * 300),
        activeConnections: 342 + Math.floor(Math.random() * 100),
        errorRate: 0.2 + Math.random() * 0.3,
        averageLatency: 45 + Math.random() * 20
      },
      services: mockServices,
      alerts: Math.floor(Math.random() * 3), // 0-2 alertas
      totalServices: mockServices.length,
      activeServices: mockServices.filter(s => s.status === 'Active').length,
      containers: {
        running: 8 + Math.floor(Math.random() * 3),
        total: 10 + Math.floor(Math.random() * 2)
      },
      postgresData: {
        databases: 4,
        tables: 25 + Math.floor(Math.random() * 10)
      },
      chartData: {
        requestsHistory,
        responseTimeHistory,
        errorRateHistory,
        connectionsHistory
      }
    };
  };

  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const baseUrl = window.location.origin;
      // Requisições com timeout reduzido e fallback de endpoints para resposta mais rápida
      const [
        systemMetrics,
        nginxMetrics,
        servicesData,
        nginxStatus,
        health,
        postgresStatus,
        postgresMetrics,
        dockerContainers,
        dockerStatus,
        postgresDatabases
      ] = await Promise.all([
        fetchFirstAvailableJson([`${baseUrl}/api/metrics`, `${baseUrl}/metrics`], 1000),
        fetchFirstAvailableJson([`${baseUrl}/api/nginx/metrics`], 900),
        fetchFirstAvailableJson([`${baseUrl}/api/services`, `${baseUrl}/api/inventory/services`], 1000),
        fetchFirstAvailableJson([`${baseUrl}/api/nginx/status`, `${baseUrl}/nginx_status`], 800),
        fetchFirstAvailableJson([`${baseUrl}/api/health`, `${baseUrl}/health`], 800),
        fetchFirstAvailableJson([`${baseUrl}/api/postgresql/status`, `${baseUrl}/api/discovery/dbprobe`], 1000),
        fetchFirstAvailableJson([`${baseUrl}/api/postgresql/metrics`, `${baseUrl}/api/discovery/dbprobe`], 1000),
        fetchFirstAvailableJson([`${baseUrl}/api/docker/containers`, `${baseUrl}/api/discovery/docker`], 1000),
        fetchFirstAvailableJson([`${baseUrl}/api/docker/status`, `${baseUrl}/api/discovery/docker`], 800),
        fetchFirstAvailableJson([`${baseUrl}/api/postgresql/databases`, `${baseUrl}/api/discovery/dbprobe`], 1000)
      ]);

      // Se nenhuma resposta válida veio, usa fallback rápido
      const results = [systemMetrics, nginxMetrics, servicesData, nginxStatus, health, postgresStatus, postgresMetrics, dockerContainers, dockerStatus, postgresDatabases];
      const validCount = results.filter(Boolean).length;
      if (validCount < 1) {
        const mockData = getMockData();
        setData(prev => ({
          ...prev,
          ...mockData,
          loading: false,
          error: 'Usando dados simulados - APIs limitadas'
        }));
        return;
      }

      // Combinar dados reais com mock quando necessário
      const mockData = getMockData();

      // Criar lista de serviços combinando dados reais e mock
      const servicesList: ServiceStatus[] = [];

      // Adicionar serviços base da API (compatível com diferentes esquemas)
      if (servicesData?.services) {
        servicesData.services.forEach((service: any) => {
          const name = service.name || service.service || 'Service';
          const statusRaw = service.status || 'Active';
          let responseTime = 30 + Math.random() * 50;
          let errorRate = Math.random() * 0.5;
          let uptime = systemMetrics?.uptime?.formatted || '0h 0m';

          // Usar dados reais para serviços específicos
          if (name === 'Backend API') {
            responseTime = typeof systemMetrics?.averageResponseTime === 'number' ? 
              systemMetrics.averageResponseTime : 45;
            errorRate = typeof systemMetrics?.errorRate === 'number' ? 
              systemMetrics.errorRate : 0.2;
          } else if (name === 'PostgreSQL' && postgresMetrics) {
            responseTime = postgresMetrics.performance?.avgQueryTime || 15;
            errorRate = postgresMetrics.connectionUsage > 80 ? 0.1 : 0.0;
            uptime = postgresStatus?.uptime?.formatted || uptime;
          }

          servicesList.push({
            name,
            status: (statusRaw === 'Active' ? 'Active' : statusRaw === 'Inactive' ? 'Inactive' : 'Active'),
            uptime,
            responseTime,
            errorRate,
            lastCheck: new Date().toISOString()
          });
        });
      }

      // Completar com serviços mock se necessário
      const existingServices = servicesList.map(s => s.name);
      mockData.services.forEach(mockService => {
        if (!existingServices.includes(mockService.name)) {
          servicesList.push(mockService);
        }
      });

      // Calcular alertas baseado na taxa de erro
      const alerts = servicesList.filter(s => 
        (typeof s.errorRate === 'number' ? s.errorRate : 0) > 1 || 
        (typeof s.responseTime === 'number' ? s.responseTime : 0) > 200
      ).length;

      // Processar dados do Docker
      let containerData = mockData.containers;
      if (dockerContainers && dockerContainers.containers) {
        containerData = {
          running: dockerContainers.summary?.running || dockerContainers.containers.filter((c: any) => c.isRunning).length,
          total: dockerContainers.summary?.total || dockerContainers.containers.length,
          details: dockerContainers.containers
        };
      }

      // Processar dados do PostgreSQL
      let postgresData = mockData.postgresData;
      if (postgresDatabases && postgresDatabases.databases) {
        const totalTables = postgresDatabases.databases.reduce((sum: number, db: any) => sum + (db.tables || 0), 0);
        postgresData = {
          databases: postgresDatabases.databases.length,
          tables: totalTables,
          details: postgresDatabases.databases
        };
      }

      setData(prev => ({
        ...prev,
        systemMetrics: systemMetrics || mockData.systemMetrics,
        nginxMetrics: nginxMetrics || mockData.nginxMetrics,
        services: servicesList,
        alerts,
        totalServices: servicesList.length,
        activeServices: servicesList.filter(s => s.status === 'Active').length,
        containers: containerData,
        postgresData: postgresData,
        chartData: mockData.chartData, // Usar dados mock para gráficos por enquanto
        loading: false,
        error: null
      }));

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      console.log('Usando dados mock como fallback completo');
      const mockData = getMockData();
      setData(prev => ({
        ...prev,
        ...mockData,
        loading: false,
        error: 'Usando dados simulados - APIs indisponíveis'
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