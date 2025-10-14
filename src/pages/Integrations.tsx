import React, { useState } from 'react';
import { Card, Typography, Row, Col, Tabs, Table, Tag, Space, Button, Statistic, Progress, Input, Select, Form, Alert, Divider, message } from 'antd';
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
  const [snmpTarget, setSnmpTarget] = useState('');
  const [snmpCommunity, setSnmpCommunity] = useState('public');
  const [domainTarget, setDomainTarget] = useState('');
  const [ipRangeStart, setIpRangeStart] = useState('');
  const [ipRangeEnd, setIpRangeEnd] = useState('');

  // Dados simulados para Inventário
  const inventoryData = [
    {
      key: '1',
      name: 'Servidor Web Nginx',
      type: 'Web Server',
      version: '1.24.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:30:00',
      source: 'Local'
    },
    {
      key: '2',
      name: 'Banco de Dados PostgreSQL',
      type: 'Database',
      version: '17.6',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:29:00',
      source: 'Local'
    },
    {
      key: '3',
      name: 'API Backend Node.js',
      type: 'Application',
      version: '18.19.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:28:00',
      source: 'Local'
    },
    {
      key: '4',
      name: 'Frontend React',
      type: 'Frontend',
      version: '19.1.1',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:27:00',
      source: 'Local'
    },
    {
      key: '5',
      name: 'Prometheus',
      type: 'Monitoring',
      version: '2.48.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:26:00',
      source: 'Local'
    },
    {
      key: '6',
      name: 'Grafana',
      type: 'Dashboard',
      version: '10.4.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:25:00',
      source: 'Local'
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

  // Dados simulados para Servidores Descobertos - USANDO IP REAL
  const discoveredServersData = [
    {
      key: '1',
      hostname: 'automacao.cmm.am.gov.br',
      ip: '172.18.1.32',
      status: 'Online',
      services: ['nginx', 'docker', 'nodejs', 'postgresql'],
      os: 'Ubuntu 22.04 LTS',
      lastSeen: '2024-01-15 14:35:00',
      location: 'Servidor de Produção - CMM-AM'
    },
    {
      key: '2',
      hostname: 'srv-web-01.local',
      ip: '192.168.1.100',
      status: 'Online',
      services: ['apache2', 'nginx'],
      os: 'CentOS 8',
      lastSeen: '2024-01-15 14:34:00',
      location: 'Servidor Web Local'
    },
    {
      key: '3',
      hostname: 'srv-db-01.local',
      ip: '192.168.1.101',
      status: 'Online',
      services: ['postgresql', 'mysql', 'redis'],
      os: 'Ubuntu 20.04 LTS',
      lastSeen: '2024-01-15 14:33:00',
      location: 'Servidor de Banco de Dados'
    }
  ].map(server => ({ ...server, real: false }));

  const handleMethodChange = (newMethod: string) => {
    setDiscoveryMethod(newMethod);
    setSnmpTarget('');
    setSnmpCommunity('public');
    setDomainTarget('');
    setIpRangeStart('');
    setIpRangeEnd('');
  };

  const isValidIP = (ip: string): boolean => {
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipPattern.test(ip);
  };

  const isValidHostname = (hostname: string): boolean => {
    const hostnamePattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const shortHostnamePattern = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]*$/;
    return hostnamePattern.test(hostname) || shortHostnamePattern.test(hostname);
  };

  const isValidDomain = (domain: string): boolean => {
    const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return domainPattern.test(domain);
  };

  const handleStartDiscovery = async () => {
    if (discoveryMethod === 'snmp' && !snmpTarget.trim()) {
      message.error('Por favor, digite o IP ou hostname para o SNMP Scan');
      return;
    }

    if (discoveryMethod === 'snmp' && !snmpCommunity.trim()) {
      message.error('Por favor, digite a comunidade SNMP');
      return;
    }

    if (discoveryMethod === 'domain' && !domainTarget.trim()) {
      message.error('Por favor, digite o domínio para descoberta');
      return;
    }

    if (discoveryMethod === 'iprange' && (!ipRangeStart.trim() || !ipRangeEnd.trim())) {
      message.error('Por favor, digite o range de IP completo (inicial e final)');
      return;
    }

    setIsDiscovering(true);

    try {
      let results: any[] = [];

      if (discoveryMethod === 'snmp') {
        try {
          const snmpResponse = await fetch('/api/discovery/snmp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target: snmpTarget.trim(),
              community: snmpCommunity.trim()
            })
          });

          if (snmpResponse.ok) {
            const snmpData = await snmpResponse.json();
            results = [{
              key: '1',
              hostname: snmpData.systemInfo.hostname || snmpTarget.trim(),
              ip: snmpData.target,
              status: 'Online',
              services: snmpData.services.map((s: any) => s.service),
              os: snmpData.systemInfo.description || 'Unknown',
              lastSeen: snmpData.timestamp,
              location: 'Servidor de Produção - CMM-AM (Dados SNMP)',
              real: true
            }];
          }
        } catch (error) {
          console.warn('SNMP failed, using cross-platform discovery');
        }
      } else if (discoveryMethod === 'iprange') {
        const networkResponse = await fetch('/api/discovery/network', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: `${ipRangeStart.trim()}-${ipRangeEnd.trim()}`,
            method: 'nmap'
          })
        });

        if (networkResponse.ok) {
          const networkData = await networkResponse.json();
          results = networkData.discoveredDevices.map((device: any, index: number) => ({
            key: `net-${index}`,
            hostname: device.hostname,
            ip: device.ip,
            status: device.status,
            services: device.services?.map((s: any) => s.service) || [],
            os: device.os,
            lastSeen: device.timestamp,
            location: `Range ${ipRangeStart.trim()}-${ipRangeEnd.trim()}`,
            real: true
          }));
        }
      } else if (discoveryMethod === 'domain') {
        const domainResponse = await fetch('/api/discovery/cross-platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targets: [domainTarget.trim()],
            checkPorts: true
          })
        });

        if (domainResponse.ok) {
          const domainData = await domainResponse.json();
          results = domainData.discoveredDevices.map((device: any, index: number) => ({
            key: `domain-${index}`,
            hostname: device.hostname,
            ip: device.ip,
            status: device.status,
            services: device.services?.map((s: any) => s.service) || [],
            os: device.os,
            lastSeen: device.timestamp,
            location: `Domínio ${domainTarget.trim()}`,
            real: true
          }));
        }
      } else {
        results = [];
      }

      setDiscoveredServers(results);
    } catch (error) {
      console.error('Erro na descoberta:', error);
      setDiscoveredServers([]);
    } finally {
      setIsDiscovering(false);
    }
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
      title: 'Tipo',
      dataIndex: 'location',
      key: 'type',
      render: (location: string, record: any) => {
        const isReal = record.real || location.includes('Dados SNMP') || location.includes('Rede Local');
        return (
          <Tag color={isReal ? 'green' : 'orange'}>
            {isReal ? 'Dados Reais' : 'Dados Fictícios'}
          </Tag>
        );
      }
    },
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
        <Tabs defaultActiveKey="discovery" type="card" size="large">
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
                        onChange={handleMethodChange}
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
                        <Form.Item
                          label="IP Inicial"
                          rules={[{ required: true, message: 'IP inicial é obrigatório' }]}
                        >
                          <Input
                            placeholder="192.168.1.1"
                            value={ipRangeStart}
                            onChange={(e) => setIpRangeStart(e.target.value)}
                          />
                        </Form.Item>
                        <Form.Item
                          label="IP Final"
                          rules={[{ required: true, message: 'IP final é obrigatório' }]}
                        >
                          <Input
                            placeholder="192.168.1.254"
                            value={ipRangeEnd}
                            onChange={(e) => setIpRangeEnd(e.target.value)}
                          />
                        </Form.Item>
                      </>
                    )}

                    {discoveryMethod === 'snmp' && (
                      <>
                        <Form.Item
                          label="IP ou Hostname"
                          rules={[
                            { required: true, message: 'IP ou hostname é obrigatório' },
                            {
                              validator: (_, value) => {
                                if (!value) return Promise.reject();
                                if (isValidIP(value) || isValidHostname(value)) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(new Error('Digite um IP válido (ex: 192.168.1.1) ou hostname (ex: servidor.local ou servidor.local.dominio.com)'));
                              }
                            }
                          ]}
                          help="Digite um endereço IP (192.168.1.1) ou hostname (servidor.local ou servidor.dominio.com)"
                        >
                          <Input
                            placeholder="192.168.1.32 ou automacao.cmm.am.gov.br"
                            value={snmpTarget}
                            onChange={(e) => setSnmpTarget(e.target.value)}
                          />
                        </Form.Item>
                        <Form.Item
                          label="Comunidade SNMP"
                          rules={[{ required: true, message: 'Comunidade SNMP é obrigatória' }]}
                          help="Comunidade SNMP padrão (geralmente 'public')"
                        >
                          <Input
                            placeholder="public"
                            value={snmpCommunity}
                            onChange={(e) => setSnmpCommunity(e.target.value)}
                          />
                        </Form.Item>
                      </>
                    )}

                    {discoveryMethod === 'domain' && (
                      <Form.Item
                        label="Domínio"
                        rules={[
                          { required: true, message: 'Domínio é obrigatório' },
                          {
                            validator: (_, value) => {
                              if (!value) return Promise.reject();
                              if (isValidDomain(value)) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('Digite um domínio válido (ex: cmm.am.gov.br)'));
                            }
                          }
                        ]}
                        help="Nome do domínio para descoberta (ex: cmm.am.gov.br)"
                      >
                        <Input
                          placeholder="cmm.am.gov.br"
                          value={domainTarget}
                          onChange={(e) => setDomainTarget(e.target.value)}
                        />
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
