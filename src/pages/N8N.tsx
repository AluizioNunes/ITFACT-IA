import React from 'react';
import ServicePage from '../components/ServicePage';
import { getServiceUrl } from '../config/services';
import { RobotOutlined } from '@ant-design/icons';
import { mockData } from './N8N/mock-data';
import { Line, Column, Pie } from '@ant-design/charts';
import { Table, Card, Row, Col, Statistic, Timeline, Tag } from 'antd';

const N8N: React.FC = () => {
  const {
    templateInfo,
    nodeSummary,
    totals,
    chatStats,
    executionsOverTime,
    nodeTypeDistribution,
    agentPerformance,
    nodeList,
    credentialsStatus,
    guiaUso,
  } = mockData;

  const lineChartConfig = {
    data: executionsOverTime,
    xField: 'date',
    yField: 'count',
    height: 300,
    meta: {
      date: { alias: 'Data' },
      count: { alias: 'Execuções' },
    },
  } as any;

  const columnChartConfig = {
    data: agentPerformance,
    xField: 'agent',
    yField: 'tasks',
    height: 300,
    meta: {
      agent: { alias: 'Agente' },
      tasks: { alias: 'Tarefas' },
    },
  } as any;

  const pieChartConfig = {
    data: nodeTypeDistribution,
    angleField: 'value',
    colorField: 'type',
    height: 300,
    legend: { position: 'right' as const },
    label: { text: 'value', content: (d: any) => `${d.type}` },
  } as any;

  const agentPerformanceColumns = [
    { title: 'Agente', dataIndex: 'agent', key: 'agent' },
    { title: 'Tarefas', dataIndex: 'tasks', key: 'tasks' },
    { title: 'Taxa de Sucesso', dataIndex: 'successRate', key: 'successRate', render: (rate: number) => `${(rate * 100).toFixed(0)}%` },
    { title: 'Tempo Médio (s)', dataIndex: 'avgResponseSec', key: 'avgResponseSec' },
  ];

  const nodesColumns = [
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    { title: 'Tipo', dataIndex: 'type', key: 'type' },
    { title: 'Categoria', dataIndex: 'category', key: 'category' },
    { title: 'Credencial', dataIndex: 'credential', key: 'credential' },
    { title: 'Obrigatório', dataIndex: 'required', key: 'required', render: (v: boolean) => (v ? 'Sim' : 'Não') },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'OK' ? 'green' : 'orange'}>{s}</Tag> },
  ];

  return (
    <ServicePage
      title={`N8N — ${templateInfo.name} (${templateInfo.version})`}
      description={templateInfo.description}
      icon={<RobotOutlined style={{ fontSize: '24px', color: '#ff6d5a' }} />}
      metrics={[]}
      externalUrl={getServiceUrl('n8n')}
    >
      {/* Métricas gerais */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Workflows (total)" value={totals.totalWorkflows} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Workflows ativos" value={totals.activeWorkflows} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Workflows com falha" value={totals.failedWorkflows} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Execuções (total)" value={totals.totalExecutions} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Execuções com sucesso" value={totals.successfulExecutions} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Execuções com falha" value={totals.failedExecutions} />
          </Card>
        </Col>
      </Row>

      {/* Resumo de nós */}
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Nós do fluxo" value={nodeSummary.totalNodes} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="OpenAI (nós)" value={nodeSummary.openaiNodes} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Supabase (nós)" value={nodeSummary.supabaseNodes} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Evolution API (nós)" value={nodeSummary.evolutionApiNodes} />
          </Card>
        </Col>
      </Row>

      {/* Execuções ao longo do tempo */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Execuções ao Longo do Tempo">
            <Line {...lineChartConfig} />
          </Card>
        </Col>
      </Row>

      {/* Distribuição por tipo e desempenho dos agentes */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Distribuição de Tipos de Nó">
            <Pie {...pieChartConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Desempenho dos Agentes (Tarefas)">
            <Column {...columnChartConfig} />
          </Card>
        </Col>
      </Row>

      {/* Conversas e atendimento */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Conversas ativas" value={chatStats.activeConversations} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Méd. msg por conversa" value={chatStats.avgMessagesPerConversation} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Tempo méd. resposta (s)" value={chatStats.avgAgentResponseSeconds} precision={1} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic title="Leads notificados (grupo)" value={chatStats.leadsNotifiedGroup} />
          </Card>
        </Col>
      </Row>

      {/* Tabela de agentes */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Desempenho dos Agentes (Detalhado)">
            <Table dataSource={agentPerformance} columns={agentPerformanceColumns} pagination={false} />
          </Card>
        </Col>
      </Row>

      {/* Nós do template */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Nós do Template (Resumo)">
            <Table dataSource={nodeList} columns={nodesColumns} pagination={false} />
          </Card>
        </Col>
      </Row>

      {/* Guia de uso e credenciais */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Guia de Uso (resumo)">
            <Timeline
              items={guiaUso.map((g) => ({
                color: 'blue',
                children: (
                  <div>
                    <strong>{`${g.step}. ${g.title}`}</strong>
                    <div>{g.description}</div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Credenciais (status simulado)">
            <Table
              dataSource={credentialsStatus}
              columns={[
                { title: 'Nome', dataIndex: 'name', key: 'name' },
                { title: 'ID', dataIndex: 'id', key: 'id' },
                {
                  title: 'Configurada',
                  dataIndex: 'configured',
                  key: 'configured',
                  render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Sim' : 'Não'}</Tag>,
                },
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </ServicePage>
  );
};

export default N8N;