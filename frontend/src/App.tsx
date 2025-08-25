import React, { useState } from 'react';
import { Layout, theme } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AppHeader from './components/Header';
import Dashboard from './pages/Dashboard';
import Prometheus from './pages/Prometheus';
import Grafana from './pages/Grafana';
import Nginx from './pages/Nginx';
import Postgres from './pages/Postgres';
import Docker from './pages/Docker';
import N8N from './pages/N8N';
import EvolutionAPI from './pages/EvolutionAPI';
import Chatwoot from './pages/Chatwoot';
import WhatsApp from './pages/WhatsApp';
import Redis from './pages/Redis';
import RabbitMQ from './pages/RabbitMQ';

const { Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout hasSider>
      <Sidebar />
      <Layout style={{ marginLeft: collapsed ? 80 : 200, minHeight: '100vh' }}>
        <AppHeader collapsed={collapsed} setCollapsed={setCollapsed} />
        <Content style={{ margin: '80px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: colorBgContainer, borderRadius: 8, minHeight: 360 }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/prometheuscore" element={<Prometheus />} />
              <Route path="/grafanacore" element={<Grafana />} />
              <Route path="/nginxcore" element={<Nginx />} />
              <Route path="/postgrescore" element={<Postgres />} />
              <Route path="/dockercore" element={<Docker />} />
              <Route path="/n8ncore" element={<N8N />} />
              <Route path="/evolutionapicore" element={<EvolutionAPI />} />
              <Route path="/chatwootcore" element={<Chatwoot />} />
              <Route path="/whatsappcore" element={<WhatsApp />} />
              <Route path="/rediscore" element={<Redis />} />
              <Route path="/rabbitmqcore" element={<RabbitMQ />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;