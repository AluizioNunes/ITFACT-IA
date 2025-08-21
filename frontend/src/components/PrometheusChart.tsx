import React from 'react';
import { Row, Col } from 'antd';
import { usePrometheusMetrics } from '../hooks/usePrometheusMetrics';
import SimpleChart from './SimpleChart';

const PrometheusChart: React.FC = () => {
  const { data: requestData, loading: requestLoading } = usePrometheusMetrics('nginx_http_requests_total');
  const { data: connectionData, loading: connectionLoading } = usePrometheusMetrics('nginx_connections_active');

  // Formatando os dados para exibição
  const formattedRequestData = requestData.map((item, index) => ({
    ...item,
    time: `T-${6-index*1}` // Simulando tempo
  }));

  const formattedConnectionData = connectionData.map((item, index) => ({
    ...item,
    time: `T-${6-index*1}` // Simulando tempo
  }));

  return (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <SimpleChart 
          data={formattedRequestData} 
          title="Requisições por Segundo" 
          loading={requestLoading} 
        />
      </Col>
      <Col span={12}>
        <SimpleChart 
          data={formattedConnectionData} 
          title="Conexões Ativas" 
          loading={connectionLoading} 
        />
      </Col>
    </Row>
  );
};

export default PrometheusChart;