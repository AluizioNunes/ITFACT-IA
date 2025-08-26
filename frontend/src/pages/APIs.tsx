import React from 'react';
import ServicePage from '../components/ServicePage';
import { ApiOutlined } from '@ant-design/icons';

const APIs: React.FC = () => {
  const metrics = [
    { name: 'Endpoints Ativos', value: 12, unit: 'endpoints' },
    { name: 'Requisições/min', value: 450, unit: 'req/min' },
    { name: 'Tempo Resposta', value: 85, unit: 'ms' },
  ];

  return (
    <ServicePage
      title="API'S"
      description="Central de APIs do sistema. Acesse a API principal em automacao.cmm.am.gov.br/api e a documentação Swagger em /api/docs"
      icon={<ApiOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
      metrics={metrics}
      externalUrl="/api/"
    />
  );
};

export default APIs;