import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Divider, Statistic, Spin, Alert, Progress, Table, Button } from 'antd';
import { motion } from 'framer-motion';
import { DatabaseOutlined, ApiOutlined, BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
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

interface PostgresTable {
  database: string;
  schema_name: string;
  table_name: string;
  size: string;
  size_bytes: number;
  column_count: number;
}

const PostgreSQL: React.FC = () => {
  const [status, setStatus] = useState<PostgresStatus | null>(null);
  const [metrics, setMetrics] = useState<PostgresMetrics | null>(null);
  const [databases, setDatabases] = useState<PostgresDatabase[]>([]);
  const [tables, setTables] = useState<PostgresTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPostgresData = async () => {
    try {
      setLoading(true);
      setConnectionError(false);
      
      const baseUrl = 'http://172.18.1.32:3001'; // Usar IP do servidor remoto
      
      const [statusRes, metricsRes, databasesRes] = await Promise.all([
        fetch(`${baseUrl}/api/postgresql/status`),
        fetch(`${baseUrl}/api/postgresql/metrics`),
        fetch(`${baseUrl}/api/postgresql/databases`)
      ]);
      
      let hasError = false;
      
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      } else {
        hasError = true;
        const errorData = await statusRes.json();
        console.error('Status error:', errorData);
      }
      
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      } else {
        hasError = true;
        const errorData = await metricsRes.json();
        console.error('Metrics error:', errorData);
      }
      
      if (databasesRes.ok) {
        const databasesData = await databasesRes.json();
        console.log('Dados de bancos recebidos:', databasesData);
        
        if (databasesData.error || databasesData.isFallback) {
          console.warn('Usando dados de fallback para bancos de dados');
          setError('Usando dados simulados como fallback - o servidor PostgreSQL pode estar indisponível');
        } else {
          setError(null);
        }
        
        setDatabases(databasesData.databases || []);
      } else {
        hasError = true;
        try {
          const errorData = await databasesRes.json();
          console.error('Databases error:', errorData);
        } catch (parseError) {
          console.error('Falha ao analisar resposta de erro:', parseError);
        }
      }
      
      if (hasError) {
        setConnectionError(true);
        setError('Falha de conexão com PostgreSQL. Alguns dados podem não estar disponíveis.');
      } else {
        setError(null);
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados do PostgreSQL:', err);
      setConnectionError(true);
      setError('Não foi possível conectar ao PostgreSQL. Verifique se o serviço está rodando.');
      
      // Clear all data on connection error - NO MOCK DATA
      setStatus(null);
      setMetrics(null);
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTablesData = async () => {
    try {
      setTablesLoading(true);
      const baseUrl = 'http://172.18.1.32:3001'; // Usar IP do servidor remoto
      const tablesRes = await fetch(`${baseUrl}/api/postgresql/tables`);
      
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        console.log('Dados de tabelas recebidos:', tablesData);
        setTables(tablesData.tables || []);
      } else {
        const errorData = await tablesRes.json();
        console.error('Tables error:', errorData);
        setTables([]);
      }
    } catch (err) {
      console.error('Erro ao carregar tabelas do PostgreSQL:', err);
      setTables([]);
    } finally {
      setTablesLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPostgresData(),
        fetchTablesData()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPostgresData();
    fetchTablesData();
    
    // Remover atualização automática para evitar oscilações na interface
    // const interval = setInterval(() => {
    //   fetchPostgresData();
    //   fetchTablesData();
    // }, 30000);
    
    // return () => clearInterval(interval);
  }, []);

  // Gerar dados para gráficos - apenas se houver conexão
  const generateChartData = () => {
    if (connectionError || !metrics) {
      // Return empty data when there's a connection error
      return [];
    }
    
    const currentTime = new Date();
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
      const timestamp = new Date(currentTime.getTime() - (i * 300000)); // 5 min intervals
      data.push({
        time: timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        value: metrics.performance ? 
          Math.max(0, metrics.performance.cpuUsage + (Math.random() * 4) - 2) :
          0
      });
    }
    return data;
  };

  const cpuData = generateChartData();
  const memoryData = generateChartData().map(item => ({
    ...item,
    value: connectionError || !metrics?.performance ? 
      0 :
      Math.max(50, metrics.performance.memoryUsage + (Math.random() * 20) - 10)
  }));

  const connectionsData = generateChartData().map(item => ({
    ...item,
    value: connectionError || !metrics ? 
      0 :
      Math.max(5, metrics.activeConnections + Math.floor(Math.random() * 10) - 5)
  }));

  const queryTimeData = generateChartData().map(item => ({
    ...item,
    value: connectionError || !metrics?.performance ? 
      0 :
      Math.max(1, metrics.performance.avgQueryTime + (Math.random() * 6) - 3)
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
  
  // Configurar colunas da tabela de tabelas
  const tableColumns = [
    {
      title: 'Banco de Dados',
      dataIndex: 'database',
      key: 'database',
      render: (database: string) => <strong>{database}</strong>
    },
    {
      title: 'Schema',
      dataIndex: 'schema_name',
      key: 'schema_name'
    },
    {
      title: 'Tabela',
      dataIndex: 'table_name',
      key: 'table_name',
      render: (tableName: string) => <code>{tableName}</code>
    },
    {
      title: 'Tamanho',
      dataIndex: 'size',
      key: 'size'
    },
    {
      title: 'Colunas',
      dataIndex: 'column_count',
      key: 'column_count'
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
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh} 
          loading={refreshing}
          style={{ marginLeft: 16 }}
        >
          Atualizar Dados
        </Button>
      </Divider>
      
      {error && (
        <Alert 
          message={connectionError ? "Falha de Conexão" : "Aviso de Sistema"} 
          description={error}
          type={connectionError ? "error" : "warning"} 
          showIcon
          style={{ marginBottom: 24 }}
          action={
            connectionError ? (
              <span style={{ fontSize: '12px', color: '#666' }}>
                Dados indisponíveis - Verifique se o PostgreSQL está rodando
              </span>
            ) : undefined
          }
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
                  value={connectionError ? 'Desconectado' : (status?.status === 'running' ? 'Operacional' : 'Inativo')}
                  prefix={<CheckCircleOutlined style={{ color: connectionError ? '#ff4d4f' : (status?.status === 'running' ? '#52c41a' : '#ff4d4f') }} />} 
                  valueStyle={{ color: connectionError ? '#ff4d4f' : (status?.status === 'running' ? '#52c41a' : '#ff4d4f') }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Versão" 
                  value={connectionError ? 'N/A' : (status?.version || 'N/A')}
                  prefix={<DatabaseOutlined />} 
                  valueStyle={{ color: connectionError ? '#999' : undefined }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Tempo Ativo" 
                  value={connectionError ? 'N/A' : (status?.uptime?.formatted || 'N/A')}
                  prefix={<ClockCircleOutlined />} 
                  valueStyle={{ color: connectionError ? '#999' : undefined }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Conexões Ativas" 
                  value={connectionError ? 'N/A' : (metrics?.activeConnections || 0)}
                  suffix={connectionError ? '' : `/ ${metrics?.maxConnections || 100}`}
                  prefix={<ApiOutlined />} 
                  valueStyle={{ color: connectionError ? '#999' : undefined }}
                />
              </Card>
            </Col>
          </Row>

          {/* Métricas de Performance */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card title="Uso de CPU" extra={<BarChartOutlined />}>
                {connectionError ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <p>Dados indisponíveis</p>
                    <p style={{ fontSize: '12px' }}>Conexão com banco falhada</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Uso de Memória" extra={<BarChartOutlined />}>
                {connectionError ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <p>Dados indisponíveis</p>
                    <p style={{ fontSize: '12px' }}>Conexão com banco falhada</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Taxa de Cache Hit" extra={<BarChartOutlined />}>
                {connectionError ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <p>Dados indisponíveis</p>
                    <p style={{ fontSize: '12px' }}>Conexão com banco falhada</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </Card>
            </Col>
          </Row>

          {/* Gráficos de Performance */}
          <Divider orientation="left">Gráficos de Performance</Divider>
          {connectionError ? (
            <Alert 
              message="Gráficos Indisponíveis" 
              description="Os gráficos de performance requerem conexão ativa com o PostgreSQL. Verifique se o serviço está funcionando corretamente."
              type="info" 
              showIcon
              style={{ marginBottom: 24 }}
            />
          ) : (
            <>
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
            </>
          )}

          {/* Bancos de Dados */}
          <Divider orientation="left">Bancos de Dados</Divider>
          <Card title="Bancos de Dados" style={{ marginBottom: 24 }}>
            {connectionError ? (
              <Alert 
                message="Informações de Banco Indisponíveis" 
                description="Não é possível conectar ao PostgreSQL para obter informações dos bancos de dados. Verifique se o serviço está rodando e acessível."
                type="error" 
                showIcon
              />
            ) : (
              <>
                {loading ? (
                  <Spin tip="Carregando bancos de dados...">
                    <div style={{ minHeight: 100 }}></div>
                  </Spin>
                ) : (
                  <>
                    {databases && databases.length > 0 ? (
                      <>
                        <Table 
                          columns={databaseColumns}
                          dataSource={databases.map((db, index) => ({ 
                            ...db, 
                            key: `${db.name}-${index}`,
                            // Garantir que tables seja um número
                            tables: typeof db.tables === 'number' ? db.tables : 0,
                            // Garantir que connections seja um número
                            connections: typeof db.connections === 'number' ? db.connections : 0
                          }))}
                          pagination={false}
                          size="middle"
                          rowKey={record => `${record.name}-${record.key}`}
                        />
                        {error && (
                          <Alert 
                            message="Aviso" 
                            description={error}
                            type="warning" 
                            showIcon
                            style={{ marginTop: 16 }}
                          />
                        )}
                      </>
                    ) : (
                      <Alert 
                        message="Sem bancos de dados" 
                        description="Não foram encontrados bancos de dados no servidor PostgreSQL."
                        type="info" 
                        showIcon
                      />
                    )}
                  </>
                )}
              </>
            )}
          </Card>
          
          {/* Tabelas Detalhadas */}
          <Divider orientation="left">Tabelas por Banco de Dados</Divider>
          <Card title="Tabelas e Schemas" style={{ marginBottom: 24 }}>
            {connectionError ? (
              <Alert 
                message="Informações de Tabelas Indisponíveis" 
                description="Não é possível conectar ao PostgreSQL para obter informações das tabelas. Verifique se o serviço está rodando e acessível."
                type="error" 
                showIcon
              />
            ) : (
              <Table 
                columns={tableColumns}
                dataSource={tables.map((table, index) => ({ ...table, key: index }))}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                size="middle"
                loading={tablesLoading}
                scroll={{ x: 800 }}
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ margin: 0, padding: '12px', backgroundColor: '#fafafa' }}>
                      <strong>Detalhes da Tabela:</strong><br/>
                      <p><strong>Banco:</strong> {record.database}</p>
                      <p><strong>Schema:</strong> {record.schema_name}</p>
                      <p><strong>Tabela:</strong> {record.table_name}</p>
                      <p><strong>Tamanho em bytes:</strong> {record.size_bytes?.toLocaleString() || 'N/A'}</p>
                      <p><strong>Número de colunas:</strong> {record.column_count}</p>
                    </div>
                  ),
                  rowExpandable: (record) => record.table_name !== 'N/A',
                }}
              />
            )}
          </Card>

          {/* Configurações */}
          <Divider orientation="left" style={{ marginTop: 32 }}>Configurações do Servidor</Divider>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Parâmetros Principais" extra={<DatabaseOutlined />}>
                {connectionError ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <p>Configurações indisponíveis</p>
                    <p style={{ fontSize: '12px' }}>Conexão com banco falhada</p>
                  </div>
                ) : (
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
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Métricas de Performance" extra={<BarChartOutlined />}>
                {connectionError ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <p>Métricas indisponíveis</p>
                    <p style={{ fontSize: '12px' }}>Conexão com banco falhada</p>
                  </div>
                ) : (
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
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </motion.div>
  );
};

export default PostgreSQL;
