import React from 'react';
import { Card, Row, Col, Divider, Statistic, Table, Tag, Spin, Alert, Descriptions, Select } from 'antd';
import { motion } from 'framer-motion';
import { containerVariants } from '../ui/animations';
import { DockerOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useDockerFleet } from '../hooks/useDockerFleet';

const Docker: React.FC = () => {
  const { servers, selectedIps, setSelectedIps, containers, summary, loading, error, refetch } = useDockerFleet();

  const columns = [
    {
      title: 'Servidor',
      dataIndex: 'host',
      key: 'host',
      width: 220,
    },
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

  const statusCounts = summary;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Divider orientation="left">Visão Geral do Docker</Divider>
      <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
        <Col span={24}>
          <Card size="small">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <strong>Filtrar por servidor:</strong>
              <Select
                mode="multiple"
                allowClear
                style={{ minWidth: 320 }}
                placeholder="Selecione servidores"
                options={servers.map((s) => ({ label: s.hostname || s.ip, value: s.ip }))}
                value={selectedIps}
                onChange={(vals) => setSelectedIps(vals)}
              />
              <Tag color="blue">Total servidores: {servers.length}</Tag>
              <Tag color="geekblue">Selecionados: {selectedIps.length}</Tag>
            </div>
          </Card>
        </Col>
      </Row>
      
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
              title="Hosts monitorados" 
              value={selectedIps.length} 
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
          <Card title="Informações do Fleet" extra={<DockerOutlined />}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Servidores">{servers.length}</Descriptions.Item>
              <Descriptions.Item label="Selecionados">{selectedIps.length}</Descriptions.Item>
              <Descriptions.Item label="Última Atualização">
                {new Date().toLocaleString('pt-BR')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Resumo dos Containers" extra={<DockerOutlined />}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Total">{statusCounts.total}</Descriptions.Item>
              <Descriptions.Item label="Executando">{statusCounts.running}</Descriptions.Item>
              <Descriptions.Item label="Parados">{statusCounts.stopped}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Docker;