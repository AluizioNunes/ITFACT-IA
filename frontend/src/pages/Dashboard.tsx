import React from 'react';
import { Card, Row, Col, Statistic, Divider, Spin } from 'antd';
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
  CheckCircleOutlined
} from '@ant-design/icons';
import { useDockerContainers, usePostgresInfo } from '../hooks/useRealData';

const Dashboard: React.FC = () => {
  const { containers, loading: dockerLoading } = useDockerContainers();
  const { info: postgresInfo, loading: postgresLoading } = usePostgresInfo();

  // Calcular estatísticas em tempo real
  const runningContainers = containers.filter((c: any) => c.status === 'running').length;
  const totalContainers = containers.length;
  
  const services = [
    { title: 'Grafana', icon: <LineChartOutlined />, status: 'Operacional', value: '99.9%' },
    { title: 'Nginx', icon: <CloudServerOutlined />, status: 'Operacional', value: '99.9%' },
    { title: 'Postgres', icon: <DatabaseOutlined />, status: 'Operacional', value: '99.9%' },
    { title: 'Docker', icon: <DockerOutlined />, status: 'Operacional', value: '99.9%' },
    { title: 'N8N', icon: <ApiOutlined />, status: 'Operacional', value: '99.9%' },
    { title: 'Evolution API', icon: <ApiOutlined />, status: 'Operacional', value: '99.9%' },
    { title: 'Chatwoot', icon: <WechatOutlined />, status: 'Operacional', value: '99.9%' },
    { title: 'WhatsApp', icon: <WhatsAppOutlined />, status: 'Operacional', value: '99.9%' },
    { title: 'Redis', icon: <ContainerOutlined />, status: 'Operacional', value: '99.9%' },
    { title: 'RabbitMQ', icon: <AppstoreOutlined />, status: 'Operacional', value: '99.9%' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Divider orientation="left">Visão Geral</Divider>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            {dockerLoading ? (
              <div style={{ textAlign: 'center' }}><Spin size="small" /></div>
            ) : (
              <Statistic 
                title="Containers Docker" 
                value={runningContainers} 
                suffix={`/ ${totalContainers}`}
                prefix={<DockerOutlined />} 
              />
            )}
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            {postgresLoading ? (
              <div style={{ textAlign: 'center' }}><Spin size="small" /></div>
            ) : (
              <Statistic 
                title="Conexões Postgres" 
                value={postgresInfo.connections || 12} 
                prefix={<DatabaseOutlined />} 
              />
            )}
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Alertas" 
              value={0} 
              prefix={<BellOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Serviços Ativos" 
              value={services.filter(s => s.status === 'Operacional').length} 
              suffix={`/ ${services.length}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left" style={{ marginTop: 32 }}>Status dos Serviços</Divider>
      <Row gutter={[16, 16]}>
        {services.map((service, index) => (
          <Col span={8} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {service.icon}
                    <span style={{ marginLeft: 8 }}>{service.title}</span>
                  </div>
                }
                extra={<span style={{ color: service.status === 'Operacional' ? '#52c41a' : '#ff4d4f' }}>{service.status}</span>}
              >
                <p>Métrica: {service.value}</p>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </motion.div>
  );
};

export default Dashboard;