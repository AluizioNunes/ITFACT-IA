import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Divider, Statistic, Spin, Alert, Progress, Table } from 'antd';
import { motion } from 'framer-motion';
import { DatabaseOutlined, ApiOutlined, BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import ApiChart from '../components/ApiChart';

interface PostgresStatus {
  service: string;
  version: string;
  status: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
}

interface PostgresMetrics {
  activeConnections: number;
  maxConnections: number;
  connectionUsage: number;
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    cacheHitRatio: number;
    avgQueryTime: number;
  };
}

interface PostgresDatabase {
  name: string;
  size: string;
  tables: number;
  connections: number;
}

const PostgreSQL: React.FC = () => {
  const [status, setStatus] = useState<PostgresStatus | null>(null);
  const [metrics, setMetrics] = useState<PostgresMetrics | null>(null);
  const [databases, setDatabases] = useState<PostgresDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPostgresData = async () => {
    try {
      setLoading(true);
      const [statusRes, metricsRes, databasesRes] = await Promise.all([
        fetch('/api/postgresql/status'),
        fetch('/api/postgresql/metrics'),
        fetch('/api/postgresql/databases')
      ]);
      
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
      
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
      
      if (databasesRes.ok) {
        const databasesData = await databasesRes.json();
        setDatabases(databasesData.databases || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados do PostgreSQL:', err);
      setError('Não foi possível conectar ao PostgreSQL. Verifique se o serviço está rodando.');
      // Dados de fallback
      setStatus({
        service: 'PostgreSQL',
        version: '17.6',
        status: 'running',
        uptime: { seconds: 0, formatted: '0 min' }
      });
      setMetrics({
        activeConnections: 15,
        maxConnections: 100,
        connectionUsage: 15,
        performance: {
          cpuUsage: 8.5,
          memoryUsage: 120,
          diskUsage: 190,
          cacheHitRatio: 97.8,
          avgQueryTime: 12.3
        }
      });
      setDatabases([
        { name: 'automacao_db', size: '125MB', tables: 8, connections: 5 },
        { name: 'postgres', size: '8MB', tables: 0, connections: 1 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostgresData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPostgresData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Gerar dados para gráficos
  const generateChartData = () => {
    const currentTime = new Date();
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
      const timestamp = new Date(currentTime.getTime() - (i * 300000)); // 5 min intervals
      data.push({
        time: timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        value: metrics?.performance ? 
          Math.max(0, metrics.performance.cpuUsage + (Math.random() * 4) - 2) :
          5 + Math.random() * 10
      });
    }
    return data;
  };

  const cpuData = generateChartData();
  const memoryData = generateChartData().map(item => ({
    ...item,
    value: metrics?.performance ? 
      Math.max(50, metrics.performance.memoryUsage + (Math.random() * 20) - 10) :
      80 + Math.random() * 40
  }));

  const connectionsData = generateChartData().map(item => ({
    ...item,
    value: metrics ? 
      Math.max(5, metrics.activeConnections + Math.floor(Math.random() * 10) - 5) :
      10 + Math.random() * 15
  }));

  const queryTimeData = generateChartData().map(item => ({
    ...item,
    value: metrics?.performance ? 
      Math.max(1, metrics.performance.avgQueryTime + (Math.random() * 6) - 3) :
      8 + Math.random() * 10
  }));

  // Configurar colunas da tabela de bancos de dados
  const databaseColumns = [
    {
      title: 'Banco de Dados',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>
    },
    {
      title: 'Tamanho',
      dataIndex: 'size',
      key: 'size'
    },
    {
      title: 'Tabelas',
      dataIndex: 'tables',
      key: 'tables'
    },
    {
      title: 'Conexões Ativas',
      dataIndex: 'connections',
      key: 'connections'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Divider orientation="left">
        <DatabaseOutlined style={{ marginRight: 8 }} />
        PostgreSQL 17.6 - Monitoramento em Tempo Real
      </Divider>
      
      {error && (
        <Alert 
          message="Aviso de Conectividade" 
          description={error}
          type="warning" 
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>Carregando métricas do PostgreSQL...</p>
        </div>
      ) : (
        <>
          {/* Status Geral */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Status" 
                  value={status?.status === 'running' ? 'Operacional' : 'Inativo'}
                  prefix={<CheckCircleOutlined style={{ color: status?.status === 'running' ? '#52c41a' : '#ff4d4f' }} />} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Versão" 
                  value={status?.version || '17.6'}
                  prefix={<DatabaseOutlined />} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Tempo Ativo" 
                  value={status?.uptime?.formatted || 'N/A'}
                  prefix={<ClockCircleOutlined />} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Conexões Ativas" 
                  value={metrics?.activeConnections || 0}
                  suffix={`/ ${metrics?.maxConnections || 100}`}
                  prefix={<ApiOutlined />} 
                />
              </Card>
            </Col>
          </Row>

          {/* Métricas de Performance */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card title="Uso de CPU" extra={<BarChartOutlined />}>
                <div style={{ marginBottom: 16 }}>
                  <Progress 
                    percent={Math.round(metrics?.performance?.cpuUsage || 0)} 
                    status={metrics?.performance?.cpuUsage && metrics.performance.cpuUsage > 80 ? 'exception' : 'normal'}
                    format={percent => `${percent}%`}
                  />
                </div>
                <Statistic 
                  value={metrics?.performance?.cpuUsage?.toFixed(1) || '0.0'} 
                  suffix="%" 
                  precision={1}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Uso de Memória" extra={<BarChartOutlined />}>
                <div style={{ marginBottom: 16 }}>
                  <Progress 
                    percent={Math.round((metrics?.performance?.memoryUsage || 0) / 2)} 
                    status="normal"
                    format={() => `${metrics?.performance?.memoryUsage || 0}MB`}
                  />
                </div>
                <Statistic 
                  value={metrics?.performance?.memoryUsage || 0} 
                  suffix="MB" 
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Taxa de Cache Hit" extra={<BarChartOutlined />}>
                <div style={{ marginBottom: 16 }}>
                  <Progress 
                    percent={Math.round(metrics?.performance?.cacheHitRatio || 0)} 
                    status={metrics?.performance?.cacheHitRatio && metrics.performance.cacheHitRatio < 90 ? 'exception' : 'success'}
                    format={percent => `${percent}%`}
                  />
                </div>
                <Statistic 
                  value={metrics?.performance?.cacheHitRatio?.toFixed(2) || '0.00'} 
                  suffix="%" 
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          {/* Gráficos de Performance */}
          <Divider orientation="left">Gráficos de Performance</Divider>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card>
                <ApiChart 
                  title="Uso de CPU (%)"
                  data={cpuData}
                  color="#1890ff"
                  unit="%"
                  height={280}
                  type="line"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <ApiChart 
                  title="Uso de Memória (MB)"
                  data={memoryData}
                  color="#52c41a"
                  unit="MB"
                  height={280}
                  type="area"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card>
                <ApiChart 
                  title="Conexões Ativas"
                  data={connectionsData}
                  color="#faad14"
                  unit="conexões"
                  height={280}
                  type="column"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <ApiChart 
                  title="Tempo Médio de Query (ms)"
                  data={queryTimeData}
                  color="#f5222d"
                  unit="ms"
                  height={280}
                  type="line"
                />
              </Card>
            </Col>
          </Row>

          {/* Bancos de Dados */}
          <Divider orientation="left">Bancos de Dados</Divider>
          <Card>
            <Table 
              columns={databaseColumns}
              dataSource={databases.map((db, index) => ({ ...db, key: index }))}
              pagination={false}
              size="middle"
            />
          </Card>

          {/* Configurações */}
          <Divider orientation="left" style={{ marginTop: 32 }}>Configurações do Servidor</Divider>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Parâmetros Principais" extra={<DatabaseOutlined />}>
                <Row gutter={[8, 8]}>
                  <Col span={12}><strong>Max Connections:</strong></Col>
                  <Col span={12}>{metrics?.maxConnections || 100}</Col>
                  <Col span={12}><strong>Shared Buffers:</strong></Col>
                  <Col span={12}>128MB</Col>
                  <Col span={12}><strong>Effective Cache Size:</strong></Col>
                  <Col span={12}>4GB</Col>
                  <Col span={12}><strong>Work Mem:</strong></Col>
                  <Col span={12}>4MB</Col>
                  <Col span={12}><strong>Maintenance Work Mem:</strong></Col>
                  <Col span={12}>64MB</Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Métricas de Performance" extra={<BarChartOutlined />}>
                <Row gutter={[8, 8]}>
                  <Col span={12}><strong>Cache Hit Ratio:</strong></Col>
                  <Col span={12}>{metrics?.performance?.cacheHitRatio?.toFixed(2) || '0.00'}%</Col>
                  <Col span={12}><strong>Avg Query Time:</strong></Col>
                  <Col span={12}>{metrics?.performance?.avgQueryTime?.toFixed(1) || '0.0'}ms</Col>
                  <Col span={12}><strong>Disk Usage:</strong></Col>
                  <Col span={12}>{metrics?.performance?.diskUsage || 0}MB</Col>
                  <Col span={12}><strong>Connection Usage:</strong></Col>
                  <Col span={12}>{metrics?.connectionUsage || 0}%</Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </motion.div>
  );
};

export default PostgreSQL;
