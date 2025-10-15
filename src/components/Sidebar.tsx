import React, { useState } from 'react';
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
  AppstoreOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MonitorOutlined,
  BugOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Sidebar.css';

const { Sider } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'DASHBOARD', path: '/dashboard' },
    { key: 'observability', icon: <BarChartOutlined />, label: 'OBSERVABILIDADE', path: '/observability' },
    { key: 'reports', icon: <LineChartOutlined />, label: 'RELATÓRIOS', path: '/reports' },
    { key: 'nginx', icon: <CloudServerOutlined />, label: 'NGINX', path: '/nginxcore' },
    { key: 'apis', icon: <ApiOutlined />, label: "API'S SWAGGER", path: '/apis' },
    { key: 'prometheus', icon: <MonitorOutlined />, label: 'PROMETHEUS', path: '/prometheuscore' },
    { key: 'grafana', icon: <LineChartOutlined />, label: 'GRAFANA', path: '/grafanacore' },
    { key: 'loki', icon: <BugOutlined />, label: 'LOKI', path: '/lokicore' },
    { key: 'postgresql', icon: <DatabaseOutlined />, label: 'POSTGRESQL', path: '/postgresqlcore' },
    { key: 'docker', icon: <DockerOutlined />, label: 'DOCKER', path: '/dockercore' },
    { key: 'n8n', icon: <ApiOutlined />, label: 'N8N', path: '/n8ncore' },
    { key: 'evolutionapi', icon: <ApiOutlined />, label: 'EVOLUTION API', path: '/evolutionapicore' },
    { key: 'chatwoot', icon: <WechatOutlined />, label: 'CHATWOOT', path: '/chatwootcore' },
    { key: 'whatsapp', icon: <WhatsAppOutlined />, label: 'WHATSAPP', path: '/whatsappcore' },
    { key: 'redis', icon: <ContainerOutlined />, label: 'REDIS', path: '/rediscore' },
    { key: 'rabbitmq', icon: <AppstoreOutlined />, label: 'RABBITMQ', path: '/rabbitmqcore' },
    { key: 'integrations', icon: <ToolOutlined />, label: 'INTEGRAÇÕES', path: '/integrationscore' },
  ];

  const handleMenuClick = (key: string) => {
    const item = menuItems.find(item => item.key === key);
    if (item && item.path) {
      navigate(item.path);
    }
  };

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
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
    if (path === '/reports') return 'reports';
    if (path === '/nginxcore') return 'nginx';
    if (path === '/apis') return 'apis';
    if (path === '/prometheuscore') return 'prometheus';
    if (path === '/grafanacore') return 'grafana';
    if (path === '/lokicore') return 'loki';
    if (path === '/postgresqlcore') return 'postgresql';
    if (path === '/dockercore') return 'docker';
    if (path === '/n8ncore') return 'n8n';
    if (path === '/evolutionapicore') return 'evolutionapi';
    if (path === '/chatwootcore') return 'chatwoot';
    if (path === '/whatsappcore') return 'whatsapp';
    if (path === '/rediscore') return 'redis';
    if (path === '/rabbitmqcore') return 'rabbitmq';
    if (path === '/integrationscore') return 'integrations';
    if (path === '/observability') return 'observability';
    
    return 'dashboard'; // Fallback para dashboard
  };

  return (
    <Sider
      className="custom-sidebar"
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="lg"
      collapsedWidth="80"
      width="250"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#006400',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
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
          fontSize: collapsed ? '14px' : '18px',
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: '64px'
        }}
      >
        {!collapsed && (
          <span style={{ marginRight: '8px' }}>AUTOMAÇÃO</span>
        )}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleCollapse}
          className="toggle-button"
          style={{
            fontSize: '16px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </motion.div>
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        onClick={({ key }) => handleMenuClick(key)}
        style={{
          backgroundColor: '#006400',
          border: 'none'
        }}
        theme="dark"
        items={menuItems.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
          style: {
            backgroundColor: 'transparent',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500'
          }
        }))}
      />
      <div style={{ 
        padding: collapsed ? '8px' : '16px', 
        position: 'absolute', 
        bottom: 0, 
        width: '100%',
        backgroundColor: '#006400'
      }}>
        <Button
          type="primary"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          block
          danger
          style={{
            backgroundColor: '#8B0000',
            borderColor: '#8B0000',
            fontSize: collapsed ? '12px' : '14px'
          }}
        >
          {!collapsed && 'Sair'}
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar;