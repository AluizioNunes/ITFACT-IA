import React from 'react';
import ServicePage from '../components/ServicePage';
import { getServiceUrl } from '../config/services';
import { ApiOutlined } from '@ant-design/icons';

const EvolutionAPI: React.FC = () => {
  const metrics = [
    { name: 'Conexões WhatsApp', value: 25, unit: 'conexões' },
    { name: 'Mensagens Hoje', value: 5420, unit: 'mensagens' },
    { name: 'Instâncias Ativas', value: 8, unit: 'instâncias' },
  ];

  return (
    <ServicePage
      title="Evolution API"
      description="API para integração com WhatsApp (instâncias e webhooks)."
      icon={<ApiOutlined style={{ fontSize: '24px', color: '#25D366' }} />}
      metrics={metrics}
      externalUrl={getServiceUrl('evolutionApi')}
    />
  );
};

export default EvolutionAPI;