import React from 'react';
import ServicePage from '../components/ServicePage';
import { ApiOutlined } from '@ant-design/icons';

const N8N: React.FC = () => {
  const metrics = [
    { name: 'Workflows Ativos', value: 18, unit: 'workflows' },
    { name: 'Execuções Hoje', value: 1250, unit: 'execuções' },
    { name: 'Nós Conectados', value: 45, unit: 'nós' },
  ];

  return (
    <ServicePage
      title="N8N"
      description="Plataforma de automação de workflows. Acesse a aplicação real em n8n.cmm.am.gov.br"
      icon={<ApiOutlined style={{ fontSize: '24px', color: '#ff6d5a' }} />}
      metrics={metrics}
      externalUrl="https://n8n.cmm.am.gov.br"
    />
  );
};

export default N8N;