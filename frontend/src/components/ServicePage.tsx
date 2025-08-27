import React from 'react';
import { Card, Divider, Row, Col, Statistic, Button } from 'antd';
import { motion } from 'framer-motion';
import { BarChartOutlined, LinkOutlined, LineChartOutlined, DashboardOutlined } from '@ant-design/icons';
import ApiChart from './ApiChart';

interface ServicePageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  metrics?: { name: string; value: string | number; unit?: string }[];
  externalUrl?: string;
  chartData?: {
    utilization: Array<{ time: string; value: number }>;
    performance: Array<{ time: string; value: number }>;
  };
}

const ServicePage: React.FC<ServicePageProps> = ({ title, description, icon, metrics = [], externalUrl, chartData }) => {
  // Gerar dados mock se não fornecidos
  const generateMockData = () => {
    const currentTime = new Date();
    const data = [];
    
    // Gerar 12 pontos de dados (últimas 12 horas)
    for (let i = 11; i >= 0; i--) {
      const timestamp = new Date(currentTime.getTime() - (i * 3600000)); // 1 hora
      data.push({
        time: timestamp.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        value: 60 + Math.floor(Math.random() * 40) // 60-100%
      });
    }
    return data;
  };

  const utilizationData = chartData?.utilization || generateMockData();
  const performanceData = chartData?.performance || generateMockData().map(item => ({
    ...item,
    value: 20 + Math.floor(Math.random() * 60) // 20-80ms para performance
  }));
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

      <Divider orientation="left" style={{ marginTop: 32 }}>Gráficos de Monitoramento</Divider>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Utilização do Serviço" extra={<DashboardOutlined />}>
            <ApiChart 
              title="Utilização"
              data={utilizationData}
              color="#1890ff"
              unit="%"
              height={280}
              type="area"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Performance" extra={<LineChartOutlined />}>
            <ApiChart 
              title="Tempo de Resposta"
              data={performanceData}
              color="#52c41a"
              unit="ms"
              height={280}
              type="spline"
            />
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default ServicePage;