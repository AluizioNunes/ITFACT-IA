import React from 'react';
import { Card, Typography, Row, Col, Statistic, Tag, Space, Button, Table, Input } from 'antd';
import { SearchOutlined, DatabaseOutlined, FileTextOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import ApiChart from '../components/ApiChart';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const Loki: React.FC = () => {
  const logData = [
    {
      timestamp: '2024-01-15 14:30:25',
      level: 'INFO',
      service: 'nginx',
      message: 'Request completed successfully',
      source: 'nginx-access.log'
    },
    {
      timestamp: '2024-01-15 14:30:24',
      level: 'ERROR',
      service: 'api',
      message: 'Database connection timeout',
      source: 'api-error.log'
    },
    {
      timestamp: '2024-01-15 14:30:23',
      level: 'WARN',
      service: 'postgresql',
      message: 'High memory usage detected',
      source: 'postgresql.log'
    },
    {
      timestamp: '2024-01-15 14:30:22',
      level: 'INFO',
      service: 'docker',
      message: 'Container nginx started successfully',
      source: 'docker-events.log'
    },
    {
      timestamp: '2024-01-15 14:30:21',
      level: 'INFO',
      service: 'grafana',
      message: 'Dashboard loaded successfully',
      source: 'grafana.log'
    }
  ];

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const colors = {
          'INFO': 'green',
          'WARN': 'orange',
          'ERROR': 'red',
          'DEBUG': 'blue'
        };
        return <Tag color={colors[level as keyof typeof colors] || 'default'}>{level}</Tag>;
      }
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 120,
      render: (service: string) => <Tag color="blue">{service}</Tag>
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 150,
      render: (source: string) => <Text type="secondary">{source}</Text>
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#006400', marginBottom: '8px' }}>
          <DatabaseOutlined style={{ marginRight: '12px' }} />
          Loki - Agregação de Logs
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          Sistema de agregação e consulta de logs distribuídos
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Status"
              value="Ativo"
              valueStyle={{ color: '#3f8600' }}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Logs Ingeridos"
              value={2847592}
              suffix="entradas"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Fontes de Logs"
              value={8}
              suffix="serviços"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Retenção"
              value={30}
              suffix="dias"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                Fontes de Logs Configuradas
              </Space>
            }
          >
            <div style={{ marginBottom: '16px' }}>
              <Space wrap>
                <Tag color="blue">Nginx Access</Tag>
                <Tag color="red">Nginx Error</Tag>
                <Tag color="green">API Logs</Tag>
                <Tag color="orange">PostgreSQL</Tag>
              </Space>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Space wrap>
                <Tag color="purple">Docker Events</Tag>
                <Tag color="cyan">Grafana</Tag>
                <Tag color="magenta">Prometheus</Tag>
                <Tag color="volcano">Loki</Tag>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SettingOutlined />
                Configuração
              </Space>
            }
            extra={
              <Button icon={<ReloadOutlined />} size="small">
                Atualizar
              </Button>
            }
          >
            <div style={{ marginBottom: '12px' }}>
              <strong>Endpoint:</strong> http://loki:3100
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Retention:</strong> 30 dias
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Chunk Size:</strong> 1MB
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Replication:</strong> Desabilitado
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SearchOutlined />
                Consulta de Logs
              </Space>
            }
          >
            <div style={{ marginBottom: '16px' }}>
              <Search
                placeholder="Digite sua consulta LogQL..."
                enterButton="Buscar"
                size="large"
                onSearch={(value) => console.log('Consulta:', value)}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
              <strong>Exemplo de consulta:</strong> {`{service="nginx"} |= "error"`}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>Dicas:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Use <code>{`{service="nome"}`}</code> para filtrar por serviço</li>
                <li>Use <code>|= "texto"</code> para buscar por texto</li>
                <li>Use <code>|~ "regex"</code> para expressões regulares</li>
              </ul>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                Estatísticas de Logs
              </Space>
            }
          >
            <div style={{ height: '200px', width: '100%' }}>
              <ApiChart
                data={[
                  { time: '00:00', value: 450 },
                  { time: '01:00', value: 320 },
                  { time: '02:00', value: 280 },
                  { time: '03:00', value: 350 },
                  { time: '04:00', value: 420 },
                  { time: '05:00', value: 380 },
                  { time: '06:00', value: 520 },
                  { time: '07:00', value: 680 },
                  { time: '08:00', value: 850 },
                  { time: '09:00', value: 920 },
                  { time: '10:00', value: 1100 },
                  { time: '11:00', value: 1250 },
                  { time: '12:00', value: 1350 },
                  { time: '13:00', value: 1420 },
                  { time: '14:00', value: 1580 },
                  { time: '15:00', value: 1650 },
                  { time: '16:00', value: 1800 },
                  { time: '17:00', value: 1950 },
                  { time: '18:00', value: 2100 },
                  { time: '19:00', value: 2250 },
                  { time: '20:00', value: 2400 },
                  { time: '21:00', value: 2350 },
                  { time: '22:00', value: 2200 },
                  { time: '23:00', value: 2000 },
                ]}
                title="Logs Ingeridos (últimas 24h)"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                Logs Recentes
              </Space>
            }
            extra={
              <Button type="primary" size="small">
                Ver Todos os Logs
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={logData}
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card
            title="Consulta de Exemplo - Erros da API"
            extra={
              <Button type="primary" size="small">
                Executar Consulta
              </Button>
            }
          >
            <div style={{
              background: '#f6f8fa',
              padding: '16px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              <div><strong>Consulta:</strong> {`{service="api"} |= "error"`}</div>
              <div><strong>Período:</strong> Últimas 24 horas</div>
              <div><strong>Resultado:</strong> 247 entradas encontradas</div>
            </div>
            <div style={{
              background: '#000',
              color: '#0f0',
              padding: '16px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <div>[2024-01-15 14:30:24] ERROR api: Database connection timeout</div>
              <div>[2024-01-15 14:25:18] ERROR api: Failed to parse JSON payload</div>
              <div>[2024-01-15 14:20:33] ERROR api: Authentication token expired</div>
              <div>[2024-01-15 14:15:42] ERROR api: Rate limit exceeded for IP 192.168.1.100</div>
              <div>[2024-01-15 14:10:15] ERROR api: Invalid request parameters</div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Loki;
