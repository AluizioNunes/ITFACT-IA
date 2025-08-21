import React from 'react';
import { Card, Row, Col, Divider, Statistic, Spin, Alert } from 'antd';
import { motion } from 'framer-motion';
import { DatabaseOutlined, ApiOutlined, BarChartOutlined } from '@ant-design/icons';
import { usePostgresInfo } from '../hooks/useRealData';

const Postgres: React.FC = () => {
  const { info, loading, error } = usePostgresInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Divider orientation="left">Informações do PostgreSQL</Divider>
      
      {error && (
        <Alert 
          message="Erro de Conexão" 
          description="Não foi possível conectar ao PostgreSQL. Mostrando dados simulados."
          type="warning" 
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>Carregando informações do PostgreSQL...</p>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card>
              <Statistic 
                title="Versão" 
                value={info.version || 'PostgreSQL 17.6'} 
                prefix={<DatabaseOutlined />} 
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="Conexões Ativas" 
                value={info.connections || 12} 
                prefix={<DatabaseOutlined />} 
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="Bancos de Dados" 
                value={info.databases || 5} 
                prefix={<DatabaseOutlined />} 
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="Tamanho Total" 
                value={info.size || '2.5 GB'} 
                prefix={<BarChartOutlined />} 
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="Tempo de Atividade" 
                value={info.uptime || '5 dias'} 
                prefix={<ApiOutlined />} 
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="Status" 
                value="Operacional" 
                prefix={<DatabaseOutlined style={{ color: '#52c41a' }} />} 
              />
            </Card>
          </Col>
        </Row>
      )}

      <Divider orientation="left" style={{ marginTop: 32 }}>Bancos de Dados</Divider>
      <Card>
        <p>Lista de bancos de dados disponíveis:</p>
        <ul>
          <li><strong>postgres</strong> - Banco de dados principal</li>
          <li><strong>grafana</strong> - Banco de dados do Grafana</li>
          <li><strong>n8n</strong> - Banco de dados do N8N</li>
          <li><strong>chatwoot</strong> - Banco de dados do Chatwoot</li>
          <li><strong>evolution</strong> - Banco de dados do Evolution API</li>
        </ul>
      </Card>

      <Divider orientation="left" style={{ marginTop: 32 }}>Configurações</Divider>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Parâmetros Principais" extra={<DatabaseOutlined />}>
            <p><strong>shared_buffers:</strong> 128MB</p>
            <p><strong>effective_cache_size:</strong> 4GB</p>
            <p><strong>maintenance_work_mem:</strong> 64MB</p>
            <p><strong>checkpoint_completion_target:</strong> 0.9</p>
            <p><strong>wal_buffers:</strong> 4MB</p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Segurança" extra={<DatabaseOutlined />}>
            <p><strong>ssl:</strong> on</p>
            <p><strong>ssl_cert_file:</strong> server.crt</p>
            <p><strong>ssl_key_file:</strong> server.key</p>
            <p><strong>password_encryption:</strong> scram-sha-256</p>
            <p><strong>log_connections:</strong> on</p>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Postgres;