import React from 'react';
import { Card, Typography, Row, Col, Tabs, Table, Tag, Space, Button, Statistic, Progress } from 'antd';
import {
  DatabaseOutlined,
  SettingOutlined,
  ApiOutlined,
  CloudServerOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  LineChartOutlined,
  BugOutlined,
  MonitorOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const Integrations: React.FC = () => {
  // Dados simulados para Inventário
  const inventoryData = [
    {
      key: '1',
      name: 'Servidor Web Nginx',
      type: 'Web Server',
      version: '1.24.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:30:00'
    },
    {
      key: '2',
      name: 'Banco de Dados PostgreSQL',
      type: 'Database',
      version: '17.6',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:29:00'
    },
    {
      key: '3',
      name: 'API Backend Node.js',
      type: 'Application',
      version: '18.19.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:28:00'
    },
    {
      key: '4',
      name: 'Frontend React',
      type: 'Frontend',
      version: '19.1.1',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:27:00'
    },
    {
      key: '5',
      name: 'Prometheus',
      type: 'Monitoring',
      version: '2.48.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:26:00'
    },
    {
      key: '6',
      name: 'Grafana',
      type: 'Dashboard',
      version: '10.4.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:25:00'
    },
    {
      key: '7',
      name: 'Loki',
      type: 'Logging',
      version: '2.9.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:24:00'
    },
    {
      key: '8',
      name: 'Redis',
      type: 'Cache',
      version: '7.2.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:23:00'
    }
  ];

  // Dados simulados para Serviços
  const servicesData = [
    {
      key: '1',
      name: 'API de Monitoramento',
      type: 'REST API',
      status: 'Operacional',
      uptime: '99.9%',
      responseTime: '45ms',
      requests: '2,450/min',
      health: 100
    },
    {
      key: '2',
      name: 'Base de Dados',
      type: 'PostgreSQL',
      status: 'Operacional',
      uptime: '99.8%',
      responseTime: '12ms',
      requests: '890/min',
      health: 98
    },
    {
      key: '3',
      name: 'Servidor Web',
      type: 'Nginx',
      status: 'Operacional',
      uptime: '99.95%',
      responseTime: '8ms',
      requests: '1,200/min',
      health: 100
    },
    {
      key: '4',
      name: 'Cache Redis',
      type: 'In-Memory',
      status: 'Operacional',
      uptime: '99.7%',
      responseTime: '2ms',
      requests: '5,600/min',
      health: 95
    },
    {
      key: '5',
      name: 'Mensageria',
      type: 'RabbitMQ',
      status: 'Operacional',
      uptime: '99.6%',
      responseTime: '15ms',
      requests: '340/min',
      health: 92
    },
    {
      key: '6',
      name: 'Automação N8N',
      type: 'Workflow',
      status: 'Operacional',
      uptime: '99.4%',
      responseTime: '120ms',
      requests: '45/min',
      health: 88
    }
  ];

  const inventoryColumns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors = {
          'Web Server': 'blue',
          'Database': 'green',
          'Application': 'orange',
          'Frontend': 'purple',
          'Monitoring': 'cyan',
          'Dashboard': 'magenta',
          'Logging': 'volcano',
          'Cache': 'geekblue'
        };
        return <Tag color={colors[type as keyof typeof colors] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: 'Versão',
      dataIndex: 'version',
      key: 'version'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Ativo' ? 'green' : 'red'}>
          {status === 'Ativo' ? <CheckCircleOutlined /> : <StopOutlined />}
          {status}
        </Tag>
      )
    },
    {
      title: 'Localização',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: 'Última Verificação',
      dataIndex: 'lastCheck',
      key: 'lastCheck'
    }
  ];

  const servicesColumns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Operacional' ? 'green' : 'red'}>
          {status === 'Operacional' ? <CheckCircleOutlined /> : <WarningOutlined />}
          {status}
        </Tag>
      )
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (uptime: string) => <span style={{ color: uptime.startsWith('99') ? 'green' : 'orange' }}>{uptime}</span>
    },
    {
      title: 'Tempo de Resposta',
      dataIndex: 'responseTime',
      key: 'responseTime'
    },
    {
      title: 'Requisições',
      dataIndex: 'requests',
      key: 'requests'
    },
    {
      title: 'Saúde',
      dataIndex: 'health',
      key: 'health',
      render: (health: number) => (
        <Progress
          percent={health}
          size="small"
          status={health >= 95 ? 'success' : health >= 85 ? 'normal' : 'exception'}
          strokeColor={health >= 95 ? '#52c41a' : health >= 85 ? '#faad14' : '#ff4d4f'}
        />
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#006400', marginBottom: '8px' }}>
          <ToolOutlined style={{ marginRight: '12px' }} />
          Integrações
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          Gerencie inventário de sistemas e monitore serviços integrados
        </Paragraph>
      </div>

      <Card>
        <Tabs defaultActiveKey="inventory" type="card" size="large">
          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                Inventário
              </span>
            }
            key="inventory"
          >
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Total de Sistemas"
                    value={8}
                    prefix={<DatabaseOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Sistemas Ativos"
                    value={8}
                    suffix="/ 8"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Containers Docker"
                    value={8}
                    suffix="ativos"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Última Verificação"
                    value="14:30"
                    suffix="hoje"
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={inventoryColumns}
              dataSource={inventoryData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <SettingOutlined />
                Serviços
              </span>
            }
            key="services"
          >
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Serviços Monitorados"
                    value={6}
                    prefix={<SettingOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Operacionais"
                    value={6}
                    suffix="/ 6"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Uptime Médio"
                    value={99.7}
                    suffix="%"
                    precision={1}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Alertas Ativos"
                    value={0}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={servicesColumns}
              dataSource={servicesData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <ToolOutlined />
                Ações Rápidas
              </Space>
            }
            extra={
              <Button type="primary" icon={<ReloadOutlined />}>
                Atualizar Status
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => console.log('Verificar inventário')}
                >
                  <DatabaseOutlined style={{ fontSize: '32px', color: '#006400', marginBottom: '8px' }} />
                  <Title level={4}>Verificar Inventário</Title>
                  <Paragraph type="secondary">
                    Scan completo de todos os sistemas e componentes
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => console.log('Testar serviços')}
                >
                  <SettingOutlined style={{ fontSize: '32px', color: '#006400', marginBottom: '8px' }} />
                  <Title level={4}>Testar Serviços</Title>
                  <Paragraph type="secondary">
                    Verificação de conectividade e health checks
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => console.log('Gerar relatório')}
                >
                  <ApiOutlined style={{ fontSize: '32px', color: '#006400', marginBottom: '8px' }} />
                  <Title level={4}>Gerar Relatório</Title>
                  <Paragraph type="secondary">
                    Relatório detalhado de status e performance
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Integrations;
