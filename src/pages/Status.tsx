import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Row, Col, Tag, Button, Divider } from 'antd';
import { DashboardOutlined, ApiOutlined, LinkOutlined, MessageOutlined, RocketOutlined, ClusterOutlined, DatabaseOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { containerVariants, cardVariants, buttonVariants } from '../ui/animations';
import { SERVICE_URLS, ServiceKey } from '../config/services';

type StatusInfo = {
  online: boolean | null;
  checking: boolean;
  lastCheckedAt?: Date;
};

const serviceOrder: ServiceKey[] = ['grafana', 'prometheus' as any, 'loki' as any, 'n8n', 'rabbitmq', 'redis', 'chatwoot', 'evolutionApi', 'whatsapp'];

const iconFor: Record<string, React.ReactNode> = {
  grafana: <DashboardOutlined />,
  n8n: <ApiOutlined />,
  rabbitmq: <ClusterOutlined />,
  redis: <DatabaseOutlined />,
  chatwoot: <MessageOutlined />,
  evolutionApi: <RocketOutlined />,
  whatsapp: <MessageOutlined />,
};

const Status: React.FC = () => {
  const [statusMap, setStatusMap] = useState<Record<string, StatusInfo>>({});
  const aborters = useRef<Record<string, AbortController>>({});

  const urls = useMemo(() => SERVICE_URLS, []);

  const checkOne = async (key: ServiceKey) => {
    const url = urls[key];
    if (!url) {
      setStatusMap(prev => ({ ...prev, [key]: { online: null, checking: false } }));
      return;
    }
    try {
      setStatusMap(prev => ({ ...prev, [key]: { ...(prev[key] || { online: null }), checking: true } }));
      if (aborters.current[key]) aborters.current[key].abort();
      const controller = new AbortController();
      aborters.current[key] = controller;
      const timeout = setTimeout(() => controller.abort(), 4000);
      await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: controller.signal });
      clearTimeout(timeout);
      setStatusMap(prev => ({ ...prev, [key]: { online: true, checking: false, lastCheckedAt: new Date() } }));
    } catch {
      setStatusMap(prev => ({ ...prev, [key]: { online: false, checking: false, lastCheckedAt: new Date() } }));
    }
  };

  const checkAll = () => {
    (Object.keys(urls) as ServiceKey[]).forEach(checkOne);
  };

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 30000);
    return () => {
      clearInterval(interval);
      Object.values(aborters.current).forEach(a => a.abort());
    };
  }, []);

  const displayOrder: ServiceKey[] = Object.keys(urls) as ServiceKey[];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Divider orientation="left">Status dos Serviços</Divider>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={checkAll}>Verificar todos agora</Button>
      </div>
      <Row gutter={[16, 16]}>
        {displayOrder.map((key) => {
          const info = statusMap[key] || { online: null, checking: false };
          const tagColor = info.online === null ? 'default' : info.online ? 'green' : 'red';
          const tagText = info.checking ? 'Verificando…' : info.online === null ? 'Sem URL' : info.online ? 'Online' : 'Offline';
          const icon = iconFor[key] || <LinkOutlined />;
          const last = info.lastCheckedAt ? info.lastCheckedAt.toLocaleTimeString('pt-BR') : '—';
          return (
            <Col span={8} key={key}>
              <motion.div variants={cardVariants} whileHover="hover">
                <Card title={key.toUpperCase()} extra={icon}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Tag color={tagColor}>{tagText}</Tag>
                    <span style={{ color: '#888' }}>Última verificação: {last}</span>
                  </div>
                  <motion.div variants={buttonVariants} initial="hidden" animate="visible" style={{ display: 'flex', gap: 8 }}>
                    <Button type="primary" icon={<LinkOutlined />} onClick={() => window.open(urls[key], '_blank')}>Abrir</Button>
                    <Button onClick={() => checkOne(key)}>Verificar agora</Button>
                  </motion.div>
                </Card>
              </motion.div>
            </Col>
          );
        })}
      </Row>
    </motion.div>
  );
};

export default Status;