import React from 'react';
import { Card, Row, Col, Divider, Statistic, Table, Tag, Spin, Alert } from 'antd';
import { motion } from 'framer-motion';
import { DockerOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useDockerContainers } from '../hooks/useRealData';

const Docker: React.FC = () => {
  const { containers, loading, error } = useDockerContainers();

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
      title: 'Portas',
      dataIndex: 'ports',
      key: 'ports',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'running':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'restarting':
            color = 'processing';
            icon = <SyncOutlined spin />;
            break;
          case 'exited':
            color = 'error';
            icon = <CloseCircleOutlined />;
            break;
          default:
            color = 'default';
        }
        
        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        );
      },
    },
  ];

  const getStatusCounts = () => {
    const counts = {
      running: 0,
      restarting: 0,
      exited: 0,
      total: containers.length,
    };

    containers.forEach((container: any) => {
      if (container.status in counts) {
        counts[container.status as keyof typeof counts]++;
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
              title="Reiniciando" 
              value={statusCounts.restarting} 
              prefix={<SyncOutlined style={{ color: '#1890ff' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Parados" 
              value={statusCounts.exited} 
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />} 
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
            dataSource={containers} 
            columns={columns} 
            pagination={false}
            scroll={{ y: 400 }}
          />
        </Card>
      )}

      <Divider orientation="left" style={{ marginTop: 32 }}>Detalhes Técnicos</Divider>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Versão" extra={<DockerOutlined />}>
            <p>Docker Engine 28.3.3</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="API Version" extra={<DockerOutlined />}>
            <p>1.51</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Plataforma" extra={<DockerOutlined />}>
            <p>Linux</p>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Docker;