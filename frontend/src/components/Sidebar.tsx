import React from 'react';
import { Layout, Menu, Button } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ApiOutlined,
  WechatOutlined,
  WhatsAppOutlined,
  ContainerOutlined,
  LogoutOutlined,
  DockerOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Sider } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'DASHBOARD', path: '/dashboard' },
    { key: 'nginx', icon: <CloudServerOutlined />, label: 'NGINX', path: '/nginxcore' },
    { key: 'grafana', icon: <LineChartOutlined />, label: 'GRAFANA', path: '/grafanacore' },
    { key: 'prometheus', icon: <BarChartOutlined />, label: 'PROMETHEUS', path: '/prometheuscore' },
    { key: 'postgres', icon: <DatabaseOutlined />, label: 'POSTGRESQL', path: '/postgrescore' },
    { key: 'docker', icon: <DockerOutlined />, label: 'DOCKER', path: '/dockercore' },
    { key: 'n8n', icon: <ApiOutlined />, label: 'N8N', path: '/n8ncore' },
    { key: 'evolutionapi', icon: <ApiOutlined />, label: 'EVOLUTION API', path: '/evolutionapicore' },
    { key: 'chatwoot', icon: <WechatOutlined />, label: 'CHATWOOT', path: '/chatwootcore' },
    { key: 'whatsapp', icon: <WhatsAppOutlined />, label: 'WHATSAPP', path: '/whatsappcore' },
    { key: 'redis', icon: <ContainerOutlined />, label: 'REDIS', path: '/rediscore' },
    { key: 'rabbitmq', icon: <AppstoreOutlined />, label: 'RABBITMQ', path: '/rabbitmqcore' },
    { key: 'swagger', icon: <ApiOutlined />, label: 'SWAGGER', path: '/api/docs' },
    { key: 'apis', icon: <ApiOutlined />, label: "API'S", path: '/apis' },
  ];

  const handleMenuClick = (key: string) => {
    const item = menuItems.find(item => item.key === key);
    if (item && item.path) {
      navigate(item.path);
    }
  };

  const handleLogout = () => {
    // Implementar lógica de logout aqui
    console.log('Logout');
  };

  // Determinar a chave selecionada com base na URL atual
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    
    // Mapear as novas rotas para as chaves do menu
    if (path === '/nginxcore') return 'nginx';
    if (path === '/grafanacore') return 'grafana';
    if (path === '/prometheuscore') return 'prometheus';
    if (path === '/postgrescore') return 'postgres';
    if (path === '/dockercore') return 'docker';
    if (path === '/n8ncore') return 'n8n';
    if (path === '/evolutionapicore') return 'evolutionapi';
    if (path === '/chatwootcore') return 'chatwoot';
    if (path === '/whatsappcore') return 'whatsapp';
    if (path === '/rediscore') return 'redis';
    if (path === '/rabbitmqcore') return 'rabbitmq';
    if (path === '/api/docs') return 'swagger';
    if (path === '/apis') return 'apis';
    
    return 'dashboard'; // Fallback para dashboard
  };

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      onBreakpoint={(broken) => {
        console.log(broken);
      }}
      onCollapse={(collapsed, type) => {
        console.log(collapsed, type);
      }}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          padding: '16px',
          color: 'white',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        CMM AM
      </motion.div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        onClick={({ key }) => handleMenuClick(key)}
        items={menuItems.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
        }))}
      />
      <div style={{ padding: '16px', position: 'absolute', bottom: 0, width: '100%' }}>
        <Button
          type="primary"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          block
          danger
        >
          Sair
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar;