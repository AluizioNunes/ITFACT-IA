import React from 'react';
import { Layout, Button, Space, Typography } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader: React.FC = () => {
  return (
    <Header style={{ padding: 0, background: 'linear-gradient(180deg, #000 0%, #0b0c0f 100%)', position: 'fixed', width: '100%', zIndex: 10, borderBottom: '1px solid #1a1c20' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: 64 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Title level={4} style={{ margin: 0, color: '#f2f2f2', letterSpacing: 0.2 }}>
            Painel de Controle — Sistema AUTOMAÇÃO
          </Title>
        </motion.div>
        <Space>
          <Button type="text" icon={<BellOutlined />} style={{ color: '#bfbfbf' }} />
          <Button type="text" icon={<UserOutlined />} style={{ color: '#bfbfbf' }} />
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;