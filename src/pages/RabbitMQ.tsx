import React from 'react';
import ServicePage from '../components/ServicePage';
import { AppstoreOutlined } from '@ant-design/icons';

const RabbitMQ: React.FC = () => {
  const metrics = [
    { name: 'Filas', value: 12, unit: 'filas' },
    { name: 'Consumidores', value: 8, unit: 'consumidores' },
    { name: 'Mensagens Pendentes', value: 1250, unit: 'mensagens' },
  ];

  return (
    <ServicePage
      title="RabbitMQ"
      description="Broker de mensagens para comunicação assíncrona. Acesse a aplicação real em rabbitmq.cmm.am.gov.br"
      icon={<AppstoreOutlined style={{ fontSize: '24px', color: '#FF6600' }} />}
      metrics={metrics}
      externalUrl="http://localhost:15672"
    />
  );
};

export default RabbitMQ;