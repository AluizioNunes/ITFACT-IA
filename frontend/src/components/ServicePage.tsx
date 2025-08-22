import React from 'react';
import { Card, Divider, Row, Col, Statistic, Button } from 'antd';
import { motion } from 'framer-motion';
import { BarChartOutlined, LinkOutlined } from '@ant-design/icons';

interface ServicePageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  metrics?: { name: string; value: string | number; unit?: string }[];
  externalUrl?: string;
}

const ServicePage: React.FC<ServicePageProps> = ({ title, description, icon, metrics = [], externalUrl }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Divider orientation="left">{title}</Divider>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          {icon}
          <h2 style={{ margin: 0, marginLeft: 12 }}>{title}</h2>
        </div>
        <p>{description}</p>
        {externalUrl && (
          <Button 
            type="primary" 
            icon={<LinkOutlined />}
            onClick={() => window.open(externalUrl, '_blank')}
            style={{ marginTop: 16 }}
          >
            Acessar {title}
          </Button>
        )}
      </Card>

      {metrics.length > 0 && (
        <>
          <Divider orientation="left">Métricas</Divider>
          <Row gutter={[16, 16]}>
            {metrics.map((metric, index) => (
              <Col span={8} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card>
                    <Statistic
                      title={metric.name}
                      value={metric.value}
                      suffix={metric.unit}
                    />
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </>
      )}

      <Divider orientation="left" style={{ marginTop: 32 }}>Gráficos</Divider>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Utilização" extra={<BarChartOutlined />}>
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
              <span>Gráfico de Utilização</span>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Performance" extra={<BarChartOutlined />}>
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
              <span>Gráfico de Performance</span>
            </div>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default ServicePage;