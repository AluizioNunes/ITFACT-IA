import React from 'react';
import { Layout, Button, Space, Typography } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader: React.FC = () => {
  return (
    <Header style={{ padding: 0, background: '#fff', position: 'fixed', width: '100%', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Title level={4} style={{ margin: 0, color: '#006400' }}>
            Painel de Controle - Sistema AUTOMAÇÃO
          </Title>
        </motion.div>
        <Space>
          <Button type="text" icon={<BellOutlined />} />
          <Button type="text" icon={<UserOutlined />} />
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;