import React from 'react';
import ServicePage from '../components/ServicePage';
import { ContainerOutlined } from '@ant-design/icons';

const Redis: React.FC = () => {
  const metrics = [
    { name: 'Conexões', value: 45, unit: 'conexões' },
    { name: 'Memória Usada', value: 128, unit: 'MB' },
    { name: 'Hits no Cache', value: 98, unit: '%' },
  ];

  return (
    <ServicePage
      title="Redis"
      description="Armazenamento de estrutura de dados em memória"
      icon={<ContainerOutlined style={{ fontSize: '24px', color: '#DC382D' }} />}
      metrics={metrics}
    />
  );
};

export default Redis;