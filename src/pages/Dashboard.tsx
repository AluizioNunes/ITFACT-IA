import React, { useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Divider, Spin, Alert, Button, Tag, Progress, Space, Modal, Select, Table } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, cardVariants, statisticVariants, chartVariants, serviceCardVariants } from '../ui/animations';
import type { Variants } from 'framer-motion';
import {
  BarChartOutlined,
  LineChartOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ApiOutlined,
  WechatOutlined,
  WhatsAppOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  DockerOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDockerFleet } from '../hooks/useDockerFleet';
import ApiChart from '../components/ApiChart';

// Variantes importadas do módulo compartilhado

// cardVariants importado do módulo compartilhado

// statisticVariants importado do módulo compartilhado

// chartVariants importado do módulo compartilhado

// serviceCardVariants importado do módulo compartilhado

const Dashboard: React.FC = () => {
  const { 
    systemMetrics, 
    nginxMetrics, 
    services, 
    alerts, 
    totalServices, 
    activeServices, 
    postgresData,
    chartData,
    loading, 
    error, 
    refetch 
  } = useDashboardData();

  // Fleet Docker (dados reais agregados)
  const {
    servers,
    selectedIps,
    setSelectedIps,
    containers: fleetContainers,
    summary: fleetSummary,
    loading: fleetLoading,
    refetch: fleetRefetch,
  } = useDockerFleet();

  const [dockerModalOpen, setDockerModalOpen] = React.useState(false);

  // Evitar dupla chamada em modo Strict no dev
  const fetchedOnce = useRef(false);
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    refetch();
  }, [refetch]);

  // Efeito de montagem tratado pelo guard fetchedOnce acima
  
  // Função para obter cor baseada no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#52c41a';
      case 'Warning': return '#faad14';
      case 'Inactive': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  // Função para obter ícone baseado no nome do serviço
  const getServiceIcon = (serviceName: string) => {
    const iconMap: { [key: string]: React.ReactElement } = {
      'Grafana': <LineChartOutlined />,
      'Nginx': <CloudServerOutlined />,
      'PostgreSQL': <DatabaseOutlined />,
      'Backend API': <ApiOutlined />,
      'Frontend': <BarChartOutlined />,
      'N8N': <ApiOutlined />,
      'Evolution API': <ApiOutlined />,
      'Chatwoot': <WechatOutlined />,
      'WhatsApp': <WhatsAppOutlined />,
      'Redis': <ContainerOutlined />,
      'RabbitMQ': <AppstoreOutlined />
    };
    return iconMap[serviceName] || <CheckCircleOutlined />;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ perspective: 1000 }}
    >
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ 
          type: "spring", 
          damping: 20, 
          stiffness: 100,
          delay: 0.1 
        }}
      >
        <Divider orientation="left">
          Dashboard - Visão Geral do Sistema
          <motion.div
            style={{ display: 'inline-block', marginLeft: 16 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={refetch} 
              loading={loading}
            >
              Atualizar
            </Button>
          </motion.div>
        </Divider>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <Alert 
              message="Aviso" 
              description={error} 
              type="warning" 
              showIcon 
              style={{ marginBottom: 16 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Spin spinning={loading}>
        {/* Métricas Principais do Sistema */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Card onClick={() => setDockerModalOpen(true)} style={{ cursor: 'pointer' }}>
                  <motion.div variants={statisticVariants}>
                    <Statistic 
                      title="Containers Docker" 
                      value={fleetSummary.running} 
                      suffix={`/ ${fleetSummary.total}`}
                      prefix={<DockerOutlined style={{ color: '#1890ff' }} />}
                      valueStyle={{ color: fleetSummary.running === fleetSummary.total ? '#3f8600' : '#faad14' }}
                    />
                  </motion.div>
                  {fleetContainers && fleetContainers.length > 0 && (
                    <motion.div 
                      style={{ marginTop: 8, fontSize: '12px', color: '#888' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div>
                        <div>{fleetContainers[0].host} • {fleetContainers[0].name}: {fleetContainers[0].status || fleetContainers[0].state}</div>
                        {fleetContainers.length > 1 && (
                          <div>+{fleetContainers.length - 1} outros containers</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            </Col>
            <Col span={6}>
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Card>
                  <motion.div variants={statisticVariants}>
                    <Statistic 
                      title="Bancos PostgreSQL" 
                      value={postgresData.databases} 
                      suffix={`/ ${postgresData.tables} tabelas`}
                      prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </motion.div>
                  {postgresData.details && (
                    <motion.div 
                      style={{ marginTop: 8, fontSize: '12px', color: '#888' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {postgresData.details.length > 0 ? (
                        <div>
                          <div>{postgresData.details[0].name}: {postgresData.details[0].tables} tabelas</div>
                          {postgresData.details.length > 1 && (
                            <div>+{postgresData.details.length - 1} outros bancos</div>
                          )}
                        </div>
                      ) : (
                        <div>Sem bancos de dados</div>
                      )}
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            </Col>
            <Col span={6}>
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Card>
                  <motion.div variants={statisticVariants}>
                    <Statistic 
                      title="Alertas" 
                      value={alerts} 
                      prefix={<BellOutlined style={{ color: alerts > 0 ? '#ff4d4f' : '#52c41a' }} />}
                      valueStyle={{ color: alerts > 0 ? '#cf1322' : '#3f8600' }}
                    />
                  </motion.div>
                </Card>
              </motion.div>
            </Col>
            <Col span={6}>
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Card>
                  <motion.div variants={statisticVariants}>
                    <Statistic 
                      title="Serviços Ativos" 
                      value={activeServices} 
                      suffix={`/ ${totalServices}`}
                      prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      valueStyle={{ color: activeServices === totalServices ? '#3f8600' : '#faad14' }}
                    />
                  </motion.div>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>

        {/* Métricas de Performance */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring", damping: 25, stiffness: 120 }}
        >
          <Divider orientation="left" style={{ marginTop: 32 }}>Performance do Sistema</Divider>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <Card>
                  <Statistic
                    title="Tempo de Resposta Médio"
                    value={systemMetrics?.averageResponseTime || 0}
                    suffix="ms"
                    prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                    valueStyle={{ color: '#fa8c16' }}
                    precision={1}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={6}>
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <Card>
                  <Statistic
                    title="Taxa de Erro Global"
                    value={systemMetrics?.errorRate || 0}
                    suffix="%"
                    prefix={<ExclamationCircleOutlined style={{ color: systemMetrics?.errorRate && systemMetrics.errorRate > 1 ? '#ff4d4f' : '#52c41a' }} />}
                    valueStyle={{ color: systemMetrics?.errorRate && systemMetrics.errorRate > 1 ? '#cf1322' : '#3f8600' }}
                    precision={2}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={6}>
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <Card>
                  <Statistic
                    title="Nginx - Req/seg"
                    value={nginxMetrics?.requestsPerSecond || 0}
                    suffix="req/s"
                    prefix={<CloudServerOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={6}>
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <Card>
                  <Statistic
                    title="Uptime do Sistema"
                    value={systemMetrics?.uptime?.formatted || '0h 0m'}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>

        {/* Gráficos de Monitoramento */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: "spring", damping: 25, stiffness: 120 }}
        >
          <Divider orientation="left" style={{ marginTop: 32 }}>Gráficos de Monitoramento</Divider>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <Card title="Requisições por Minuto" extra={<ThunderboltOutlined />}>
                  <ApiChart 
                    title="Req/min"
                    data={chartData.requestsHistory}
                    color="#722ed1"
                    unit=" req/min"
                    height={250}
                    type="line"
                    theme="modern"
                    animation="smooth"
                    gradient={true}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={12}>
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <Card title="Tempo de Resposta" extra={<ClockCircleOutlined />}>
                  <ApiChart 
                    title="Latência"
                    data={chartData.responseTimeHistory}
                    color="#fa8c16"
                    unit="ms"
                    height={250}
                    type="spline"
                    theme="modern"
                    animation="elastic"
                    gradient={true}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={12}>
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <Card title="Taxa de Erro" extra={<ExclamationCircleOutlined />}>
                  <ApiChart 
                    title="Taxa de Erro"
                    data={chartData.errorRateHistory}
                    color="#ff4d4f"
                    unit="%"
                    height={250}
                    type="area"
                    theme="modern"
                    animation="bounce"
                    gradient={true}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={12}>
              <motion.div
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <Card title="Conexões Nginx" extra={<CloudServerOutlined />}>
                  <ApiChart 
                    title="Conexões"
                    data={chartData.connectionsHistory}
                    color="#1890ff"
                    unit=" conn"
                    height={250}
                    type="area"
                    theme="modern"
                    animation="smooth"
                    gradient={true}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>

        {/* Status Detalhado dos Serviços */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, type: "spring", damping: 25, stiffness: 120 }}
        >
          <Divider orientation="left" style={{ marginTop: 32 }}>Status dos Serviços</Divider>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Row gutter={[16, 16]}>
              {services.map((service, index) => (
                <Col span={8} key={index}>
                  <motion.div
                    custom={index}
                    variants={serviceCardVariants}
                    whileHover="hover"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <Card 
                      size="small"
                      title={
                        <Space>
                          {getServiceIcon(service.name)}
                          <span>{service.name}</span>
                        </Space>
                      }
                      extra={
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1, type: "spring", damping: 15, stiffness: 300 }}
                        >
                          <Tag color={service.status === 'Active' ? 'green' : service.status === 'Warning' ? 'orange' : 'red'}>
                            {service.status === 'Active' ? 'Ativo' : service.status === 'Warning' ? 'Atenção' : 'Inativo'}
                          </Tag>
                        </motion.div>
                      }
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <motion.div 
                          style={{ display: 'flex', justifyContent: 'space-between' }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          <span>Tempo Resp.:</span>
                          <span style={{ 
                            color: service.responseTime > 200 ? '#ff4d4f' : 
                                   service.responseTime > 100 ? '#faad14' : '#52c41a' 
                          }}>
                            {Math.round(service.responseTime)}ms
                          </span>
                        </motion.div>
                        <motion.div 
                          style={{ display: 'flex', justifyContent: 'space-between' }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                        >
                          <span>Taxa de Erro:</span>
                          <span style={{ 
                            color: (service.errorRate || 0) > 1 ? '#ff4d4f' : 
                                   (service.errorRate || 0) > 0.5 ? '#faad14' : '#52c41a' 
                          }}>
                            {typeof service.errorRate === 'number' ? service.errorRate.toFixed(2) : '0.00'}%
                          </span>
                        </motion.div>
                        <motion.div 
                          style={{ display: 'flex', justifyContent: 'space-between' }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                        >
                          <span>Uptime:</span>
                          <span style={{ color: '#52c41a', fontSize: '12px' }}>
                            {service.uptime}
                          </span>
                        </motion.div>
                        
                        {/* Barra de progresso para saúde geral */}
                        <motion.div 
                          style={{ marginTop: 8 }}
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          transition={{ delay: 0.9 + index * 0.1, type: "spring", damping: 20, stiffness: 200 }}
                        >
                          <div style={{ fontSize: '12px', marginBottom: 4 }}>Saúde Geral:</div>
                          <Progress 
                            percent={Math.round(100 - ((service.errorRate || 0) * 10) - (service.responseTime > 100 ? 20 : 0))} 
                            size="small" 
                            status={service.status === 'Active' ? 'success' : 'exception'}
                            showInfo={false}
                          />
                        </motion.div>
                      </Space>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        </motion.div>
      </Spin>

      {/* Modal: Detalhes dos Containers Docker */}
      <Modal
        title="Containers Docker - Detalhes"
        open={dockerModalOpen}
        onCancel={() => setDockerModalOpen(false)}
        width={900}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <strong>Filtrar por servidor:</strong>
              <Select
                mode="multiple"
                allowClear
                style={{ minWidth: 320 }}
                options={servers.map((s) => ({ label: s.hostname || s.ip, value: s.ip }))}
                value={selectedIps}
                onChange={(vals) => setSelectedIps(vals)}
              />
            </Space>
            <Space>
              <Button type="primary" icon={<ReloadOutlined />} loading={fleetLoading} onClick={() => fleetRefetch()}>
                Atualizar
              </Button>
              <Tag color="blue">Servidores: {servers.length}</Tag>
              <Tag color="geekblue">Selecionados: {selectedIps.length}</Tag>
              <Tag color="green">Running: {fleetSummary.running}</Tag>
              <Tag color="default">Total: {fleetSummary.total}</Tag>
            </Space>
          </Space>

          <Table
            dataSource={fleetContainers.map((c, idx) => ({ ...c, key: c.id || `${c.host}-${c.name}-${idx}` }))}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: 'Servidor', dataIndex: 'host', key: 'host', width: 220 },
              { title: 'Nome', dataIndex: 'name', key: 'name', render: (t: string) => <strong>{t}</strong> },
              { title: 'Imagem', dataIndex: 'image', key: 'image' },
              { title: 'Status', dataIndex: 'status', key: 'status' },
            ]}
          />
        </Space>
      </Modal>
    </motion.div>
  );
};

export default Dashboard;