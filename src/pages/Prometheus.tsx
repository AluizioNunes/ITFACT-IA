import React from 'react';
import { Card, Typography, Row, Col, Statistic, Tag, Space, Button } from 'antd';
import { LineChartOutlined, DatabaseOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import ApiChart from '../components/ApiChart';

const { Title, Paragraph } = Typography;

const Prometheus: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#006400', marginBottom: '8px' }}>
          <LineChartOutlined style={{ marginRight: '12px' }} />
          Prometheus
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          Sistema de monitoramento e coleta de métricas em tempo real
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
              title="Targets"
              value={12}
              suffix="ativos"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Métricas Coletadas"
              value={15420}
              suffix="séries"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Uptime"
              value={99.9}
              suffix="%"
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                Targets Monitorados
              </Space>
            }
            extra={
              <Tag color="green">12/12 Ativos</Tag>
            }
          >
            <div style={{ marginBottom: '16px' }}>
              <Space wrap>
                <Tag color="blue">API Backend</Tag>
                <Tag color="green">PostgreSQL</Tag>
                <Tag color="orange">Nginx</Tag>
                <Tag color="purple">Docker</Tag>
                <Tag color="cyan">Redis</Tag>
                <Tag color="magenta">RabbitMQ</Tag>
              </Space>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Space wrap>
                <Tag color="volcano">Evolution API</Tag>
                <Tag color="geekblue">N8N</Tag>
                <Tag color="lime">Chatwoot</Tag>
                <Tag color="gold">Grafana</Tag>
                <Tag color="green">Prometheus</Tag>
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
                Recarregar
              </Button>
            }
          >
            <div style={{ marginBottom: '12px' }}>
              <strong>Scrape Interval:</strong> 15s
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Evaluation Interval:</strong> 15s
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Retention:</strong> 30 dias
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Storage:</strong> Local
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                Métricas em Tempo Real
              </Space>
            }
          >
            <div style={{ height: '400px', width: '100%' }}>
              <ApiChart
                data={[
                  { time: '00:00', value: 1200 },
                  { time: '01:00', value: 1350 },
                  { time: '02:00', value: 1180 },
                  { time: '03:00', value: 1420 },
                  { time: '04:00', value: 1580 },
                  { time: '05:00', value: 1650 },
                  { time: '06:00', value: 1800 },
                  { time: '07:00', value: 1950 },
                  { time: '08:00', value: 2100 },
                  { time: '09:00', value: 2350 },
                  { time: '10:00', value: 2500 },
                  { time: '11:00', value: 2680 },
                  { time: '12:00', value: 2850 },
                  { time: '13:00', value: 2950 },
                  { time: '14:00', value: 3100 },
                  { time: '15:00', value: 3250 },
                  { time: '16:00', value: 3400 },
                  { time: '17:00', value: 3550 },
                  { time: '18:00', value: 3680 },
                  { time: '19:00', value: 3800 },
                  { time: '20:00', value: 3950 },
                  { time: '21:00', value: 4100 },
                  { time: '22:00', value: 4250 },
                  { time: '23:00', value: 4400 },
                ]}
                title="Métricas Coletadas (últimas 24h)"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card
            title="Últimas Métricas Coletadas"
            extra={
              <Button type="primary" size="small">
                Ver Todas
              </Button>
            }
          >
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              <pre style={{
                fontSize: '12px',
                background: '#f6f8fa',
                padding: '16px',
                borderRadius: '6px',
                margin: 0
              }}>
{`# HELP cmm_api_requests_total Total de requisições da API
# TYPE cmm_api_requests_total counter
cmm_api_requests_total{method="GET",endpoint="/api/health"} 15420

# HELP cmm_nginx_connections Número de conexões ativas do Nginx
# TYPE cmm_nginx_connections gauge
cmm_nginx_connections{server="nginx"} 342

# HELP cmm_postgresql_connections Conexões ativas do PostgreSQL
# TYPE cmm_postgresql_connections gauge
cmm_postgresql_connections{database="automacao_db"} 15

# HELP cmm_docker_containers_status Status dos containers Docker
# TYPE cmm_docker_containers_status gauge
cmm_docker_containers_status{container="nginx",status="running"} 1
cmm_docker_containers_status{container="backend",status="running"} 1
cmm_docker_containers_status{container="frontend",status="running"} 1
cmm_docker_containers_status{container="postgresql",status="running"} 1`}
              </pre>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Prometheus;
