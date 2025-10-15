import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Select, Button, Table, Tag, Space, Statistic, Divider, Alert, InputNumber } from 'antd';
import { LineChartOutlined, ReloadOutlined, DatabaseOutlined } from '@ant-design/icons';
import MultiSeriesChart from '../components/MultiSeriesChart';

const { Option } = Select;

type HostRecord = { ip: string; hostname: string; os: string; status: string; last_seen: string };
type ServiceRecord = { service: string; port: number; status: string; ip: string };
type SeriesPoint = { time: string; value: number };

const Reports: React.FC = () => {
  const [hosts, setHosts] = useState<HostRecord[]>([]);
  const [selectedHost, setSelectedHost] = useState<string>('');
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['cpu_usage_percent', 'mem_used_percent']);
  const [limit, setLimit] = useState<number>(60);
  const [series, setSeries] = useState<{ name: string; data: SeriesPoint[] }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadHosts = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/hosts');
      const json = await res.json();
      setHosts(json.hosts || []);
      if (!selectedHost && (json.hosts || []).length > 0) {
        setSelectedHost(json.hosts[0].ip);
      }
    } catch (e) {
      setHosts([]);
    }
  }, [selectedHost]);

  const loadServices = useCallback(async (ip: string) => {
    try {
      const res = await fetch(`/api/inventory/services?ip=${encodeURIComponent(ip)}`);
      const json = await res.json();
      setServices(json.services || []);
    } catch (e) {
      setServices([]);
    }
  }, []);

  const loadMetrics = useCallback(async (ip: string, metrics: string[], points: number) => {
    setLoading(true);
    try {
      const responses = await Promise.all(metrics.map(m => fetch(`/api/inventory/metrics?ip=${encodeURIComponent(ip)}&metric=${encodeURIComponent(m)}&limit=${points}`)));
      const jsons = await Promise.all(responses.map(r => r.json()));
      const built = jsons.map((j, idx) => ({ name: metrics[idx], data: (j.series || []) }));
      setSeries(built);
    } catch (e) {
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHosts();
  }, [loadHosts]);

  useEffect(() => {
    if (selectedHost) {
      loadServices(selectedHost);
      loadMetrics(selectedHost, selectedMetrics, limit);
    }
  }, [selectedHost, selectedMetrics, limit, loadServices, loadMetrics]);

  return (
    <div style={{ padding: '16px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title={<Space><LineChartOutlined /> Relatórios</Space>} extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => { if (selectedHost) loadMetrics(selectedHost, selectedMetrics, limit); }}>
                Atualizar Métricas
              </Button>
            </Space>
          }>
            <Row gutter={12}>
              <Col span={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <span>Host</span>
                  <Select value={selectedHost} onChange={setSelectedHost} style={{ width: '100%' }} placeholder="Selecione um host">
                    {hosts.map(h => (
                      <Option key={h.ip} value={h.ip}>{h.hostname || h.ip} ({h.ip})</Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col span={10}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <span>Métricas</span>
                  <Select mode="multiple" value={selectedMetrics} onChange={setSelectedMetrics} style={{ width: '100%' }} placeholder="Escolha métricas">
                    <Option value="cpu_usage_percent">CPU uso (%)</Option>
                    <Option value="mem_used_percent">Memória usada (%)</Option>
                    <Option value="fs_used_percent">Filesystem usado (%)</Option>
                    <Option value="net_rx_bps">Rede RX (bps)</Option>
                    <Option value="net_tx_bps">Rede TX (bps)</Option>
                  </Select>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <span>Quantidade de pontos</span>
                  <InputNumber min={10} max={360} step={10} value={limit} onChange={(v) => setLimit(Number(v || 60))} style={{ width: '100%' }} />
                </Space>
              </Col>
            </Row>
            <Divider />
            {selectedHost ? (
              <MultiSeriesChart
                title={`Métricas do host ${selectedHost}`}
                series={series}
                type={'line'}
                theme={'modern'}
                showLegend={true}
                showDataZoom={true}
                animation={'smooth'}
                height={300}
              />
            ) : (
              <Alert message="Selecione um host para visualizar métricas" type="info" showIcon />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={<Space><DatabaseOutlined /> Serviços Descobertos</Space>}>
            {selectedHost ? (
              <Table
                size="small"
                columns={[
                  { title: 'Serviço', dataIndex: 'service', key: 'service', render: (name: string) => <Tag color="geekblue">{name}</Tag> },
                  { title: 'Porta', dataIndex: 'port', key: 'port' },
                  { title: 'Status', dataIndex: 'status', key: 'status' },
                ]}
                dataSource={(services || []).map((s, idx) => ({ key: `${s.service}-${idx}`, ...s }))}
              />
            ) : (
              <Alert message="Selecione um host para visualizar serviços" type="info" showIcon />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;