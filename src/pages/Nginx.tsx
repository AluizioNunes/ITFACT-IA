import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Divider, Statistic, Table, Spin, Alert, Button, Tag, Progress, Space } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
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

// Variantes de animação modernas
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
      type: "spring",
      damping: 25,
      stiffness: 120
    }
  }
};

const headerVariants = {
  hidden: { 
    opacity: 0, 
    y: -60,
    scale: 0.8,
    rotateX: -30
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
      mass: 0.8
    }
  }
};

const metricCardVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.8,
    rotateY: -20
  },
  visible: (index: number) => ({ 
    opacity: 1, 
    y: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 250,
      delay: index * 0.1,
      mass: 0.9
    }
  }),
  hover: {
    scale: 1.05,
    y: -10,
    rotateY: 5,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 400
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 500
    }
  }
};

const chartCardVariants = {
  hidden: { 
    opacity: 0, 
    x: -100,
    filter: "blur(20px)",
    scale: 0.7
  },
  visible: (index: number) => ({ 
    opacity: 1, 
    x: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 150,
      delay: index * 0.15,
      duration: 1.2
    }
  }),
  hover: {
    scale: 1.03,
    y: -8,
    rotateX: 5,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

const tableVariants = {
  hidden: { 
    opacity: 0, 
    y: 100,
    scale: 0.9,
    filter: "blur(10px)"
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 120,
      duration: 1
    }
  },
  hover: {
    scale: 1.01,
    y: -5,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

const systemInfoVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0,
    rotate: -45
  },
  visible: (index: number) => ({ 
    opacity: 1, 
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200,
      delay: index * 0.2
    }
  }),
  hover: {
    scale: 1.05,
    rotate: 2,
    boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

const buttonVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0,
    rotate: -180
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200,
      delay: 0.3
    }
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    boxShadow: "0 10px 25px rgba(24, 144, 255, 0.3)",
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 400
    }
  },
  tap: {
    scale: 0.9,
    rotate: -5,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 500
    }
  }
};

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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ perspective: 1000 }}
    >
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Divider orientation="left">
          Nginx - Métricas em Tempo Real
          <motion.div
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            style={{ display: 'inline-block', marginLeft: 16 }}
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
            initial={{ opacity: 0, height: 0, scale: 0.8 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200 
            }}
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
        {/* Métricas Principais */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <motion.div
                custom={0}
                variants={metricCardVariants}
                whileHover="hover"
                whileTap="tap"
                style={{ transformStyle: 'preserve-3d' }}
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
                custom={1}
                variants={metricCardVariants}
                whileHover="hover"
                whileTap="tap"
                style={{ transformStyle: 'preserve-3d' }}
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
                custom={2}
                variants={metricCardVariants}
                whileHover="hover"
                whileTap="tap"
                style={{ transformStyle: 'preserve-3d' }}
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
                custom={3}
                variants={metricCardVariants}
                whileHover="hover"
                whileTap="tap"
                style={{ transformStyle: 'preserve-3d' }}
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
        </motion.div>

        {/* Gráficos de Performance */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 120,
            delay: 0.5 
          }}
        >
          <Divider orientation="left" style={{ marginTop: 32 }}>Gráficos de Performance</Divider>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <motion.div
                custom={0}
                variants={chartCardVariants}
                whileHover="hover"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card title="Requisições por Segundo" extra={<BarChartOutlined />}>
                  <ApiChart 
                    title="Req/s"
                    data={requestsHistory}
                    color="#52c41a"
                    unit=" req/s"
                    height={200}
                    type="line"
                    theme="modern"
                    animation="smooth"
                    gradient={true}
                    showDataZoom={true}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={8}>
              <motion.div
                custom={1}
                variants={chartCardVariants}
                whileHover="hover"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card title="Conexões Ativas" extra={<GlobalOutlined />}>
                  <ApiChart 
                    title="Conexões"
                    data={connectionsHistory}
                    color="#1890ff"
                    unit=" conn"
                    height={200}
                    type="area"
                    theme="modern"
                    animation="elastic"
                    gradient={true}
                    showDataZoom={true}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={8}>
              <motion.div
                custom={2}
                variants={chartCardVariants}
                whileHover="hover"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card title="Latência de Resposta" extra={<LineChartOutlined />}>
                  <ApiChart 
                    title="Latência"
                    data={latencyHistory}
                    color="#722ed1"
                    unit="ms"
                    height={200}
                    type="spline"
                    theme="modern"
                    animation="bounce"
                    gradient={true}
                    showDataZoom={true}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>

        {/* Servidores Upstream */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 120,
            delay: 0.8 
          }}
        >
          <Divider orientation="left" style={{ marginTop: 32 }}>Servidores Upstream</Divider>
        </motion.div>
        
        <motion.div
          variants={tableVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Card>
            <Table 
              dataSource={upstreams.map((upstream, index) => ({ ...upstream, key: index }))}
              columns={upstreamColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </motion.div>

        {/* Localizações/Rotas */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 120,
            delay: 1.0 
          }}
        >
          <Divider orientation="left" style={{ marginTop: 32 }}>Estatísticas por Localização</Divider>
        </motion.div>
        
        <motion.div
          variants={tableVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Card>
            <Table 
              dataSource={locations.map((location, index) => ({ ...location, key: index }))}
              columns={locationColumns}
              pagination={false}
              scroll={{ y: 300 }}
              size="small"
            />
          </Card>
        </motion.div>

        {/* Informações do Sistema */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 120,
            delay: 1.2 
          }}
        >
          <Divider orientation="left" style={{ marginTop: 32 }}>Informações do Sistema</Divider>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <motion.div
                custom={0}
                variants={systemInfoVariants}
                whileHover="hover"
                style={{ transformStyle: 'preserve-3d' }}
              >
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
              </motion.div>
            </Col>
            <Col span={8}>
              <motion.div
                custom={1}
                variants={systemInfoVariants}
                whileHover="hover"
                style={{ transformStyle: 'preserve-3d' }}
              >
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
              </motion.div>
            </Col>
            <Col span={8}>
              <motion.div
                custom={2}
                variants={systemInfoVariants}
                whileHover="hover"
                style={{ transformStyle: 'preserve-3d' }}
              >
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
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </Spin>
    </motion.div>
  );
};

export default Nginx;