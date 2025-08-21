import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Divider, Statistic, Table, Spin, Alert } from 'antd';
import { motion } from 'framer-motion';
import { CloudServerOutlined, BarChartOutlined, LineChartOutlined, DatabaseOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SimpleChart from '../components/SimpleChart';
import { usePrometheusMetrics } from '../hooks/useRealData';

const Nginx: React.FC = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  
  // Buscar métricas reais do Prometheus
  const { data: requestData, loading: requestLoading, error: requestError } = usePrometheusMetrics('nginx_http_requests_total');
  const { data: connectionData, loading: connectionLoading, error: connectionError } = usePrometheusMetrics('nginx_connections_active');

  // Simular dados de métricas iniciais
  useEffect(() => {
    // Dados simulados de métricas
    const mockMetrics = [
      { id: 1, name: 'Requisições por segundo', value: 1250, unit: 'req/s', trend: 'up' },
      { id: 2, name: 'Conexões ativas', value: 342, unit: 'conexões', trend: 'stable' },
      { id: 3, name: 'Taxa de erro 5xx', value: 0.2, unit: '%', trend: 'down' },
      { id: 4, name: 'Latência média', value: 45, unit: 'ms', trend: 'stable' },
    ];

    // Dados simulados de aplicações
    const mockApplications = [
      { key: '1', name: 'Grafana', path: '/grafana', requests: 12400, status: 'Operacional' },
      { key: '2', name: 'Prometheus', path: '/prometheus', requests: 8900, status: 'Operacional' },
      { key: '3', name: 'N8N', path: '/n8n', requests: 5600, status: 'Operacional' },
      { key: '4', name: 'Chatwoot', path: '/chatwoot', requests: 3200, status: 'Operacional' },
      { key: '5', name: 'Evolution API', path: '/evolutionapi', requests: 2100, status: 'Operacional' },
    ];

    setMetrics(mockMetrics);
    setApplications(mockApplications);
  }, []);

  const columns = [
    {
      title: 'Aplicação',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: 'Requisições',
      dataIndex: 'requests',
      key: 'requests',
      sorter: (a: any, b: any) => a.requests - b.requests,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'Operacional' ? '#52c41a' : '#ff4d4f' }}>
          {status}
        </span>
      ),
    },
  ];

  // Verificar se há erros nas requisições
  const hasErrors = requestError || connectionError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Divider orientation="left">Métricas do Nginx</Divider>
      
      {hasErrors && (
        <Alert 
          message="Erro de Conexão" 
          description="Não foi possível conectar ao Prometheus. Mostrando dados simulados."
          type="warning" 
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Row gutter={[16, 16]}>
        {metrics.map((metric, index) => (
          <Col span={6} key={metric.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <Statistic
                  title={metric.name}
                  value={metric.value}
                  suffix={metric.unit}
                  prefix={metric.trend === 'up' ? <BarChartOutlined style={{ color: '#52c41a' }} /> : 
                         metric.trend === 'down' ? <BarChartOutlined style={{ color: '#ff4d4f' }} /> : 
                         <LineChartOutlined />}
                />
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Divider orientation="left" style={{ marginTop: 32 }}>Aplicações Controladas</Divider>
      <Card>
        <Table 
          dataSource={applications} 
          columns={columns} 
          pagination={false}
          scroll={{ y: 400 }}
        />
      </Card>

      <Divider orientation="left" style={{ marginTop: 32 }}>Gráficos de Métricas</Divider>
      
      {(requestLoading || connectionLoading) ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>Carregando métricas do Prometheus...</p>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <SimpleChart 
              data={requestData.map((item, index) => ({
                ...item,
                time: `T-${requestData.length - index}`
              }))} 
              title="Requisições por Segundo" 
              loading={requestLoading} 
            />
          </Col>
          <Col span={12}>
            <SimpleChart 
              data={connectionData.map((item, index) => ({
                ...item,
                time: `T-${connectionData.length - index}`
              }))} 
              title="Conexões Ativas" 
              loading={connectionLoading} 
            />
          </Col>
        </Row>
      )}

      <Divider orientation="left" style={{ marginTop: 32 }}>Detalhes Técnicos</Divider>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Versão" extra={<DatabaseOutlined />}>
            <p>Nginx 1.25.3</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Última Atualização" extra={<CloudServerOutlined />}>
            <p>{format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Configuração" extra={<LineChartOutlined />}>
            <p>Proxy Reverso Ativo</p>
            <p>SSL/TLS Configurado</p>
            <p>Load Balancing Ativo</p>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Nginx;