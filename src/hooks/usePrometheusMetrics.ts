import { useState, useEffect } from 'react';

// Hook simulado para buscar métricas do Prometheus
export const usePrometheusMetrics = (query: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular chamada à API do Prometheus
    const fetchData = async () => {
      try {
        setLoading(true);
        // Em uma implementação real, você faria:
        // const response = await fetch(`http://seu-prometheus:9090/api/v1/query?query=${encodeURIComponent(query)}`);
        // const result = await response.json();
        
        // Simulando dados
        const mockData = [
          { timestamp: Date.now() - 300000, value: Math.random() * 100 },
          { timestamp: Date.now() - 240000, value: Math.random() * 100 },
          { timestamp: Date.now() - 180000, value: Math.random() * 100 },
          { timestamp: Date.now() - 120000, value: Math.random() * 100 },
          { timestamp: Date.now() - 60000, value: Math.random() * 100 },
          { timestamp: Date.now(), value: Math.random() * 100 },
        ];
        
        setData(mockData);
        setLoading(false);
      } catch (err) {
        setError('Erro ao buscar métricas');
        setLoading(false);
      }
    };

    fetchData();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [query]);

  return { data, loading, error };
};