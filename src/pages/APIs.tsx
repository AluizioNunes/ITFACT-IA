import React, { useState, useEffect } from 'react';
import { Card, Divider, Row, Col, Statistic, Button, Table, Alert, Progress, Tag, Space, Spin } from 'antd';
import { ApiOutlined, LinkOutlined, ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, headerVariants, statusCardVariants, performanceCardVariants, chartCardVariants, tableVariants, buttonVariants } from '../ui/animations';
import { useRealApiData } from '../hooks/useRealApiData';
import ApiChart from '../components/ApiChart';

// Variantes importadas do módulo compartilhado

// headerVariants importado do módulo compartilhado

// statusCardVariants importado do módulo compartilhado

// performanceCardVariants importado do módulo compartilhado

// chartCardVariants importado do módulo compartilhado

// tableVariants importado do módulo compartilhado

// buttonVariants importado do módulo compartilhado

const APIs: React.FC = () => {
  const { metrics, endpoints, performance, health, info, services, loading, error, refetch } = useRealApiData(); // Removed refresh interval
  
  // State for historical data for charts
  const [responseTimeHistory, setResponseTimeHistory] = useState<Array<{ time: string; value: number }>>([]);
  const [requestsHistory, setRequestsHistory] = useState<Array<{ time: string; value: number }>>([]);
  const [memoryHistory, setMemoryHistory] = useState<Array<{ time: string; value: number }>>([]);

  // Update historical data when new metrics arrive
  useEffect(() => {
    if (metrics) {
      const currentTime = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      
      // Update response time history
      setResponseTimeHistory(prev => {
        const newData = [...prev, { time: currentTime, value: metrics.averageResponseTime || 0 }];
        return newData.slice(-20); // Keep last 20 points
      });
      
      // Update requests history
      setRequestsHistory(prev => {
        const newData = [...prev, { time: currentTime, value: metrics.requestsPerMinute || 0 }];
        return newData.slice(-20); // Keep last 20 points
      });
    }
  }, [metrics]);

  // Update memory usage history
  useEffect(() => {
    if (performance) {
      const currentTime = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      
      setMemoryHistory(prev => {
        const newData = [...prev, { time: currentTime, value: performance.memory.heapUsedPercentage || 0 }];
        return newData.slice(-20); // Keep last 20 points
      });
    }
  }, [performance]);

  // Preparar dados para exibição (charts serão adicionados após instalação da biblioteca)
  const currentTime = new Date().toLocaleTimeString();

  // Colunas da tabela de endpoints
  const endpointColumns = [
    {
      title: 'Endpoint',
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => <code>{path}</code>,
    },
    {
      title: 'Requests',
      dataIndex: 'requests',
      key: 'requests',
      sorter: (a: any, b: any) => a.requests - b.requests,
      render: (requests: number) => <strong>{requests}</strong>,
    },
    {
      title: 'Último Acesso',
      dataIndex: 'lastAccess',
      key: 'lastAccess',
      render: (lastAccess: string) => lastAccess ? new Date(lastAccess).toLocaleString() : 'N/A',
    },
    {
      title: 'Erros',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors: number) => errors > 0 ? <Tag color="red">{errors}</Tag> : <Tag color="green">0</Tag>,
    },
    {
      title: 'Taxa de Erro',
      dataIndex: 'errorRate',
      key: 'errorRate',
      render: (errorRate: string) => {
        const rate = parseFloat(errorRate);
        const color = rate > 5 ? 'red' : rate > 2 ? 'orange' : 'green';
        return <Tag color={color}>{errorRate}%</Tag>;
      },
    },
  ];

  if (loading && !metrics) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', padding: '50px' }}
      >
        <Spin size="large" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ marginTop: 16 }}
        >
          Carregando dados da API...
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Alert
          message="Erro ao carregar dados da API"
          description={error}
          type="error"
          action={
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button size="small" type="primary" onClick={refetch}>
                Tentar Novamente
              </Button>
            </motion.div>
          }
        />
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div
          variants={headerVariants}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}
        >
          <div>
            <Divider orientation="left">
              <Space>
                <ApiOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                API'S SWAGGER - Monitoramento em Tempo Real
              </Space>
            </Divider>
          </div>
          <Space>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button icon={<ReloadOutlined />} onClick={refetch} loading={loading}>
                Atualizar
              </Button>
            </motion.div>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button 
                type="primary" 
                icon={<LinkOutlined />}
                onClick={() => window.open('/api/docs', '_blank')}
              >
                Acessar Swagger
              </Button>
            </motion.div>
          </Space>
        </motion.div>

        {/* Status Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <motion.div variants={statusCardVariants} whileHover="hover" whileTap="tap">
              <Card>
                <Statistic
                  title="Status da API"
                  value={health?.status || 'Unknown'}
                  valueStyle={{ color: health?.status === 'OK' ? '#3f8600' : '#cf1322' }}
                  prefix={health?.status === 'OK' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                />
              </Card>
            </motion.div>
          </Col>
          <Col span={6}>
            <motion.div variants={statusCardVariants} whileHover="hover" whileTap="tap">
              <Card>
                <Statistic
                  title="Total de Requests"
                  value={metrics?.totalRequests || 0}
                  suffix="reqs"
                />
              </Card>
            </motion.div>
          </Col>
          <Col span={6}>
            <motion.div variants={statusCardVariants} whileHover="hover" whileTap="tap">
              <Card>
                <Statistic
                  title="Requests/Minuto"
                  value={metrics?.requestsPerMinute || 0}
                  suffix="req/min"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col span={6}>
            <motion.div variants={statusCardVariants} whileHover="hover" whileTap="tap">
              <Card>
                <Statistic
                  title="Tempo Médio de Resposta"
                  value={metrics?.averageResponseTime || 0}
                  suffix="ms"
                  precision={2}
                  valueStyle={{ color: (metrics?.averageResponseTime || 0) > 100 ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Performance Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <motion.div variants={performanceCardVariants} whileHover="hover">
              <Card title="Uso de Memória" size="small">
                <div style={{ marginBottom: 16 }}>
                  <div>Heap Usado: {performance?.memory.heapUsed || 0} MB</div>
                  <Progress 
                    percent={performance?.memory.heapUsedPercentage || 0} 
                    size="small" 
                    status={(performance?.memory.heapUsedPercentage || 0) > 80 ? 'exception' : 'active'}
                  />
                </div>
                <div>
                  <div>RSS: {performance?.memory.rss || 0} MB</div>
                  <div>Heap Total: {performance?.memory.heapTotal || 0} MB</div>
                </div>
              </Card>
            </motion.div>
          </Col>
          <Col span={8}>
            <motion.div variants={performanceCardVariants} whileHover="hover">
              <Card title="Informações do Sistema" size="small">
                <div>Node.js: {info?.nodeVersion || 'N/A'}</div>
                <div>Plataforma: {info?.platform || 'N/A'}</div>
                <div>Ambiente: {info?.environment || 'N/A'}</div>
                <div>Uptime: {metrics?.uptime?.formatted || 'N/A'}</div>
              </Card>
            </motion.div>
          </Col>
          <Col span={8}>
            <motion.div variants={performanceCardVariants} whileHover="hover">
              <Card title="Qualidade da API" size="small">
                <div style={{ marginBottom: 8 }}>Taxa de Erro: {metrics?.errorRate || 0}%</div>
                <Progress 
                  percent={parseFloat(metrics?.errorRate || '0')} 
                  size="small" 
                  status={parseFloat(metrics?.errorRate || '0') > 5 ? 'exception' : 'success'}
                />
                <div style={{ marginTop: 8 }}>Total de Erros: {metrics?.errors || 0}</div>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Gráficos Profissionais com Highcharts */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <motion.div variants={chartCardVariants} whileHover="hover">
              <Card title="Tempo de Resposta da API (Tempo Real)" size="small" extra={<div style={{ fontSize: '11px', color: '#666' }}>Últimos {responseTimeHistory.length} registros</div>}>
                {responseTimeHistory.length > 0 ? (
                  <ApiChart
                    title="Tempo de Resposta"
                    data={responseTimeHistory}
                    color="#1890ff"
                    unit="ms"
                    height={200}
                    type="spline"
                    theme="modern"
                    animation="smooth"
                    showDataZoom={true}
                    gradient={true}
                  />
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    Aguardando dados...
                  </div>
                )}
              </Card>
            </motion.div>
          </Col>
          <Col span={12}>
            <motion.div variants={chartCardVariants} whileHover="hover">
              <Card title="Volume de Requests (Tempo Real)" size="small" extra={<div style={{ fontSize: '11px', color: '#666' }}>Taxa por minuto</div>}>
                {requestsHistory.length > 0 ? (
                  <ApiChart
                    title="Requests por Minuto"
                    data={requestsHistory}
                    color="#52c41a"
                    unit=" req/min"
                    height={200}
                    type="area"
                    theme="modern"
                    animation="elastic"
                    showDataZoom={true}
                    gradient={true}
                  />
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    Aguardando dados...
                  </div>
                )}
              </Card>
            </motion.div>
          </Col>
        </Row>
        
        {/* Gráfico adicional de memória em linha separada */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <motion.div variants={chartCardVariants} whileHover="hover">
              <Card title="Uso de Memória Heap (Tempo Real)" size="small" extra={<div style={{ fontSize: '11px', color: '#666' }}>Porcentagem utilizada</div>}>
                {memoryHistory.length > 0 ? (
                  <ApiChart
                    title="Memória Heap"
                    data={memoryHistory}
                    color="#f5222d"
                    unit="%"
                    height={200}
                    type="line"
                    theme="modern"
                    animation="bounce"
                    showDataZoom={true}
                    gradient={true}
                  />
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    Aguardando dados...
                  </div>
                )}
              </Card>
            </motion.div>
          </Col>
          <Col span={12}>
            <motion.div variants={performanceCardVariants} whileHover="hover">
              <Card title="Resumo de Performance" size="small">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                        {metrics?.totalRequests || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Total Requests</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                        {metrics?.averageResponseTime?.toFixed(1) || 0}ms
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Tempo Médio</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                        {metrics?.errorRate || 0}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Taxa de Erro</div>
                    </Col>
                  </Row>
                </div>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Services Status */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <motion.div variants={performanceCardVariants} whileHover="hover">
              <Card title="Status dos Serviços" size="small">
                {services?.services.map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
                  >
                    <span>{service.name}</span>
                    <Tag color={service.status === 'Active' ? 'green' : 'red'}>
                      {service.status}
                    </Tag>
                  </motion.div>
                ))}
              </Card>
            </motion.div>
          </Col>
          <Col span={12}>
            <motion.div variants={performanceCardVariants} whileHover="hover">
              <Card title="Últimas Atualizações" size="small">
                <div>Última Request: {metrics?.lastRequestTime ? new Date(metrics.lastRequestTime).toLocaleString() : 'N/A'}</div>
                <div>Serviços Ativos: {services?.activeServices || 0}/{services?.totalServices || 0}</div>
                <div>Endpoints Disponíveis: {endpoints?.totalEndpoints || 0}</div>
                <div>Endpoint Mais Usado: {endpoints?.mostUsed?.path || 'N/A'}</div>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Endpoints Table */}
        <motion.div variants={tableVariants}>
          <Card title="Estatísticas de Endpoints" size="small">
            <Table
              columns={endpointColumns}
              dataSource={endpoints?.endpoints || []}
              rowKey="path"
              size="small"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default APIs;