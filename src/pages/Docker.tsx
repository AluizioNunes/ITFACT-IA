import React from 'react';
import { Card, Row, Col, Divider, Statistic, Table, Tag, Spin, Alert, Descriptions } from 'antd';
import { motion } from 'framer-motion';
import { DockerOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useDockerContainers } from '../hooks/useRealData';

const Docker: React.FC = () => {
  const { containers, loading, error, dockerInfo } = useDockerContainers();

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Imagem',
      dataIndex: 'image',
      key: 'image',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let icon = null;
        
        // Normalizar o status para os diferentes formatos que podem vir
        const normalizedStatus = status?.toLowerCase() || '';
        
        if (normalizedStatus.includes('running') || normalizedStatus.includes('up')) {
          color = 'success';
          icon = <CheckCircleOutlined />;
        } else if (normalizedStatus.includes('restarting') || normalizedStatus.includes('restarting')) {
          color = 'processing';
          icon = <SyncOutlined spin />;
        } else if (normalizedStatus.includes('exited') || normalizedStatus.includes('stopped')) {
          color = 'error';
          icon = <CloseCircleOutlined />;
        } else {
          color = 'default';
        }
        
        return (
          <Tag color={color} icon={icon}>
            {status || 'unknown'}
          </Tag>
        );
      },
    },
  ];

  const getStatusCounts = () => {
    const counts = {
      running: 0,
      stopped: 0,
      total: containers.length,
    };

    containers.forEach((container: any) => {
      // Verificar diferentes formas de determinar se o container está rodando
      const isRunning = container.isRunning || 
                       (container.status && (container.status.includes('running') || container.status.includes('up'))) ||
                       false;
      
      if (isRunning) {
        counts.running++;
      } else {
        counts.stopped++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Divider orientation="left">Visão Geral do Docker</Divider>
      
      {error && (
        <Alert 
          message="Erro de Conexão" 
          description="Não foi possível conectar à API do Docker. Mostrando dados simulados."
          type="warning" 
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total de Containers" 
              value={statusCounts.total} 
              prefix={<DockerOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Em Execução" 
              value={statusCounts.running} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Parados" 
              value={statusCounts.stopped} 
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Versão" 
              value={dockerInfo.version || '28.3.3'} 
              prefix={<InfoCircleOutlined />} 
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left" style={{ marginTop: 32 }}>Containers</Divider>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>Carregando informações dos containers...</p>
        </div>
      ) : (
        <Card>
          <Table 
            dataSource={containers.map((container: any, index: number) => ({
              ...container,
              key: container.name || index
            }))} 
            columns={columns} 
            pagination={false}
            scroll={{ y: 400 }}
          />
        </Card>
      )}

      <Divider orientation="left" style={{ marginTop: 32 }}>Detalhes Técnicos</Divider>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Informações do Docker" extra={<DockerOutlined />}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Versão">{dockerInfo.version || '28.3.3'}</Descriptions.Item>
              <Descriptions.Item label="Status">{dockerInfo.status || 'running'}</Descriptions.Item>
              <Descriptions.Item label="Última Verificação">
                {dockerInfo.lastCheck ? new Date(dockerInfo.lastCheck).toLocaleString('pt-BR') : 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Resumo dos Containers" extra={<DockerOutlined />}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Total">{dockerInfo.containers?.total || statusCounts.total}</Descriptions.Item>
              <Descriptions.Item label="Executando">{dockerInfo.containers?.running || statusCounts.running}</Descriptions.Item>
              <Descriptions.Item label="Parados">{dockerInfo.containers?.stopped || statusCounts.stopped}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Docker;