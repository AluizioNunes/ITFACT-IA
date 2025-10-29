import React from 'react';
import ServicePage from '../components/ServicePage';
import { getServiceUrl } from '../config/services';
import { WhatsAppOutlined } from '@ant-design/icons';

const WhatsApp: React.FC = () => {
  const metrics = [
    { name: 'Contatos', value: 1250, unit: 'contatos' },
    { name: 'Grupos', value: 25, unit: 'grupos' },
    { name: 'Mensagens Enviadas', value: 5420, unit: 'mensagens' },
  ];

  return (
    <ServicePage
      title="WhatsApp"
      description="Integração com WhatsApp via Evolution API."
      icon={<WhatsAppOutlined style={{ fontSize: '24px', color: '#25D366' }} />}
      metrics={metrics}
      externalUrl={getServiceUrl('whatsapp')}
    />
  );
};

export default WhatsApp;