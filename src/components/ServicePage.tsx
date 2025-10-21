import React from 'react';
import { Card, Divider, Row, Col, Statistic, Button } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, headerVariants, cardVariants, metricCardVariants as metricVariants, chartVariants, buttonVariants } from '../ui/animations';
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

// Variantes importadas do módulo compartilhado

// headerVariants importado do módulo compartilhado

// cardVariants importado do módulo compartilhado

// metricVariants importado do módulo compartilhado

// chartVariants importado do módulo compartilhado

// buttonVariants importado do módulo compartilhado

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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ perspective: 1000 }}
    >
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <Divider orientation="left">{title}</Divider>
      </motion.div>

      <motion.div
        variants={cardVariants}
        whileHover="hover"
        whileTap="tap"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Card>
          <motion.div 
            style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 200,
              delay: 0.2 
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                damping: 15, 
                stiffness: 300,
                delay: 0.3 
              }}
            >
              {icon}
            </motion.div>
            <motion.h2 
              style={{ margin: 0, marginLeft: 12 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 200,
                delay: 0.4 
              }}
            >
              {title}
            </motion.h2>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              delay: 0.5 
            }}
          >
            {description}
          </motion.p>

          <AnimatePresence>
            {externalUrl && (
              <motion.div
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                whileHover="hover"
                whileTap="tap"
                style={{ marginTop: 16 }}
              >
                <Button 
                  type="primary" 
                  icon={<LinkOutlined />}
                  onClick={() => window.open(externalUrl, '_blank')}
                >
                  Acessar {title}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      <AnimatePresence>
        {metrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              delay: 0.6 
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 200,
                delay: 0.7 
              }}
            >
              <Divider orientation="left">Métricas</Divider>
            </motion.div>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Row gutter={[16, 16]}>
                {metrics.map((metric, index) => (
                  <Col span={8} key={index}>
                    <motion.div
                      custom={index}
                      variants={metricVariants}
                      whileHover="hover"
                      style={{ transformStyle: 'preserve-3d' }}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 120,
          delay: 0.8 
        }}
      >
        <Divider orientation="left" style={{ marginTop: 32 }}>Gráficos de Monitoramento</Divider>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <motion.div
                variants={chartVariants}
                whileHover="hover"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card title="Utilização do Serviço" extra={<DashboardOutlined />}>
                  <ApiChart 
                    title="Utilização"
                    data={utilizationData}
                    color="#1890ff"
                    unit="%"
                    height={280}
                    type="area"
                    theme="modern"
                    animation="smooth"
                    gradient={true}
                    showDataZoom={true}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={12}>
              <motion.div
                variants={chartVariants}
                whileHover="hover"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card title="Performance" extra={<LineChartOutlined />}>
                  <ApiChart 
                    title="Tempo de Resposta"
                    data={performanceData}
                    color="#52c41a"
                    unit="ms"
                    height={280}
                    type="spline"
                    theme="modern"
                    animation="elastic"
                    gradient={true}
                    showDataZoom={true}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ServicePage;