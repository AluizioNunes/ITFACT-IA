import React from 'react';
import ServicePage from '../components/ServicePage';
import { BarChartOutlined } from '@ant-design/icons';

const Prometheus: React.FC = () => {
  const metrics = [
    { name: 'Targets Ativos', value: 12, unit: 'targets' },
    { name: 'Series Temporais', value: 125000, unit: 'series' },
    { name: 'Retenção de Dados', value: 15, unit: 'dias' },
  ];

  return (
    <ServicePage
      title="Prometheus"
      description="Sistema de monitoramento e alerta de código aberto. Acesse a aplicação real em prometheus.cmm.am.gov.br"
      icon={<BarChartOutlined style={{ fontSize: '24px', color: '#e60000' }} />}
      metrics={metrics}
      externalUrl="https://prometheus.cmm.am.gov.br"
    />
  );
};

export default Prometheus;