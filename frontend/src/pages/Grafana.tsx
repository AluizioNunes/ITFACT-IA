import React from 'react';
import ServicePage from '../components/ServicePage';
import { LineChartOutlined } from '@ant-design/icons';

const Grafana: React.FC = () => {
  const metrics = [
    { name: 'Dashboards', value: 8, unit: 'painéis' },
    { name: 'Data Sources', value: 3, unit: 'fontes' },
    { name: 'Usuários Ativos', value: 5, unit: 'usuários' },
  ];

  return (
    <ServicePage
      title="Grafana"
      description="Plataforma de análise e visualização de métricas"
      icon={<LineChartOutlined style={{ fontSize: '24px', color: '#f60' }} />}
      metrics={metrics}
    />
  );
};

export default Grafana;