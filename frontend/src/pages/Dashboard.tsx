import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Divider, Spin, Alert, Button, Tag, Progress, Space } from 'antd';
import { motion } from 'framer-motion';
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
import ApiChart from '../components/ApiChart';

const Dashboard: React.FC = () => {
  const { 
    systemMetrics, 
    nginxMetrics, 
    services, 
    alerts, 
    totalServices, 
    activeServices, 
    containers,
    postgresData,
    chartData,
    loading, 
    error, 
    refetch 
  } = useDashboardData();

  // Buscar dados na montagem do componente
  useEffect(() => {
    refetch();
  }, [refetch]);

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Divider orientation="left">
        Dashboard - Visão Geral do Sistema
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={refetch} 
          loading={loading}
          style={{ marginLeft: 16 }}
        >
          Atualizar
        </Button>
      </Divider>

      {error && (
        <Alert 
          message="Aviso" 
          description={error} 
          type="warning" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        {/* Métricas Principais do Sistema */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <Statistic 
                  title="Containers Docker" 
                  value={containers.running} 
                  suffix={`/ ${containers.total}`}
                  prefix={<DockerOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: containers.running === containers.total ? '#3f8600' : '#faad14' }}
                />
                {containers.details && (
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
                    {containers.details.length > 0 ? (
                      <div>
                        <div>{containers.details[0].name}: {containers.details[0].status}</div>
                        {containers.details.length > 1 && (
                          <div>+{containers.details.length - 1} outros containers</div>
                        )}
                      </div>
                    ) : (
                      <div>Sem containers em execução</div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          </Col>
          <Col span={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <Statistic 
                  title="Bancos PostgreSQL" 
                  value={postgresData.databases} 
                  suffix={`/ ${postgresData.tables} tabelas`}
                  prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
                {postgresData.details && (
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
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
                  </div>
                )}
              </Card>
            </motion.div>
          </Col>
          <Col span={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <Statistic 
                  title="Alertas" 
                  value={alerts} 
                  prefix={<BellOutlined style={{ color: alerts > 0 ? '#ff4d4f' : '#52c41a' }} />}
                  valueStyle={{ color: alerts > 0 ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col span={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <Statistic 
                  title="Serviços Ativos" 
                  value={activeServices} 
                  suffix={`/ ${totalServices}`}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: activeServices === totalServices ? '#3f8600' : '#faad14' }}
                />
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Métricas de Performance */}
        <Divider orientation="left" style={{ marginTop: 32 }}>Performance do Sistema</Divider>
        <Row gutter={[16, 16]}>
          <Col span={6}>
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
          </Col>
          <Col span={6}>
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
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Nginx - Req/seg"
                value={nginxMetrics?.requestsPerSecond || 0}
                suffix="req/s"
                prefix={<CloudServerOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Uptime do Sistema"
                value={systemMetrics?.uptime?.formatted || '0h 0m'}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Gráficos de Monitoramento */}
        <Divider orientation="left" style={{ marginTop: 32 }}>Gráficos de Monitoramento</Divider>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Requisições por Minuto" extra={<ThunderboltOutlined />}>
              <ApiChart 
                title="Req/min"
                data={chartData.requestsHistory}
                color="#722ed1"
                unit=" req/min"
                height={250}
                type="line"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Tempo de Resposta" extra={<ClockCircleOutlined />}>
              <ApiChart 
                title="Latência"
                data={chartData.responseTimeHistory}
                color="#fa8c16"
                unit="ms"
                height={250}
                type="spline"
              />
            </Card>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card title="Taxa de Erro" extra={<ExclamationCircleOutlined />}>
              <ApiChart 
                title="Taxa de Erro"
                data={chartData.errorRateHistory}
                color="#ff4d4f"
                unit="%"
                height={250}
                type="area"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Conexões Nginx" extra={<CloudServerOutlined />}>
              <ApiChart 
                title="Conexões"
                data={chartData.connectionsHistory}
                color="#1890ff"
                unit=" conn"
                height={250}
                type="area"
              />
            </Card>
          </Col>
        </Row>

        {/* Status Detalhado dos Serviços */}
        <Divider orientation="left" style={{ marginTop: 32 }}>Status dos Serviços</Divider>
        <Row gutter={[16, 16]}>
          {services.map((service, index) => (
            <Col span={8} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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
                    <Tag color={service.status === 'Active' ? 'green' : service.status === 'Warning' ? 'orange' : 'red'}>
                      {service.status === 'Active' ? 'Ativo' : service.status === 'Warning' ? 'Atenção' : 'Inativo'}
                    </Tag>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tempo Resp.:</span>
                      <span style={{ 
                        color: service.responseTime > 200 ? '#ff4d4f' : 
                               service.responseTime > 100 ? '#faad14' : '#52c41a' 
                      }}>
                        {Math.round(service.responseTime)}ms
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Taxa de Erro:</span>
                      <span style={{ 
                        color: (service.errorRate || 0) > 1 ? '#ff4d4f' : 
                               (service.errorRate || 0) > 0.5 ? '#faad14' : '#52c41a' 
                      }}>
                        {typeof service.errorRate === 'number' ? service.errorRate.toFixed(2) : '0.00'}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Uptime:</span>
                      <span style={{ color: '#52c41a', fontSize: '12px' }}>
                        {service.uptime}
                      </span>
                    </div>
                    
                    {/* Barra de progresso para saúde geral */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: '12px', marginBottom: 4 }}>Saúde Geral:</div>
                      <Progress 
                        percent={Math.round(100 - ((service.errorRate || 0) * 10) - (service.responseTime > 100 ? 20 : 0))} 
                        size="small" 
                        status={service.status === 'Active' ? 'success' : 'exception'}
                        showInfo={false}
                      />
                    </div>
                  </Space>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Spin>
    </motion.div>
  );
};

export default Dashboard;