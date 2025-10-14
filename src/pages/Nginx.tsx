import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Divider, Statistic, Table, Spin, Alert, Button, Tag, Progress, Space } from 'antd';
import { motion } from 'framer-motion';
import { 
  CloudServerOutlined, 
  BarChartOutlined, 
  LineChartOutlined, 
  DatabaseOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNginxData } from '../hooks/useNginxData';
import ApiChart from '../components/ApiChart';

const Nginx: React.FC = () => {
  const { metrics, upstreams, locations, performance, status, loading, error, refetch } = useNginxData();
  
  // State para dados históricos dos gráficos
  const [requestsHistory, setRequestsHistory] = useState<Array<{ time: string; value: number }>>([]);
  const [connectionsHistory, setConnectionsHistory] = useState<Array<{ time: string; value: number }>>([]);
  const [latencyHistory, setLatencyHistory] = useState<Array<{ time: string; value: number }>>([]);

  // Atualizar histórico quando novos dados chegarem
  useEffect(() => {
    if (performance && performance.length > 0) {
      setRequestsHistory(performance.map(p => ({ time: p.time, value: p.requestsPerSecond })));
      setConnectionsHistory(performance.map(p => ({ time: p.time, value: p.activeConnections })));
      setLatencyHistory(performance.map(p => ({ time: p.time, value: p.responseTime })));
    }
  }, [performance]);

  // Buscar dados na montagem do componente
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Colunas da tabela de upstreams
  const upstreamColumns = [
    {
      title: 'Servidor',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <GlobalOutlined />
          <strong>{name}</strong>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'up' ? 'green' : 'red'} icon={status === 'up' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>
          {status === 'up' ? 'Ativo' : 'Inativo'}
        </Tag>
      )
    },
    {
      title: 'Requisições',
      dataIndex: 'requests',
      key: 'requests',
      sorter: (a: any, b: any) => a.requests - b.requests,
      render: (requests: number) => requests.toLocaleString('pt-BR')
    },
    {
      title: 'Latência (ms)',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time: number) => (
        <span style={{ color: time > 100 ? '#ff4d4f' : time > 50 ? '#faad14' : '#52c41a' }}>
          {time}ms
        </span>
      )
    }
  ];

  // Colunas da tabela de locations
  const locationColumns = [
    {
      title: 'Localização',
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => <code style={{ backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{path}</code>
    },
    {
      title: 'Requisições',
      dataIndex: 'requests',
      key: 'requests',
      sorter: (a: any, b: any) => a.requests - b.requests,
      render: (requests: number) => requests.toLocaleString('pt-BR')
    },
    {
      title: 'Erros',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors: number) => (
        <Tag color={errors > 10 ? 'red' : errors > 0 ? 'orange' : 'green'}>
          {errors}
        </Tag>
      )
    },
    {
      title: 'Taxa de Erro',
      dataIndex: 'errorRate',
      key: 'errorRate',
      render: (rate: string) => {
        const numRate = parseFloat(rate);
        return (
          <span style={{ color: numRate > 1 ? '#ff4d4f' : numRate > 0.1 ? '#faad14' : '#52c41a' }}>
            {rate}%
          </span>
        );
      }
    },
    {
      title: 'Tempo Resp. (ms)',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      render: (time: number) => `${time}ms`
    }
  ];


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Divider orientation="left">
        Nginx - Métricas em Tempo Real
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
        {/* Métricas Principais */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <Statistic
                  title="Requisições/seg"
                  value={metrics?.requestsPerSecond || 0}
                  suffix="req/s"
                  prefix={<BarChartOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#3f8600' }}
                />
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
                  title="Conexões Ativas"
                  value={metrics?.activeConnections || 0}
                  suffix="conexões"
                  prefix={<GlobalOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
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
                  title="Taxa de Erro"
                  value={metrics?.errorRate || 0}
                  suffix="%"
                  prefix={<ExclamationCircleOutlined style={{ color: metrics?.errorRate && metrics.errorRate > 1 ? '#ff4d4f' : '#faad14' }} />}
                  valueStyle={{ color: metrics?.errorRate && metrics.errorRate > 1 ? '#cf1322' : '#d48806' }}
                  precision={2}
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
                  title="Latência Média"
                  value={metrics?.averageLatency || 0}
                  suffix="ms"
                  prefix={<LineChartOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Gráficos de Performance */}
        <Divider orientation="left" style={{ marginTop: 32 }}>Gráficos de Performance</Divider>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card title="Requisições por Segundo" extra={<BarChartOutlined />}>
              <ApiChart 
                title="Req/s"
                data={requestsHistory}
                color="#52c41a"
                unit=" req/s"
                height={200}
                type="line"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Conexões Ativas" extra={<GlobalOutlined />}>
              <ApiChart 
                title="Conexões"
                data={connectionsHistory}
                color="#1890ff"
                unit=" conn"
                height={200}
                type="area"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Latência de Resposta" extra={<LineChartOutlined />}>
              <ApiChart 
                title="Latência"
                data={latencyHistory}
                color="#722ed1"
                unit="ms"
                height={200}
                type="spline"
              />
            </Card>
          </Col>
        </Row>

        {/* Servidores Upstream */}
        <Divider orientation="left" style={{ marginTop: 32 }}>Servidores Upstream</Divider>
        <Card>
          <Table 
            dataSource={upstreams.map((upstream, index) => ({ ...upstream, key: index }))}
            columns={upstreamColumns}
            pagination={false}
            size="small"
          />
        </Card>

        {/* Localizações/Rotas */}
        <Divider orientation="left" style={{ marginTop: 32 }}>Estatísticas por Localização</Divider>
        <Card>
          <Table 
            dataSource={locations.map((location, index) => ({ ...location, key: index }))}
            columns={locationColumns}
            pagination={false}
            scroll={{ y: 300 }}
            size="small"
          />
        </Card>

        {/* Informações do Sistema */}
        <Divider orientation="left" style={{ marginTop: 32 }}>Informações do Sistema</Divider>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card title="Status do Serviço" extra={<CheckCircleOutlined style={{ color: '#52c41a' }} />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Serviço:</strong> {status?.service || 'Nginx'}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    {status?.status || 'Active'}
                  </Tag>
                </div>
                <div>
                  <strong>SSL/TLS:</strong> {status?.ssl || 'Enabled'}
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Portas Ativas" extra={<DatabaseOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {status?.ports?.map(port => (
                  <Tag key={port} color="blue">
                    Porta {port}
                  </Tag>
                )) || [
                  <Tag key="80" color="blue">Porta 80</Tag>,
                  <Tag key="443" color="blue">Porta 443</Tag>,
                  <Tag key="8080" color="blue">Porta 8080</Tag>
                ]}
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Última Atualização" extra={<CloudServerOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Tempo de Atividade:</strong><br />
                  {metrics?.uptime?.formatted || '0h 0m'}
                </div>
                <div>
                  <strong>Última Verificação:</strong><br />
                  {status?.lastCheck ? format(new Date(status.lastCheck), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Spin>
    </motion.div>
  );
};

export default Nginx;