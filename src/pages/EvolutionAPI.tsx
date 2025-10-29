import React from 'react';
import ServicePage from '../components/ServicePage';
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
      description="API para integração com WhatsApp. Acesse a aplicação real em whatsapp.cmm.am.gov.br"
      icon={<ApiOutlined style={{ fontSize: '24px', color: '#25D366' }} />}
      metrics={metrics}
      externalUrl="http://localhost:8081"
    />
  );
};

export default EvolutionAPI;