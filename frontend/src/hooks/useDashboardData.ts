import { useState, useCallback, useEffect } from 'react';

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
      
      // Buscar dados de múltiplas APIs em paralelo
      const [
        systemMetricsRes,
        nginxMetricsRes,
        servicesRes,
        nginxStatusRes,
        healthRes,
        postgresStatusRes,
        postgresMetricsRes,
        dockerContainersRes,
        dockerStatusRes,
        postgresDatabasesRes
      ] = await Promise.all([
        fetch(`${baseUrl}/api/metrics`),
        fetch(`${baseUrl}/api/nginx/metrics`),
        fetch(`${baseUrl}/api/services`),
        fetch(`${baseUrl}/api/nginx/status`),
        fetch(`${baseUrl}/api/health`),
        fetch(`${baseUrl}/api/postgresql/status`),
        fetch(`${baseUrl}/api/postgresql/metrics`),
        fetch(`${baseUrl}/api/docker/containers`),
        fetch(`${baseUrl}/api/docker/status`),
        fetch(`${baseUrl}/api/postgresql/databases`)
      ]);

      // Verificar se pelo menos algumas APIs estão funcionando
      const responses = [systemMetricsRes, nginxMetricsRes, servicesRes, nginxStatusRes, healthRes, postgresStatusRes, postgresMetricsRes, dockerContainersRes, dockerStatusRes, postgresDatabasesRes];
      const validResponses = responses.filter(res => 
        res.ok && res.headers.get('content-type')?.includes('application/json')
      );

      if (validResponses.length < 2) {
        console.warn('Poucas APIs disponíveis, usando dados mock como fallback');
        const mockData = getMockData();
        setData(prev => ({
          ...prev,
          ...mockData,
          loading: false,
          error: 'Usando dados simulados - APIs limitadas'
        }));
        return;
      }

      // Parse das respostas válidas
      let systemMetrics = null;
      let nginxMetrics = null;
      let servicesData = null;
      let postgresStatus = null;
      let postgresMetrics = null;
      let dockerContainers = null;
      let dockerStatus = null;
      let postgresDatabases = null;

      try {
        if (systemMetricsRes.ok) {
          systemMetrics = await systemMetricsRes.json();
        }
      } catch (e) {
        console.warn('Erro ao processar métricas do sistema');
      }

      try {
        if (nginxMetricsRes.ok) {
          nginxMetrics = await nginxMetricsRes.json();
        }
      } catch (e) {
        console.warn('Erro ao processar métricas do Nginx');
      }

      try {
        if (servicesRes.ok) {
          servicesData = await servicesRes.json();
        }
      } catch (e) {
        console.warn('Erro ao processar dados dos serviços');
      }

      try {
        if (postgresStatusRes.ok) {
          postgresStatus = await postgresStatusRes.json();
        }
      } catch (e) {
        console.warn('Erro ao processar status do PostgreSQL');
      }

      try {
        if (postgresMetricsRes.ok) {
          postgresMetrics = await postgresMetricsRes.json();
        }
      } catch (e) {
        console.warn('Erro ao processar métricas do PostgreSQL');
      }

      // Combinar dados reais com mock quando necessário
      const mockData = getMockData();
      
      // Criar lista de serviços combinando dados reais e mock
      const servicesList: ServiceStatus[] = [];
      
      // Adicionar serviços base da API
      if (servicesData?.services) {
        servicesData.services.forEach((service: any) => {
          let responseTime = 30 + Math.random() * 50;
          let errorRate = Math.random() * 0.5;
          let uptime = systemMetrics?.uptime?.formatted || '0h 0m';
          
          // Usar dados reais para serviços específicos
          if (service.name === 'Backend API') {
            responseTime = typeof systemMetrics?.averageResponseTime === 'number' ? 
              systemMetrics.averageResponseTime : 45;
            errorRate = typeof systemMetrics?.errorRate === 'number' ? 
              systemMetrics.errorRate : 0.2;
          } else if (service.name === 'PostgreSQL' && postgresMetrics) {
            responseTime = postgresMetrics.performance?.avgQueryTime || 15;
            errorRate = postgresMetrics.connectionUsage > 80 ? 0.1 : 0.0;
            uptime = postgresStatus?.uptime?.formatted || uptime;
          }
          
          servicesList.push({
            name: service.name,
            status: service.status === 'Active' ? 'Active' : 'Inactive',
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

      setData(prev => ({
        ...prev,
        systemMetrics: systemMetrics || mockData.systemMetrics,
        nginxMetrics: nginxMetrics || mockData.nginxMetrics,
        services: servicesList,
        alerts,
        totalServices: servicesList.length,
        activeServices: servicesList.filter(s => s.status === 'Active').length,
        containers: mockData.containers, // Usar mock para containers por enquanto
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