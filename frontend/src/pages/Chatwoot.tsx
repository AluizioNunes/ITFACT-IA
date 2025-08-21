import React from 'react';
import ServicePage from '../components/ServicePage';
import { WechatOutlined } from '@ant-design/icons';

const Chatwoot: React.FC = () => {
  const metrics = [
    { name: 'Conversas Ativas', value: 32, unit: 'conversas' },
    { name: 'Agentes Online', value: 5, unit: 'agentes' },
    { name: 'Mensagens Hoje', value: 1250, unit: 'mensagens' },
  ];

  return (
    <ServicePage
      title="Chatwoot"
      description="Plataforma de atendimento ao cliente"
      icon={<WechatOutlined style={{ fontSize: '24px', color: '#1f93ff' }} />}
      metrics={metrics}
    />
  );
};

export default Chatwoot;