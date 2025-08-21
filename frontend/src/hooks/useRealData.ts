import { useState, useEffect } from 'react';

// Hook para buscar métricas reais do Prometheus
export const usePrometheusMetrics = (query: string, prometheusUrl: string = '/prometheus') => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // URL completa para o endpoint do Prometheus
        const url = `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
          // Processar os dados para o formato esperado pelos gráficos
          const processedData = result.data.result.map((item: any, index: number) => ({
            timestamp: Date.now() - (result.data.result.length - index) * 60000,
            value: parseFloat(item.value[1]) || 0,
            metric: item.metric
          }));
          
          setData(processedData);
        } else {
          throw new Error('Failed to fetch Prometheus data');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar métricas do Prometheus:', err);
        setError('Erro ao buscar métricas');
        setLoading(false);
      }
    };

    fetchData();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [query, prometheusUrl]);

  return { data, loading, error };
};

// Hook para buscar informações reais do PostgreSQL
export const usePostgresInfo = () => {
  const [info, setInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostgresInfo = async () => {
      try {
        setLoading(true);
        
        // Buscar informações reais do PostgreSQL através da nossa API
        const response = await fetch('/api/postgres/info');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setInfo(result);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar informações do PostgreSQL:', err);
        setError('Erro ao buscar informações do PostgreSQL');
        setLoading(false);
      }
    };

    fetchPostgresInfo();
    
    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchPostgresInfo, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return { info, loading, error };
};

// Hook para buscar lista de bancos de dados do PostgreSQL
export const usePostgresDatabases = () => {
  const [databases, setDatabases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        
        // Buscar lista de bancos de dados do PostgreSQL através da nossa API
        const response = await fetch('/api/postgres/databases');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setDatabases(result);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar lista de bancos de dados:', err);
        setError('Erro ao buscar lista de bancos de dados');
        setLoading(false);
      }
    };

    fetchDatabases();
  }, []);

  return { databases, loading, error };
};

// Hook para simular informações do Docker (em uma implementação futura, isso seria substituído por chamadas reais)
export const useDockerContainers = () => {
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        setLoading(true);
        
        // Simular dados de containers (em uma implementação futura, buscaríamos do Docker API)
        const mockContainers = [
          { 
            id: 'nginx-container', 
            name: 'nginx', 
            status: 'running', 
            image: 'nginx:alpine',
            ports: '80/tcp, 443/tcp'
          },
          { 
            id: 'prometheus-container', 
            name: 'prometheus', 
            status: 'running', 
            image: 'prom/prometheus:latest',
            ports: '9090/tcp'
          },
          { 
            id: 'grafana-container', 
            name: 'grafana', 
            status: 'running', 
            image: 'grafana/grafana:latest',
            ports: '3000/tcp'
          },
          { 
            id: 'postgres-container', 
            name: 'postgres', 
            status: 'running', 
            image: 'postgres:17.6',
            ports: '5432/tcp'
          },
          { 
            id: 'automation-api-container', 
            name: 'automation-api', 
            status: 'running', 
            image: 'node:18-alpine',
            ports: '3001/tcp'
          }
        ];
        
        setContainers(mockContainers);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar containers do Docker:', err);
        setError('Erro ao buscar containers');
        setLoading(false);
      }
    };

    fetchContainers();
  }, []);

  return { containers, loading, error };
};