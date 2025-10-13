import React, { useState } from 'react';
import { Card, Typography, Row, Col, Tabs, Table, Tag, Space, Button, Statistic, Progress, Input, Select, Form, Alert, Divider } from 'antd';
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
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  ScanOutlined,
  GlobalOutlined,
  WifiOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const Integrations: React.FC = () => {
  const [discoveryMethod, setDiscoveryMethod] = useState('snmp');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredServers, setDiscoveredServers] = useState<any[]>([]);
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
      lastCheck: '2024-01-15 14:24:00',
      source: 'Local'
    },
    {
      key: '8',
      name: 'Redis',
      type: 'Cache',
      version: '7.2.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:23:00',
      source: 'Local'
    }
  ];

  // Dados simulados para Serviços (serviços locais + descobertos)
  const servicesData = [
    {
      key: '1',
      name: 'API de Monitoramento',
      type: 'REST API',
      status: 'Operacional',
      uptime: '99.9%',
      responseTime: '45ms',
      requests: '2,450/min',
      health: 100,
      source: 'Local'
    },
    {
      key: '2',
      name: 'Base de Dados',
      type: 'PostgreSQL',
      status: 'Operacional',
      uptime: '99.8%',
      responseTime: '12ms',
      requests: '890/min',
      health: 98,
      source: 'Local'
    },
    {
      key: '3',
      name: 'Servidor Web Nginx',
      type: 'Web Server',
      status: 'Operacional',
      uptime: '99.95%',
      responseTime: '8ms',
      requests: '1,200/min',
      health: 100,
      source: 'Descoberto'
    },
    {
      key: '4',
      name: 'Servidor de Arquivos Samba',
      type: 'File Server',
      status: 'Operacional',
      uptime: '99.7%',
      responseTime: '25ms',
      requests: '450/min',
      health: 95,
      source: 'Descoberto'
    },
    {
      key: '5',
      name: 'Cache Redis',
      type: 'In-Memory',
      status: 'Operacional',
      uptime: '99.7%',
      responseTime: '2ms',
      requests: '5,600/min',
      health: 95,
      source: 'Local'
    },
    {
      key: '6',
      name: 'Mensageria',
      type: 'RabbitMQ',
      status: 'Operacional',
      uptime: '99.6%',
      responseTime: '15ms',
      requests: '340/min',
      health: 92,
      source: 'Local'
    },
    {
      key: '7',
      name: 'Automação N8N',
      type: 'Workflow',
      status: 'Operacional',
      uptime: '99.4%',
      responseTime: '120ms',
      requests: '45/min',
      health: 88,
      source: 'Local'
    }
  ];

  // Dados simulados para Servidores Descobertos
  const discoveredServersData = [
    {
      key: '1',
      hostname: 'srv-web-01.cmm.am.gov.br',
      ip: '192.168.1.100',
      status: 'Online',
      services: ['nginx', 'apache2'],
      os: 'Ubuntu 22.04 LTS',
      lastSeen: '2024-01-15 14:35:00',
      location: 'Sala de Servidores - Prédio Principal'
    },
    {
      key: '2',
      hostname: 'srv-db-01.cmm.am.gov.br',
      ip: '192.168.1.101',
      status: 'Online',
      services: ['postgresql', 'redis'],
      os: 'CentOS 8',
      lastSeen: '2024-01-15 14:34:00',
      location: 'Data Center - Andar 2'
    },
    {
      key: '3',
      hostname: 'srv-app-01.cmm.am.gov.br',
      ip: '192.168.1.102',
      status: 'Online',
      services: ['nodejs', 'python', 'docker'],
      os: 'Debian 11',
      lastSeen: '2024-01-15 14:33:00',
      location: 'Sala de Desenvolvimento'
    },
    {
      key: '4',
      hostname: 'srv-monitor-01.cmm.am.gov.br',
      ip: '192.168.1.103',
      status: 'Online',
      services: ['prometheus', 'grafana', 'loki'],
      os: 'Ubuntu 22.04 LTS',
      lastSeen: '2024-01-15 14:32:00',
      location: 'Sala de Monitoramento'
    },
    {
      key: '5',
      hostname: 'srv-backup-01.cmm.am.gov.br',
      ip: '192.168.1.104',
      status: 'Offline',
      services: ['rsync', 'backup-scripts'],
      os: 'Ubuntu 20.04 LTS',
      lastSeen: '2024-01-15 14:20:00',
      location: 'Sala de Backup'
    }
  ];

  const handleStartDiscovery = () => {
    setIsDiscovering(true);

    // Simular processo de descoberta
    setTimeout(() => {
      setDiscoveredServers(discoveredServersData);
      setIsDiscovering(false);
    }, 3000);
  };

  const discoveredColumns = [
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip: string) => <Tag color="blue">{ip}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Online' ? 'green' : 'red'}>
          {status === 'Online' ? <CheckCircleOutlined /> : <StopOutlined />}
          {status}
        </Tag>
      )
    },
    {
      title: 'Serviços',
      dataIndex: 'services',
      key: 'services',
      render: (services: string[]) => (
        <Space wrap>
          {services.map((service, index) => (
            <Tag key={index} color="orange">{service}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Sistema Operacional',
      dataIndex: 'os',
      key: 'os'
    },
    {
      title: 'Última Verificação',
      dataIndex: 'lastSeen',
      key: 'lastSeen'
    },
    {
      title: 'Localização',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true
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
    },
    {
      title: 'Origem',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color={source === 'Local' ? 'green' : 'blue'}>
          {source === 'Local' ? <ContainerOutlined /> : <GlobalOutlined />}
          {source}
        </Tag>
      )
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
    },
    {
      title: 'Origem',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color={source === 'Local' ? 'green' : 'blue'}>
          {source === 'Local' ? <ContainerOutlined /> : <GlobalOutlined />}
          {source}
        </Tag>
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
                    value={inventoryData.length + discoveredServers.length}
                    prefix={<DatabaseOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Sistemas Ativos"
                    value={inventoryData.filter(item => item.status === 'Ativo').length + discoveredServers.filter(item => item.status === 'Online').length}
                    suffix={`/ ${inventoryData.length + discoveredServers.length}`}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Servidores Descobertos"
                    value={discoveredServers.length}
                    suffix="na rede"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Última Verificação"
                    value="14:35"
                    suffix="hoje"
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={inventoryColumns}
              dataSource={[...inventoryData, ...discoveredServers.map(server => ({
                key: `discovered-${server.key}`,
                name: server.hostname,
                type: 'Servidor Descoberto',
                version: server.os,
                status: server.status === 'Online' ? 'Ativo' : 'Inativo',
                location: server.location,
                lastCheck: server.lastSeen,
                source: 'Descoberto'
              }))]}
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
                    value={servicesData.length}
                    prefix={<SettingOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Operacionais"
                    value={servicesData.filter(item => item.status === 'Operacional').length}
                    suffix={`/ ${servicesData.length}`}
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
                    value={servicesData.filter(item => item.health < 95).length}
                    valueStyle={{ color: servicesData.filter(item => item.health < 95).length > 0 ? '#cf1322' : '#3f8600' }}
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={servicesColumns}
              dataSource={servicesData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900}}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <ScanOutlined />
                Cadastro de Servidores
              </span>
            }
            key="discovery"
          >
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} lg={8}>
                <Card
                  title={
                    <Space>
                      <WifiOutlined />
                      Configuração de Descoberta
                    </Space>
                  }
                >
                  <Form layout="vertical">
                    <Form.Item label="Método de Descoberta">
                      <Select
                        value={discoveryMethod}
                        onChange={setDiscoveryMethod}
                        style={{ width: '100%' }}
                      >
                        <Option value="snmp">SNMP Scan</Option>
                        <Option value="domain">Domain Discovery</Option>
                        <Option value="iprange">IP Range Scan</Option>
                        <Option value="nmap">Nmap Scan</Option>
                      </Select>
                    </Form.Item>

                    {discoveryMethod === 'iprange' && (
                      <>
                        <Form.Item label="IP Inicial">
                          <Input placeholder="192.168.1.1" />
                        </Form.Item>
                        <Form.Item label="IP Final">
                          <Input placeholder="192.168.1.254" />
                        </Form.Item>
                      </>
                    )}

                    {discoveryMethod === 'domain' && (
                      <Form.Item label="Domínio">
                        <Input placeholder="cmm.am.gov.br" />
                      </Form.Item>
                    )}

                    <Form.Item>
                      <Button
                        type="primary"
                        icon={<ScanOutlined />}
                        loading={isDiscovering}
                        onClick={handleStartDiscovery}
                        block
                      >
                        {isDiscovering ? 'Executando Descoberta...' : 'Iniciar Descoberta'}
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>

              <Col xs={24} lg={16}>
                <Card
                  title={
                    <Space>
                      <GlobalOutlined />
                      Servidores Descobertos
                    </Space>
                  }
                  extra={
                    <Space>
                      <Tag color="green">Online: {discoveredServers.filter(s => s.status === 'Online').length}</Tag>
                      <Tag color="red">Offline: {discoveredServers.filter(s => s.status === 'Offline').length}</Tag>
                    </Space>
                  }
                >
                  {isDiscovering ? (
                    <Alert
                      message="Executando Descoberta de Rede"
                      description="Procurando servidores e serviços na rede... Isso pode levar alguns minutos."
                      type="info"
                      showIcon
                    />
                  ) : discoveredServers.length > 0 ? (
                    <Table
                      columns={discoveredColumns}
                      dataSource={discoveredServers}
                      pagination={{ pageSize: 8 }}
                      scroll={{ x: 800 }}
                    />
                  ) : (
                    <Alert
                      message="Nenhum Servidor Descoberto"
                      description="Execute uma descoberta para encontrar servidores na rede."
                      type="warning"
                      showIcon
                    />
                  )}
                </Card>
              </Col>
            </Row>

            <Divider />

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
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Integrations;
