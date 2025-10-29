import React, { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Tabs, Table, Tag, Space, Button, Statistic, Progress, Input, Select, Form, Alert, Divider, message, Drawer, Descriptions, Collapse, Badge } from 'antd';
import {
  DatabaseOutlined,
  SettingOutlined,
  ApiOutlined,
  CloudServerOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  LineChartOutlined,
  BugOutlined,
  MonitorOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  ScanOutlined,
  GlobalOutlined,
  WifiOutlined
} from '@ant-design/icons';
import MultiSeriesChart from '../components/MultiSeriesChart';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const Integrations: React.FC = () => {
  const [discoveryMethod, setDiscoveryMethod] = useState('snmp');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredServers, setDiscoveredServers] = useState<any[]>([]);
  const [snmpTarget, setSnmpTarget] = useState('');
  const [snmpCommunity, setSnmpCommunity] = useState('public');
  const [snmpVersion, setSnmpVersion] = useState<'v1' | 'v2c' | 'v3'>('v2c');
  const [snmpV3User, setSnmpV3User] = useState('');
  const [snmpV3AuthProtocol, setSnmpV3AuthProtocol] = useState<'NONE' | 'MD5' | 'SHA' | 'SHA256' | 'SHA384' | 'SHA512'>('SHA');
  const [snmpV3AuthPassword, setSnmpV3AuthPassword] = useState('');
  const [snmpV3PrivProtocol, setSnmpV3PrivProtocol] = useState<'NONE' | 'DES' | 'AES128' | 'AES192' | 'AES256'>('AES128');
  const [snmpV3PrivPassword, setSnmpV3PrivPassword] = useState('');
  const [domainTarget, setDomainTarget] = useState('');
  const [ipRangeStart, setIpRangeStart] = useState('');
  const [ipRangeEnd, setIpRangeEnd] = useState('');
  const [cidrTarget, setCidrTarget] = useState('');
  // Optional credentials for enrichment
  const [sshUser, setSshUser] = useState('');
  const [sshPass, setSshPass] = useState('');
  const [sshKey, setSshKey] = useState('');
  const [sshPort, setSshPort] = useState<number>(22);
  const [sshTimeout, setSshTimeout] = useState<number>(3.0);
  const [winrmUser, setWinrmUser] = useState('');
  const [winrmPass, setWinrmPass] = useState('');
  const [winrmUseTls, setWinrmUseTls] = useState<boolean>(false);
  const [winrmPort, setWinrmPort] = useState<number>(5985);
  const [winrmTimeout, setWinrmTimeout] = useState<number>(4.0);

  // Host details drawer state
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedHost, setSelectedHost] = useState<any | null>(null);
  const [hostDetails, setHostDetails] = useState<any | null>(null);
  const [dockerDetails, setDockerDetails] = useState<any | null>(null);
  const [dbProbes, setDbProbes] = useState<any[] | null>(null);
  const [metricsSeries, setMetricsSeries] = useState<Record<string, Array<{ time: string; value: number }>>>({});
  const [metricsAvailable, setMetricsAvailable] = useState(false);
  const [nodeExporterVersion, setNodeExporterVersion] = useState<string>('1.9.1');
  const [nodeExpActionLoading, setNodeExpActionLoading] = useState<boolean>(false);
  const [metricsTimer, setMetricsTimer] = useState<any>(null);
  const [addedDevices, setAddedDevices] = useState<any[]>([]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (metricsTimer) {
        try { clearInterval(metricsTimer); } catch (e) {}
      }
    };
  }, [metricsTimer]);

  // Carrega dispositivos persistidos via PostgreSQL
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/inventory/devices');
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j.devices)) {
            setAddedDevices(j.devices);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Dados simulados para Inventário
  const inventoryData = [
    {
      key: '1',
      name: 'Servidor Web Nginx',
      type: 'Web Server',
      version: '1.24.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:30:00',
      source: 'Local'
    },
    {
      key: '2',
      name: 'Banco de Dados PostgreSQL',
      type: 'Database',
      version: '17.6',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:29:00',
      source: 'Local'
    },
    {
      key: '3',
      name: 'API Backend Node.js',
      type: 'Application',
      version: '18.19.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:28:00',
      source: 'Local'
    },
    {
      key: '4',
      name: 'Frontend React',
      type: 'Frontend',
      version: '19.1.1',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:27:00',
      source: 'Local'
    },
    {
      key: '5',
      name: 'Prometheus',
      type: 'Monitoring',
      version: '2.48.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:26:00',
      source: 'Local'
    },
    {
      key: '6',
      name: 'Grafana',
      type: 'Dashboard',
      version: '10.4.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:25:00',
      source: 'Local'
    },
    {
      key: '7',
      name: 'Loki',
      type: 'Logging',
      version: '2.9.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:24:00',
      source: 'Local'
    },
    {
      key: '8',
      name: 'Redis',
      type: 'Cache',
      version: '7.2.0',
      status: 'Ativo',
      location: 'Container Docker',
      lastCheck: '2024-01-15 14:23:00',
      source: 'Local'
    }
  ];

  // Dados simulados para Servidores Descobertos - USANDO IP REAL
  const discoveredServersData = [
    {
      key: '1',
      hostname: 'automacao.cmm.am.gov.br',
      ip: 'localhost',
      status: 'Online',
      services: ['nginx', 'docker', 'nodejs', 'postgresql'],
      os: 'Ubuntu 22.04 LTS',
      lastSeen: '2024-01-15 14:35:00',
      location: 'Servidor de Produção - CMM-AM'
    },
    {
      key: '2',
      hostname: 'srv-web-01.local',
      ip: '192.168.1.100',
      status: 'Online',
      services: ['apache2', 'nginx'],
      os: 'CentOS 8',
      lastSeen: '2024-01-15 14:34:00',
      location: 'Servidor Web Local'
    },
    {
      key: '3',
      hostname: 'srv-db-01.local',
      ip: '192.168.1.101',
      status: 'Online',
      services: ['postgresql', 'mysql', 'redis'],
      os: 'Ubuntu 20.04 LTS',
      lastSeen: '2024-01-15 14:33:00',
      location: 'Servidor de Banco de Dados'
    }
  ].map(server => ({ ...server, real: false }));

  const handleMethodChange = (newMethod: string) => {
    setDiscoveryMethod(newMethod);
    setSnmpTarget('');
    setSnmpCommunity('public');
    setSnmpVersion('v2c');
    setSnmpV3User('');
    setSnmpV3AuthProtocol('SHA');
    setSnmpV3AuthPassword('');
    setSnmpV3PrivProtocol('AES128');
    setSnmpV3PrivPassword('');
    setDomainTarget('');
    setIpRangeStart('');
    setIpRangeEnd('');
    setCidrTarget('');
    // reset creds
    setSshUser('');
    setSshPass('');
    setSshKey('');
    setSshPort(22);
    setSshTimeout(3.0);
    setWinrmUser('');
    setWinrmPass('');
    setWinrmUseTls(false);
    setWinrmPort(5985);
    setWinrmTimeout(4.0);
  };

  const isValidIP = (ip: string): boolean => {
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipPattern.test(ip);
  };

  const isValidHostname = (hostname: string): boolean => {
    const hostnamePattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const shortHostnamePattern = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]*$/;
    return hostnamePattern.test(hostname) || shortHostnamePattern.test(hostname);
  };

  const isValidDomain = (domain: string): boolean => {
    const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return domainPattern.test(domain);
  };

  const handleStartDiscovery = async () => {
    if (discoveryMethod === 'snmp' && !snmpTarget.trim()) {
      message.error('Por favor, digite o IP ou hostname para o SNMP Scan');
      return;
    }
    if (discoveryMethod === 'snmp' && snmpVersion !== 'v3' && !snmpCommunity.trim()) {
      message.error('Por favor, digite a comunidade SNMP');
      return;
    }
    if (discoveryMethod === 'snmp' && snmpVersion === 'v3' && !snmpV3User.trim()) {
      message.error('Para SNMP v3, informe o usuário');
      return;
    }

    if (discoveryMethod === 'domain' && !domainTarget.trim()) {
      message.error('Por favor, digite o domínio para descoberta');
      return;
    }

    if (discoveryMethod === 'iprange') {
      const start = ipRangeStart.trim();
      const end = ipRangeEnd.trim();
      if (!start) {
        message.error('Por favor, digite o IP inicial');
        return;
      }
      if (!isValidIP(start)) {
        message.error('IP inicial inválido');
        return;
      }
      // Se não informar IP final, assume descoberta de um único IP
      if (end && !isValidIP(end)) {
        message.error('IP final inválido');
        return;
      }
    }

    if (discoveryMethod === 'nmap' && !cidrTarget.trim()) {
      message.error('Por favor, informe a rede em CIDR (ex: 192.168.1.0/24)');
      return;
    }

    setIsDiscovering(true);

    try {
      let results: any[] = [];

      if (discoveryMethod === 'snmp') {
        try {
          const payload: any = { target: snmpTarget.trim(), version: snmpVersion };
          if (snmpVersion === 'v3') {
            payload.v3 = {
              user: snmpV3User.trim(),
              authProtocol: snmpV3AuthProtocol === 'NONE' ? undefined : snmpV3AuthProtocol,
              authPassword: snmpV3AuthPassword || undefined,
              privProtocol: snmpV3PrivProtocol === 'NONE' ? undefined : snmpV3PrivProtocol,
              privPassword: snmpV3PrivPassword || undefined
            };
          } else {
            payload.community = snmpCommunity.trim();
          }
          const snmpResponse = await fetch('/api/discovery/snmp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (snmpResponse.ok) {
            const snmpData = await snmpResponse.json();
            results = [{
              key: '1',
              hostname: snmpData.systemInfo.hostname || snmpTarget.trim(),
              ip: snmpData.target,
              status: 'Online',
              services: snmpData.services.map((s: any) => s.service),
              os: snmpData.systemInfo.description || 'Unknown',
              lastSeen: snmpData.timestamp,
              location: 'Servidor de Produção - CMM-AM (Dados SNMP)',
              real: true
            }];
          }
        } catch (error) {
          console.warn('SNMP failed, using cross-platform discovery');
        }
      } else if (discoveryMethod === 'iprange') {
        const start = ipRangeStart.trim();
        const end = ipRangeEnd.trim() || ipRangeStart.trim();
        const target = end ? `${start}-${end}` : start;

        const networkResponse = await fetch('/api/discovery/network', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target,
            method: 'nmap',
            // optional enrichment creds
            sshUser: sshUser || undefined,
            sshPass: sshPass || undefined,
            sshKey: sshKey || undefined,
            sshPort: sshPort || undefined,
            sshTimeout: sshTimeout || undefined,
            winrmUser: winrmUser || undefined,
            winrmPass: winrmPass || undefined,
            winrmUseTls: winrmUseTls || undefined,
            winrmPort: winrmPort || undefined,
            winrmTimeout: winrmTimeout || undefined
          })
        });

        if (networkResponse.ok) {
          const networkData = await networkResponse.json();
          const locationLabel = target.includes('-') ? `Range ${start}-${end}` : `IP ${start}`;
          results = networkData.discoveredDevices.map((device: any, index: number) => ({
            key: `net-${index}`,
            hostname: device.hostname,
            ip: device.ip,
            status: device.status,
            services: device.services?.map((s: any) => s.service) || [],
            os: device.os,
            lastSeen: device.timestamp,
            location: locationLabel,
            real: true
          }));
        } else {
          const errText = await networkResponse.text();
          message.error(`Falha na descoberta de rede (${networkResponse.status}): ${errText || 'erro desconhecido'}`);
        }
      } else if (discoveryMethod === 'domain') {
        const domainResponse = await fetch('/api/discovery/cross-platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targets: [domainTarget.trim()],
            checkPorts: true
          })
        });

        if (domainResponse.ok) {
          const domainData = await domainResponse.json();
          results = domainData.discoveredDevices.map((device: any, index: number) => ({
            key: `domain-${index}`,
            hostname: device.hostname,
            ip: device.ip,
            status: device.status,
            services: device.services?.map((s: any) => s.service) || [],
            os: device.os,
            lastSeen: device.timestamp,
            location: `Domínio ${domainTarget.trim()}`,
            real: true
          }));
        }
      } else if (discoveryMethod === 'nmap') {
        const cidrResponse = await fetch('/api/discovery/network', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: cidrTarget.trim(),
            method: 'tcp',
            // optional enrichment creds
            sshUser: sshUser || undefined,
            sshPass: sshPass || undefined,
            sshKey: sshKey || undefined,
            sshPort: sshPort || undefined,
            sshTimeout: sshTimeout || undefined,
            winrmUser: winrmUser || undefined,
            winrmPass: winrmPass || undefined,
            winrmUseTls: winrmUseTls || undefined,
            winrmPort: winrmPort || undefined,
            winrmTimeout: winrmTimeout || undefined
          })
        });

        if (cidrResponse.ok) {
          const cidrData = await cidrResponse.json();
          results = cidrData.discoveredDevices.map((device: any, index: number) => ({
            key: `cidr-${index}`,
            hostname: device.hostname,
            ip: device.ip,
            status: device.status,
            services: device.services?.map((s: any) => s.service) || [],
            os: device.os,
            lastSeen: device.timestamp,
            location: `Rede ${cidrTarget.trim()}`,
            real: true
          }));
        }
      } else {
        results = [];
      }

      setDiscoveredServers(results);
    } catch (error: any) {
      console.error('Erro na descoberta:', error);
      message.error(`Erro na descoberta: ${error?.message || 'falha desconhecida'}`);
      setDiscoveredServers([]);
    } finally {
      setIsDiscovering(false);
    }
  };

  const fetchHostDetails = async (record: any) => {
    setSelectedHost(record);
    setDetailsVisible(true);
    setDetailsLoading(true);
    // Clear previous metrics timer if any
    if (metricsTimer) {
      try { clearInterval(metricsTimer); } catch (e) {}
      setMetricsTimer(null);
    }
  try {
      const [hostRes, dockerRes, dbRes] = await Promise.all([
        (() => {
          const qs = new URLSearchParams({ ip: record.ip, method: 'aggressive' });
          if (sshUser) qs.append('sshUser', sshUser);
          if (sshPass) qs.append('sshPass', sshPass);
          if (sshKey) qs.append('sshKey', sshKey);
          if (sshPort) qs.append('sshPort', String(sshPort));
          if (sshTimeout) qs.append('sshTimeout', String(sshTimeout));
          if (winrmUser) qs.append('winrmUser', winrmUser);
          if (winrmPass) qs.append('winrmPass', winrmPass);
          if (typeof winrmUseTls === 'boolean') qs.append('winrmUseTls', String(winrmUseTls));
          if (winrmPort) qs.append('winrmPort', String(winrmPort));
          if (winrmTimeout) qs.append('winrmTimeout', String(winrmTimeout));
          return fetch(`/api/discovery/hostinfo?${qs.toString()}`);
        })(),
        (() => {
          const qs = new URLSearchParams({ ip: record.ip });
          if (sshUser) qs.append('sshUser', sshUser);
          if (sshPass) qs.append('sshPass', sshPass);
          if (sshKey) qs.append('sshKey', sshKey);
          if (sshPort) qs.append('sshPort', String(sshPort));
          if (sshTimeout) qs.append('sshTimeout', String(sshTimeout));
          return fetch(`/api/discovery/docker?${qs.toString()}`);
        })(),
        fetch(`/api/discovery/dbprobe?ip=${encodeURIComponent(record.ip)}`)
      ]);
      const hostJson = hostRes.ok ? await hostRes.json() : null;
      const dockerJson = dockerRes.ok ? await dockerRes.json() : null;
      const dbJson = dbRes.ok ? await dbRes.json() : null;
      setHostDetails(hostJson);
      setDockerDetails(dockerJson);
      setDbProbes(dbJson?.databases || null);

      // Start metrics polling if Node Exporter reachable
      const pollMetrics = async () => {
        try {
          const r = await fetch(`/api/discovery/metrics?ip=${encodeURIComponent(record.ip)}&points=50`);
          if (r.ok) {
            const j = await r.json();
            setMetricsAvailable(!!j.present);
            if (j.series) {
              setMetricsSeries(j.series);
            }
          }
        } catch (e) {
          // ignore polling errors
        }
      };
      await pollMetrics();
      const t = setInterval(pollMetrics, 2000);
      setMetricsTimer(t);
    } catch (err) {
      console.error('Erro ao buscar detalhes do host:', err);
      setHostDetails(null);
      setDockerDetails(null);
      setDbProbes(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchDockerViaSSH = async () => {
    if (!selectedHost || !selectedHost.ip) {
      message.error('Host não selecionado. Abra os detalhes do host primeiro.');
      return;
    }
    try {
      const qs = new URLSearchParams({ ip: selectedHost.ip });
      if (sshUser) qs.append('sshUser', sshUser);
      if (sshPass) qs.append('sshPass', sshPass);
      if (sshKey) qs.append('sshKey', sshKey);
      if (sshPort) qs.append('sshPort', String(sshPort));
      if (sshTimeout) qs.append('sshTimeout', String(sshTimeout));
      const r = await fetch(`/api/discovery/docker?${qs.toString()}`);
      if (!r.ok) {
        throw new Error(`HTTP ${r.status}`);
      }
      const j = await r.json();
      setDockerDetails(j);
      if (j?.present) {
        message.success('Containers coletados via SSH com sucesso.');
      } else {
        message.warning('Não foi possível confirmar Docker via SSH. Verifique credenciais.');
      }
    } catch (e: any) {
      console.error('Falha ao coletar Docker via SSH:', e);
      message.error(`Falha ao coletar Docker via SSH: ${e?.message || 'erro desconhecido'}`);
    }
  };

  const persistDevice = async (record: any) => {
    try {
      const payload = {
        ip: record.ip,
        hostname: record.hostname,
        os: record.os,
        status: record.status,
        services: Array.isArray(record.services)
          ? record.services.map((s: any) => (typeof s === 'string' ? s : (s.service || s)))
          : [],
        virtualization: record.virtualization,
        node_exporter: record.node_exporter,
        lastSeen: record.timestamp || record.lastSeen,
        real: true
      };
      const r = await fetch('/api/inventory/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      return j.device;
    } catch (e: any) {
      message.error(`Falha ao salvar dispositivo: ${e?.message || 'erro desconhecido'}`);
      throw e;
    }
  };

  const testPing = async (record: any) => {
    try {
      const r = await fetch(`/api/test/ping?ip=${encodeURIComponent(record.ip)}`);
      const j = await r.json();
      if (j.reachable) {
        message.success(`Ping OK (${j.latency_ms ?? '-'} ms)`);
      } else {
        message.error(`Ping falhou: ${j.error || 'sem resposta'}`);
      }
    } catch (e: any) {
      message.error(`Erro no ping: ${e?.message || 'falha desconhecida'}`);
    }
  };

  const testSSH = async (record: any) => {
    try {
      const qs = new URLSearchParams({ ip: record.ip });
      if (sshUser) qs.append('user', sshUser);
      if (sshPass) qs.append('password', sshPass);
      if (sshKey) qs.append('keyPath', sshKey);
      if (sshPort) qs.append('port', String(sshPort));
      if (sshTimeout) qs.append('timeout', String(sshTimeout));
      const r = await fetch(`/api/test/ssh?${qs.toString()}`);
      const j = await r.json();
      if (j.reachable) {
        message.success('SSH OK');
      } else {
        message.error(`SSH falhou: ${j.error || 'sem resposta'}`);
      }
    } catch (e: any) {
      message.error(`Erro no teste SSH: ${e?.message || 'falha desconhecida'}`);
    }
  };

  const testSNMP = async (record: any) => {
    try {
      const qs = new URLSearchParams({ ip: record.ip, community: snmpCommunity || 'public', version: snmpVersion || 'v2c' });
      const r = await fetch(`/api/test/snmp?${qs.toString()}`);
      const j = await r.json();
      if (j.reachable) {
        message.success('SNMP OK');
      } else {
        message.error('SNMP indisponível');
      }
    } catch (e: any) {
      message.error(`Erro no teste SNMP: ${e?.message || 'falha desconhecida'}`);
    }
  };

  const installNodeExporterViaSSH = async () => {
    try {
      if (!selectedHost?.ip) {
        message.error('Selecione um host nos resultados primeiro');
        return;
      }
      if (!sshUser || (!sshPass && !sshKey)) {
        message.error('Informe usuário e senha ou chave SSH');
        return;
      }
      setDetailsLoading(true);
      const payload = {
        ip: selectedHost.ip,
        user: sshUser,
        password: sshPass || undefined,
        keyPath: sshKey || undefined,
        port: sshPort,
        timeout: sshTimeout,
        version: nodeExporterVersion,
        force: false,
      };
      const r = await fetch('/api/actions/node-exporter/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j.ok) {
        const status = j.status;
        if (status === 'already_running') {
          message.success('Node Exporter já estava ativo');
        } else if (status === 'installed') {
          message.success('Node Exporter instalado e iniciado com sucesso');
        } else {
          message.warning('Instalação executada, mas porta 9100 não detectada');
        }
        await fetchHostDetails(selectedHost);
      } else {
        message.error(`Falha na instalação: ${j.error || 'erro desconhecido'}`);
      }
    } catch (e: any) {
      message.error(`Erro ao instalar Node Exporter: ${e.message}`);
    } finally {
      setDetailsLoading(false);
    }
  };

  const reinstallOrUpdateNodeExporterViaSSH = async () => {
    try {
      if (!selectedHost?.ip) {
        message.error('Selecione um host nos resultados primeiro');
        return;
      }
      if (!sshUser || (!sshPass && !sshKey)) {
        message.error('Informe usuário e senha ou chave SSH');
        return;
      }
      setNodeExpActionLoading(true);
      setDetailsLoading(true);
      const payload = {
        ip: selectedHost.ip,
        user: sshUser,
        password: sshPass || undefined,
        keyPath: sshKey || undefined,
        port: sshPort,
        timeout: sshTimeout,
        version: nodeExporterVersion,
        force: true,
      };
      const r = await fetch('/api/actions/node-exporter/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j.ok) {
        const status = j.status;
        if (status === 'installed') {
          message.success(`Node Exporter atualizado/reinstalado para v${nodeExporterVersion}`);
        } else {
          message.warning('Atualização/reinstalação executada, verifique a porta 9100.');
        }
        await fetchHostDetails(selectedHost);
      } else {
        message.error(`Falha em atualizar/reinstalar: ${j.error || 'erro desconhecido'}`);
      }
    } catch (e: any) {
      message.error(`Erro ao atualizar/reinstalar Node Exporter: ${e.message}`);
    } finally {
      setNodeExpActionLoading(false);
      setDetailsLoading(false);
    }
  };

  const stopNodeExporterViaSSH = async () => {
    try {
      if (!selectedHost?.ip) {
        message.error('Selecione um host nos resultados primeiro');
        return;
      }
      if (!sshUser || (!sshPass && !sshKey)) {
        message.error('Informe usuário e senha ou chave SSH');
        return;
      }
      setNodeExpActionLoading(true);
      const payload = {
        ip: selectedHost.ip,
        user: sshUser,
        password: sshPass || undefined,
        keyPath: sshKey || undefined,
        port: sshPort,
        timeout: sshTimeout,
      };
      const r = await fetch('/api/actions/node-exporter/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j.ok) {
        message.success('Serviço Node Exporter parado');
        await fetchHostDetails(selectedHost);
      } else {
        message.error(`Falha ao parar serviço: ${j.error || j.status || 'erro desconhecido'}`);
      }
    } catch (e: any) {
      message.error(`Erro ao parar Node Exporter: ${e.message}`);
    } finally {
      setNodeExpActionLoading(false);
    }
  };

  const uninstallNodeExporterViaSSH = async () => {
    try {
      if (!selectedHost?.ip) {
        message.error('Selecione um host nos resultados primeiro');
        return;
      }
      if (!sshUser || (!sshPass && !sshKey)) {
        message.error('Informe usuário e senha ou chave SSH');
        return;
      }
      setNodeExpActionLoading(true);
      setDetailsLoading(true);
      const payload = {
        ip: selectedHost.ip,
        user: sshUser,
        password: sshPass || undefined,
        keyPath: sshKey || undefined,
        port: sshPort,
        timeout: sshTimeout,
      };
      const r = await fetch('/api/actions/node-exporter/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j.ok) {
        message.success('Node Exporter desinstalado e serviço removido');
        await fetchHostDetails(selectedHost);
      } else {
        message.error(`Falha ao desinstalar: ${j.error || 'erro desconhecido'}`);
      }
    } catch (e: any) {
      message.error(`Erro ao desinstalar Node Exporter: ${e.message}`);
    } finally {
      setNodeExpActionLoading(false);
      setDetailsLoading(false);
    }
  };

  const addDevice = async (record: any) => {
    try {
      const saved = await persistDevice(record);
      setAddedDevices(prev => {
        const exists = prev.some(d => d.ip === saved.ip);
        return exists ? prev.map(d => (d.ip === saved.ip ? { ...d, ...saved } : d)) : [...prev, saved];
      });
      message.success(`Dispositivo ${saved.hostname || saved.ip} adicionado e persistido`);
    } catch (e) {
      // erros já tratados em persistDevice
    }
  };

  const removeAddedDevice = async (device: any) => {
    try {
      // Encontrar o dispositivo pelo IP para obter o ID
      const deviceToRemove = addedDevices.find(d => d.ip === device.ip);
      if (deviceToRemove && deviceToRemove.id) {
        const r = await fetch(`/api/inventory/devices/${deviceToRemove.id}`, {
          method: 'DELETE'
        });
        if (r.ok) {
          setAddedDevices(prev => prev.filter(d => d.ip !== device.ip));
          message.success(`Dispositivo ${device.hostname || device.ip} removido com sucesso`);
        } else {
          throw new Error(`HTTP ${r.status}`);
        }
      } else {
        // Se não tiver ID, remove apenas da lista local
        setAddedDevices(prev => prev.filter(d => d.ip !== device.ip));
        message.success(`Dispositivo removido da lista local`);
      }
    } catch (e: any) {
      message.error(`Erro ao remover dispositivo: ${e?.message || 'erro desconhecido'}`);
      // Remove da lista local mesmo se a API falhar
      setAddedDevices(prev => prev.filter(d => d.ip !== device.ip));
    }
  };

  const handleReset = () => {
    setIpRangeStart('');
    setIpRangeEnd('');
    setCidrTarget('');
    setDomainTarget('');
    setSnmpTarget('');
    setSnmpCommunity('public');
    setSnmpV3User('');
    setSnmpV3AuthProtocol('NONE');
    setSnmpV3AuthPassword('');
    setSnmpV3PrivProtocol('NONE');
    setSnmpV3PrivPassword('');
  };

  const discoveredColumns = [
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
      ellipsis: true,
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip: string) => <Tag color="blue">{ip}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Online' ? 'green' : 'red'}>
          {status === 'Online' ? <CheckCircleOutlined /> : <StopOutlined />}
          {status}
        </Tag>
      )
    },
    {
      title: 'Serviços',
      dataIndex: 'services',
      key: 'services',
      render: (services: string[]) => (
        <Space wrap>
          {services.map((service, index) => (
            <Tag key={index} color="orange">{service}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Sistema Operacional',
      dataIndex: 'os',
      key: 'os',
      ellipsis: true
    },
    {
      title: 'Última Verificação',
      dataIndex: 'lastSeen',
      key: 'lastSeen'
    },
    {
      title: 'Tipo',
      dataIndex: 'location',
      key: 'type',
      render: (location: string, record: any) => {
        const isReal = record.real || location.includes('Dados SNMP') || location.includes('Rede Local');
        return (
          <Tag color={isReal ? 'green' : 'orange'}>
            {isReal ? 'Dados Reais' : 'Dados Fictícios'}
          </Tag>
        );
      }
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right' as any,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => testPing(record)}>Ping</Button>
          <Button size="small" onClick={() => testSSH(record)}>SSH</Button>
          <Button size="small" onClick={() => testSNMP(record)}>SNMP</Button>
          <Button size="small" type="primary" onClick={() => addDevice(record)}>Adicionar</Button>
          <Button size="small" onClick={() => fetchHostDetails(record)}>Detalhes</Button>
        </Space>
      )
    }
  ];

  const inventoryColumns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors = {
          'Web Server': 'blue',
          'Database': 'green',
          'Application': 'orange',
          'Frontend': 'purple',
          'Monitoring': 'cyan',
          'Dashboard': 'magenta',
          'Logging': 'volcano',
          'Cache': 'geekblue'
        };
        return <Tag color={colors[type as keyof typeof colors] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: 'Versão',
      dataIndex: 'version',
      key: 'version'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Ativo' ? 'green' : 'red'}>
          {status === 'Ativo' ? <CheckCircleOutlined /> : <StopOutlined />}
          {status}
        </Tag>
      )
    },
    {
      title: 'Localização',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: 'Última Verificação',
      dataIndex: 'lastCheck',
      key: 'lastCheck'
    },
    {
      title: 'Origem',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color={source === 'Local' ? 'green' : 'blue'}>
          {source === 'Local' ? <ContainerOutlined /> : <GlobalOutlined />}
          {source}
        </Tag>
      )
    }
  ];

  const servicesColumns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Operacional' ? 'green' : 'red'}>
          {status === 'Operacional' ? <CheckCircleOutlined /> : <WarningOutlined />}
          {status}
        </Tag>
      )
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (uptime: string) => <span style={{ color: uptime.startsWith('99') ? 'green' : 'orange' }}>{uptime}</span>
    },
    {
      title: 'Tempo de Resposta',
      dataIndex: 'responseTime',
      key: 'responseTime'
    },
    {
      title: 'Requisições',
      dataIndex: 'requests',
      key: 'requests'
    },
    {
      title: 'Saúde',
      dataIndex: 'health',
      key: 'health',
      render: (health: number) => (
        <Progress
          percent={health}
          size="small"
          status={health >= 95 ? 'success' : health >= 85 ? 'normal' : 'exception'}
          strokeColor={health >= 95 ? '#52c41a' : health >= 85 ? '#faad14' : '#ff4d4f'}
        />
      )
    },
    {
      title: 'Origem',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color={source === 'Local' ? 'green' : 'blue'}>
          {source === 'Local' ? <ContainerOutlined /> : <GlobalOutlined />}
          {source}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#006400', marginBottom: '8px' }}>
          <ToolOutlined style={{ marginRight: '12px' }} />
          Integrações
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          Gerencie inventário de sistemas e monitore serviços integrados
        </Paragraph>
        

      </div>

      {/* Seção de Inventário - Dispositivos Salvos */}
      {addedDevices.length > 0 && (
        <Card 
          style={{ marginBottom: '24px' }}
          title={
            <Space>
              <DatabaseOutlined style={{ color: '#006400' }} />
              <span style={{ color: '#006400' }}>Inventário de Dispositivos</span>
            </Space>
          }
          extra={<Tag color="green">{addedDevices.length} dispositivos salvos</Tag>}
        >
          <Table
            size="small"
            rowKey="ip"
            dataSource={addedDevices}
            pagination={{ pageSize: 5, showSizeChanger: false }}
            columns={[
              { 
                title: 'Hostname', 
                dataIndex: 'hostname', 
                key: 'hostname', 
                ellipsis: true,
                render: (text: string) => <strong style={{ color: '#006400' }}>{text}</strong>
              },
              { 
                title: 'IP Address', 
                dataIndex: 'ip', 
                key: 'ip', 
                render: (ip: string) => <Tag color="blue">{ip}</Tag> 
              },
              { 
                title: 'Status', 
                dataIndex: 'status', 
                key: 'status', 
                render: (s: string) => (
                  <Tag color={s === 'Online' ? 'green' : 'red'}>{s}</Tag>
                )
              },
              { 
                title: 'Sistema Operacional', 
                dataIndex: 'os', 
                key: 'os', 
                ellipsis: true 
              },
              { 
                title: 'Serviços', 
                dataIndex: 'services', 
                key: 'services',
                render: (services: string[]) => (
                  <div>
                    {services?.slice(0, 3).map((service, idx) => (
                      <Tag key={idx} size="small" color="geekblue">{service}</Tag>
                    ))}
                    {services?.length > 3 && <Tag size="small">+{services.length - 3}</Tag>}
                  </div>
                )
              },
              { 
                title: 'Última Verificação', 
                dataIndex: 'last_seen', 
                key: 'last_seen',
                render: (date: string) => date ? new Date(date).toLocaleString('pt-BR') : '-'
              },
              { 
                title: 'Ações', 
                key: 'actions', 
                render: (_: any, record: any) => (
                  <Space>
                    <Button 
                      size="small" 
                      type="primary" 
                      onClick={() => {
                        setSelectedHost(record);
                        showDetails(record);
                      }}
                    >
                      Detalhes
                    </Button>
                    <Button 
                      danger 
                      size="small" 
                      onClick={() => removeAddedDevice(record)}
                    >
                      Remover
                    </Button>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      )}

      <Card>
        <Tabs defaultActiveKey="discovery" type="card" size="large">
          <TabPane
            tab={
              <span>
                <SearchOutlined />
                PESQUISA DE DISPOSITIVOS
              </span>
            }
            key="discovery"
          >
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} lg={8}>
                <Card
                  title={
                    <Space>
                      <WifiOutlined />
                      Configuração de Descoberta
                    </Space>
                  }
                >
                  <Form layout="inline" style={{ rowGap: 8 }}>
                    <Form.Item label="Método">
                      <Select
                        value={discoveryMethod}
                        onChange={handleMethodChange}
                        style={{ width: 180 }}
                      >
                        <Option value="snmp">SNMP Scan</Option>
                        <Option value="domain">Domain Discovery</Option>
                        <Option value="iprange">IP Range Scan</Option>
                        <Option value="nmap">CIDR Scan (TCP)</Option>
                      </Select>
                    </Form.Item>

                    {discoveryMethod === 'iprange' && (
                      <>
                        <Form.Item label="IP Inicial" rules={[{ required: true, message: 'IP inicial é obrigatório' }]}> 
                          <Input
                            placeholder="192.168.1.1"
                            value={ipRangeStart}
                            onChange={(e) => setIpRangeStart(e.target.value)}
                            style={{ width: 160 }}
                          />
                        </Form.Item>
                        <Form.Item label="IP Final" rules={[{ required: true, message: 'IP final é obrigatório' }]}> 
                          <Input
                            placeholder="192.168.1.254"
                            value={ipRangeEnd}
                            onChange={(e) => setIpRangeEnd(e.target.value)}
                            style={{ width: 160 }}
                          />
                        </Form.Item>
                      </>
                    )}

                    {discoveryMethod === 'nmap' && (
                      <Form.Item label="CIDR" rules={[{ required: true, message: 'CIDR é obrigatório' }]}> 
                        <Input
                          placeholder="192.168.1.0/24"
                          value={cidrTarget}
                          onChange={(e) => setCidrTarget(e.target.value)}
                          style={{ width: 180 }}
                        />
                      </Form.Item>
                    )}

                    {discoveryMethod === 'snmp' && (
                      <>
                        <Form.Item label="Versão">
                          <Select value={snmpVersion} onChange={(v) => setSnmpVersion(v as any)} style={{ width: 100 }}>
                            <Option value="v1">v1</Option>
                            <Option value="v2c">v2c</Option>
                            <Option value="v3">v3</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item
                          label="Alvo"
                          rules={[
                            { required: true, message: 'IP ou hostname é obrigatório' },
                            {
                              validator: (_, value) => {
                                if (!value) return Promise.reject();
                                if (isValidIP(value) || isValidHostname(value)) return Promise.resolve();
                                return Promise.reject(new Error('Digite IP válido (ex: 192.168.1.1) ou hostname'));
                              }
                            }
                          ]}
                        >
                          <Input
                            placeholder="192.168.1.32 ou host.local"
                            value={snmpTarget}
                            onChange={(e) => setSnmpTarget(e.target.value)}
                            style={{ width: 260 }}
                          />
                        </Form.Item>
                        {snmpVersion !== 'v3' && (
                          <Form.Item label="Comunidade" rules={[{ required: true, message: 'Comunidade SNMP é obrigatória' }]}> 
                            <Input
                              placeholder="public"
                              value={snmpCommunity}
                              onChange={(e) => setSnmpCommunity(e.target.value)}
                              style={{ width: 140 }}
                            />
                          </Form.Item>
                        )}
                        {snmpVersion === 'v3' && (
                          <>
                            <Form.Item label="Usuário v3" rules={[{ required: true, message: 'Usuário v3 é obrigatório' }]}> 
                              <Input placeholder="usuario" value={snmpV3User} onChange={(e) => setSnmpV3User(e.target.value)} style={{ width: 140 }} />
                            </Form.Item>
                            <Form.Item label="Auth">
                              <Select value={snmpV3AuthProtocol} onChange={(v) => setSnmpV3AuthProtocol(v as any)} style={{ width: 120 }}>
                                <Option value="NONE">NONE</Option>
                                <Option value="MD5">MD5</Option>
                                <Option value="SHA">SHA</Option>
                                <Option value="SHA256">SHA256</Option>
                                <Option value="SHA384">SHA384</Option>
                                <Option value="SHA512">SHA512</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item label="Auth Pass">
                              <Input.Password placeholder="auth pass" value={snmpV3AuthPassword} onChange={(e) => setSnmpV3AuthPassword(e.target.value)} style={{ width: 140 }} />
                            </Form.Item>
                            <Form.Item label="Priv">
                              <Select value={snmpV3PrivProtocol} onChange={(v) => setSnmpV3PrivProtocol(v as any)} style={{ width: 120 }}>
                                <Option value="NONE">NONE</Option>
                                <Option value="DES">DES</Option>
                                <Option value="AES128">AES128</Option>
                                <Option value="AES192">AES192</Option>
                                <Option value="AES256">AES256</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item label="Priv Pass">
                              <Input.Password placeholder="priv pass" value={snmpV3PrivPassword} onChange={(e) => setSnmpV3PrivPassword(e.target.value)} style={{ width: 140 }} />
                            </Form.Item>
                          </>
                        )}
                      </>
                    )}

                    {discoveryMethod === 'domain' && (
                      <Form.Item
                        label="Domínio"
                        rules={[
                          { required: true, message: 'Domínio é obrigatório' },
                          {
                            validator: (_, value) => {
                              if (!value) return Promise.reject();
                              if (isValidDomain(value)) return Promise.resolve();
                              return Promise.reject(new Error('Digite um domínio válido (ex: cmm.am.gov.br)'));
                            }
                          }
                        ]}
                      >
                        <Input
                          placeholder="cmm.am.gov.br"
                          value={domainTarget}
                          onChange={(e) => setDomainTarget(e.target.value)}
                          style={{ width: 220 }}
                        />
                      </Form.Item>
                    )}

                    <Form.Item>
                      <Button
                        type="primary"
                        icon={<ScanOutlined />}
                        loading={isDiscovering}
                        onClick={handleStartDiscovery}
                      >
                        {isDiscovering ? 'Executando...' : 'Iniciar'}
                      </Button>
                    </Form.Item>
                    <Form.Item>
                      <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={isDiscovering}>
                        Limpar
                      </Button>
                    </Form.Item>
                  </Form>

                  <Collapse style={{ marginTop: 12 }}>
                    <Collapse.Panel header="Credenciais (Opcional)" key="creds">
                      <Divider orientation="left">Linux SSH</Divider>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Form.Item label="Usuário SSH">
                            <Input placeholder="root" value={sshUser} onChange={(e) => setSshUser(e.target.value)} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Senha SSH">
                            <Input.Password placeholder="••••••" value={sshPass} onChange={(e) => setSshPass(e.target.value)} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Form.Item label="Chave Privada (caminho)">
                            <Input placeholder="/home/user/.ssh/id_rsa" value={sshKey} onChange={(e) => setSshKey(e.target.value)} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="Porta SSH">
                            <Input type="number" value={sshPort} onChange={(e) => setSshPort(Number(e.target.value || 22))} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="Timeout SSH (s)">
                            <Input type="number" value={sshTimeout} onChange={(e) => setSshTimeout(Number(e.target.value || 3.0))} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider orientation="left">Windows WinRM</Divider>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Form.Item label="Usuário WinRM">
                            <Input placeholder="Administrator" value={winrmUser} onChange={(e) => setWinrmUser(e.target.value)} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Senha WinRM">
                            <Input.Password placeholder="••••••" value={winrmPass} onChange={(e) => setWinrmPass(e.target.value)} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={8}>
                        <Col span={6}>
                          <Form.Item label="TLS (HTTPS)">
                            <Space>
                              <Badge status={winrmUseTls ? 'success' : 'default'} text={winrmUseTls ? 'ON' : 'OFF'} />
                              <Button size="small" onClick={() => setWinrmUseTls(!winrmUseTls)}>{winrmUseTls ? 'Desativar' : 'Ativar'}</Button>
                            </Space>
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="Porta WinRM">
                            <Input type="number" value={winrmPort} onChange={(e) => setWinrmPort(Number(e.target.value || (winrmUseTls ? 5986 : 5985)))} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="Timeout WinRM (s)">
                            <Input type="number" value={winrmTimeout} onChange={(e) => setWinrmTimeout(Number(e.target.value || 4.0))} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Collapse.Panel>
                  </Collapse>
                </Card>
              </Col>

              <Col xs={24} lg={16}>
                <Card
                  title={
                    <Space>
                      <GlobalOutlined />
                      Servidores Descobertos
                    </Space>
                  }
                  extra={
                    <Space>
                      <Tag color="green">Online: {discoveredServers.filter(s => s.status === 'Online').length}</Tag>
                      <Tag color="red">Offline: {discoveredServers.filter(s => s.status === 'Offline').length}</Tag>
                    </Space>
                  }
                >
                  {isDiscovering ? (
                    <Alert
                      message="Executando Descoberta de Rede"
                      description="Procurando servidores e serviços na rede... Isso pode levar alguns minutos."
                      type="info"
                      showIcon
                    />
                  ) : discoveredServers.length > 0 ? (
                    <Table
                      columns={discoveredColumns}
                      dataSource={discoveredServers}
                      pagination={{ pageSize: 8 }}
                      scroll={{ x: 1100 }}
                      expandable={{
                        expandedRowRender: (record) => (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Badge status={record.status === 'Online' ? 'success' : 'error'} text={record.status} />
                            <Space wrap>
                              {(record.services || []).map((s: string, i: number) => (
                                <Tag key={i} color="geekblue">{s}</Tag>
                              ))}
                            </Space>
                            <Button size="small" type="link" onClick={() => fetchHostDetails(record)}>Ver detalhes completos</Button>
                          </Space>
                        )
                      }}
                    />
                  ) : (
                    <Alert
                      message="Nenhum Servidor Descoberto"
                      description="Execute uma descoberta para encontrar servidores na rede."
                      type="warning"
                      showIcon
                    />
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              <Col span={24}>
                <Card
                  title={
                    <Space>
                      <PlusOutlined />
                      Lista de Dispositivos Selecionados
                    </Space>
                  }
                  extra={<Tag color="blue">{addedDevices.length} itens</Tag>}
                >
                  {addedDevices.length > 0 ? (
                    <Table
                      size="small"
                      rowKey="ip"
                      dataSource={addedDevices}
                      pagination={{ pageSize: 6 }}
                      columns={[
                        { title: 'Hostname', dataIndex: 'hostname', key: 'hostname', ellipsis: true },
                        { title: 'IP', dataIndex: 'ip', key: 'ip', render: (ip: string) => <Tag color="blue">{ip}</Tag> },
                        { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => (
                          <Tag color={s === 'Online' ? 'green' : 'red'}>{s}</Tag>
                        )},
                        { title: 'Sistema', dataIndex: 'os', key: 'os', ellipsis: true },
                        { title: 'Ações', key: 'actions', render: (_: any, r: any) => (
                          <Button danger size="small" onClick={() => removeAddedDevice(r)}>Remover</Button>
                        )}
                      ]}
                    />
                  ) : (
                    <Alert message="Nenhum dispositivo adicionado" type="info" showIcon />
                  )}
                </Card>
              </Col>
            </Row>


          </TabPane>

          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                INVENTÁRIO
              </span>
            }
            key="inventory"
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="Dispositivos no Inventário" size="small">
                  {addedDevices.length > 0 ? (
                    <Table
                      size="small"
                      rowKey="ip"
                      dataSource={addedDevices}
                      pagination={{ pageSize: 10 }}
                      expandable={{
                        expandedRowRender: (record) => (
                          <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Hostname">{record.hostname}</Descriptions.Item>
                            <Descriptions.Item label="IP">{record.ip}</Descriptions.Item>
                            <Descriptions.Item label="Status">{record.status}</Descriptions.Item>
                            <Descriptions.Item label="Sistema Operacional">{record.os}</Descriptions.Item>
                            <Descriptions.Item label="Tipo">{record.type || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Localização">{record.location || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Última Verificação">{record.lastCheck || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Observações">{record.notes || 'Nenhuma observação'}</Descriptions.Item>
                          </Descriptions>
                        ),
                        rowExpandable: () => true,
                      }}
                      columns={[
                        { 
                          title: 'Hostname', 
                          dataIndex: 'hostname', 
                          key: 'hostname', 
                          ellipsis: true,
                          sorter: (a, b) => (a.hostname || '').localeCompare(b.hostname || '')
                        },
                        { 
                          title: 'IP', 
                          dataIndex: 'ip', 
                          key: 'ip', 
                          render: (ip: string) => <Tag color="blue">{ip}</Tag>,
                          sorter: (a, b) => a.ip.localeCompare(b.ip)
                        },
                        { 
                          title: 'Status', 
                          dataIndex: 'status', 
                          key: 'status', 
                          render: (s: string) => (
                            <Tag color={s === 'Online' ? 'green' : 'red'}>{s}</Tag>
                          ),
                          filters: [
                            { text: 'Online', value: 'Online' },
                            { text: 'Offline', value: 'Offline' }
                          ],
                          onFilter: (value, record) => record.status === value
                        },
                        { 
                          title: 'Sistema', 
                          dataIndex: 'os', 
                          key: 'os', 
                          ellipsis: true,
                          sorter: (a, b) => (a.os || '').localeCompare(b.os || '')
                        },
                        { 
                          title: 'Ações', 
                          key: 'actions', 
                          render: (_: any, record: any) => (
                            <Space>
                              <Button 
                                size="small" 
                                onClick={() => {
                                  setSelectedHost(record);
                                  setDetailsVisible(true);
                                }}
                              >
                                Detalhes
                              </Button>
                              <Button 
                                danger 
                                size="small" 
                                onClick={() => removeAddedDevice(record)}
                              >
                                Remover
                              </Button>
                            </Space>
                          )
                        }
                      ]}
                    />
                  ) : (
                    <Alert 
                      message="Nenhum dispositivo no inventário" 
                      description="Adicione dispositivos através da aba 'PESQUISA DE DISPOSITIVOS'" 
                      type="info" 
                      showIcon 
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane
            tab={
              <span>
                <SettingOutlined />
                SERVIÇOS
              </span>
            }
            key="services"
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="Serviços Detectados" size="small">
                  {addedDevices.length > 0 ? (
                    <Collapse accordion>
                      {addedDevices.map((device) => (
                        <Collapse.Panel
                          header={
                            <Space>
                              <Tag color="blue">{device.hostname || device.ip}</Tag>
                              <Badge count={device.services?.length || 0} showZero color="green" />
                            </Space>
                          }
                          key={device.ip}
                        >
                          {device.services && device.services.length > 0 ? (
                            <Table
                              size="small"
                              dataSource={device.services}
                              pagination={false}
                              columns={[
                                { 
                                  title: 'Porta', 
                                  dataIndex: 'port', 
                                  key: 'port',
                                  width: 80,
                                  render: (port: number) => <Tag color="blue">{port}</Tag>
                                },
                                { 
                                  title: 'Protocolo', 
                                  dataIndex: 'protocol', 
                                  key: 'protocol',
                                  width: 100,
                                  render: (protocol: string) => <Tag color="green">{protocol}</Tag>
                                },
                                { 
                                  title: 'Serviço', 
                                  dataIndex: 'service', 
                                  key: 'service',
                                  width: 120
                                },
                                { 
                                  title: 'Estado', 
                                  dataIndex: 'state', 
                                  key: 'state',
                                  width: 100,
                                  render: (state: string) => (
                                    <Tag color={state === 'open' ? 'green' : 'red'}>{state}</Tag>
                                  )
                                },
                                { 
                                  title: 'Descrição/Função', 
                                  dataIndex: 'description', 
                                  key: 'description',
                                  render: (desc: string, record: any) => {
                                    const serviceDescriptions: { [key: string]: string } = {
                                      'ssh': 'Secure Shell - Acesso remoto seguro ao sistema',
                                      'http': 'Servidor Web HTTP - Hospedagem de sites e aplicações web',
                                      'https': 'Servidor Web HTTPS - Hospedagem segura de sites e aplicações web',
                                      'ftp': 'File Transfer Protocol - Transferência de arquivos',
                                      'smtp': 'Simple Mail Transfer Protocol - Envio de emails',
                                      'pop3': 'Post Office Protocol - Recebimento de emails',
                                      'imap': 'Internet Message Access Protocol - Acesso a emails',
                                      'dns': 'Domain Name System - Resolução de nomes de domínio',
                                      'dhcp': 'Dynamic Host Configuration Protocol - Atribuição automática de IPs',
                                      'snmp': 'Simple Network Management Protocol - Monitoramento de rede',
                                      'telnet': 'Telnet - Acesso remoto não seguro (legado)',
                                      'mysql': 'Banco de dados MySQL',
                                      'postgresql': 'Banco de dados PostgreSQL',
                                      'redis': 'Banco de dados Redis - Cache em memória',
                                      'mongodb': 'Banco de dados MongoDB - NoSQL',
                                      'docker': 'Docker Engine - Containerização',
                                      'kubernetes': 'Kubernetes API - Orquestração de containers',
                                      'nginx': 'Servidor Web Nginx - Proxy reverso e balanceador de carga',
                                      'apache': 'Servidor Web Apache',
                                      'rdp': 'Remote Desktop Protocol - Acesso remoto Windows'
                                    };
                                    
                                    const serviceName = record.service?.toLowerCase() || '';
                                    const defaultDesc = serviceDescriptions[serviceName] || desc || 'Serviço não identificado';
                                    
                                    return (
                                      <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                                        {defaultDesc}
                                      </Paragraph>
                                    );
                                  }
                                }
                              ]}
                            />
                          ) : (
                            <Alert 
                              message="Nenhum serviço detectado" 
                              description="Execute um scan de portas para detectar serviços" 
                              type="warning" 
                              showIcon 
                            />
                          )}
                        </Collapse.Panel>
                      ))}
                    </Collapse>
                  ) : (
                    <Alert 
                      message="Nenhum dispositivo disponível" 
                      description="Adicione dispositivos através da aba 'PESQUISA DE DISPOSITIVOS' para visualizar seus serviços" 
                      type="info" 
                      showIcon 
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      <Drawer
        title={selectedHost ? `Detalhes: ${selectedHost.hostname || selectedHost.ip}` : 'Detalhes do Host'}
        open={detailsVisible}
        width={720}
        onClose={() => { 
          setDetailsVisible(false); 
          setSelectedHost(null); 
          setHostDetails(null); 
          setDockerDetails(null); 
          setDbProbes(null);
          setMetricsAvailable(false);
          setMetricsSeries({});
          if (metricsTimer) { try { clearInterval(metricsTimer); } catch (e) {} }
          setMetricsTimer(null);
        }}
      >
        {detailsLoading ? (
          <Alert message="Carregando detalhes do host..." type="info" showIcon />
        ) : hostDetails ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2} title="Informações do Host">
              <Descriptions.Item label="Hostname">{hostDetails.hostname}</Descriptions.Item>
              <Descriptions.Item label="IP">{hostDetails.ip}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={hostDetails.status === 'Online' ? 'green' : 'red'}>{hostDetails.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Sistema">
                {(() => {
                  const osCandidate = (hostDetails?.node_exporter?.uname)
                    || (dockerDetails?.info?.OperatingSystem)
                    || (typeof hostDetails?.os === 'string' ? hostDetails.os : (hostDetails?.os?.toString() || 'Unknown'));
                  return osCandidate;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Virtualização">
                {hostDetails.virtualization ? hostDetails.virtualization : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Serviços Detectados" span={2}>
                <Space wrap>
                  {(() => {
                    const openPorts: number[] = Array.isArray(hostDetails.open_ports) ? hostDetails.open_ports : [];
                    const baseDetailed = Array.isArray(hostDetails.services_detailed)
                      ? hostDetails.services_detailed
                      : (hostDetails.services || []).map((s: any) => (
                          typeof s === 'string' ? { service: s, port: undefined, verified: undefined, detail: undefined } : s
                        ));
                    const detailed = baseDetailed.filter((svc: any) => {
                      if (typeof svc.port === 'number' && openPorts.length > 0) {
                        return openPorts.includes(svc.port);
                      }
                      return true;
                    });
                    return detailed.map((svc: any, i: number) => (
                      <Tag key={i} color={svc.verified ? 'green' : 'blue'} title={svc.detail || ''}>
                        {svc.service}{svc.port ? `:${svc.port}` : ''}
                      </Tag>
                    ));
                  })()}
              </Space>
              </Descriptions.Item>
            </Descriptions>

            <Collapse defaultActiveKey={["node", "docker", "dbs"]}>
              <Collapse.Panel header="Node Exporter / Recursos" key="node">
                {hostDetails.node_exporter?.present ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="Mem Total">{hostDetails.node_exporter.mem_total_bytes ?? 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="Mem Disponível">{hostDetails.node_exporter.mem_available_bytes ?? 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="CPU Total (s)">{hostDetails.node_exporter.cpu_seconds_total ?? 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="FS Total Bytes">{hostDetails.node_exporter.fs_bytes_total ?? 'N/A'}</Descriptions.Item>
                    </Descriptions>
                    {hostDetails.node_exporter.uname && (
                      <Alert message={hostDetails.node_exporter.uname} type="success" />
                    )}
                    <Space wrap>
                      <Select size="small" value={nodeExporterVersion} onChange={(v) => setNodeExporterVersion(v)} style={{ width: 140 }}>
                        <Option value="1.9.1">1.9.1</Option>
                        <Option value="1.8.2">1.8.2</Option>
                        <Option value="1.7.0">1.7.0</Option>
                        <Option value="1.6.1">1.6.1</Option>
                      </Select>
                      <Button icon={<ReloadOutlined />} onClick={reinstallOrUpdateNodeExporterViaSSH} loading={nodeExpActionLoading} disabled={!selectedHost?.ip || !sshUser || (!sshPass && !sshKey)}>
                        Reinstalar/Atualizar
                      </Button>
                      <Button icon={<StopOutlined />} danger onClick={stopNodeExporterViaSSH} loading={nodeExpActionLoading} disabled={!selectedHost?.ip || !sshUser || (!sshPass && !sshKey)}>
                        Parar Serviço
                      </Button>
                      <Button icon={<WarningOutlined />} danger onClick={uninstallNodeExporterViaSSH} loading={nodeExpActionLoading} disabled={!selectedHost?.ip || !sshUser || (!sshPass && !sshKey)}>
                        Desinstalar
                      </Button>
                    </Space>
                    {metricsAvailable ? (
                      <MultiSeriesChart
                        title="Recursos (CPU/Mem/FS/RX/TX)"
                        series={[
                          { name: 'CPU %', data: metricsSeries['cpu_usage_percent'] || [] },
                          { name: 'Mem %', data: metricsSeries['mem_used_percent'] || [] },
                          { name: 'FS %', data: metricsSeries['fs_used_percent'] || [] },
                          { name: 'RX B/s', data: metricsSeries['net_rx_bps'] || [] },
                          { name: 'TX B/s', data: metricsSeries['net_tx_bps'] || [] }
                        ]}
                        height={260}
                        theme="modern"
                        showDataZoom={true}
                        showLegend={true}
                        gradient={false}
                      />
                    ) : (
                      <Alert message="Coletando séries em tempo real..." type="info" showIcon />
                    )}
                  </Space>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert message="Node Exporter não detectado (porta 9100)" type="warning" showIcon />
                    <Space wrap>
                      <Select size="small" value={nodeExporterVersion} onChange={(v) => setNodeExporterVersion(v)} style={{ width: 140 }}>
                        <Option value="1.9.1">1.9.1</Option>
                        <Option value="1.8.2">1.8.2</Option>
                        <Option value="1.7.0">1.7.0</Option>
                        <Option value="1.6.1">1.6.1</Option>
                      </Select>
                      <Button type="primary" onClick={installNodeExporterViaSSH} loading={nodeExpActionLoading} disabled={!selectedHost?.ip || !sshUser || (!sshPass && !sshKey)}>
                        Instalar Node Exporter via SSH
                      </Button>
                    </Space>
                  </Space>
                )}
              </Collapse.Panel>

              <Collapse.Panel header="Docker / Containers" key="docker">
                {dockerDetails?.present ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="Engine">{dockerDetails.version?.Platform?.Name || 'Docker'}</Descriptions.Item>
                      <Descriptions.Item label="Version">{dockerDetails.version?.Version || 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="OS">{dockerDetails.info?.OperatingSystem || 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="Containers Ativos">{dockerDetails.info?.ContainersRunning ?? 'N/A'}</Descriptions.Item>
                    </Descriptions>
                    {dockerDetails.metrics_present && !dockerDetails.version && (
                      <Alert
                        message="Docker Engine métricas detectadas (porta 9323)"
                        description="A API remota não está acessível (2375/2376). Exibindo apenas métricas disponíveis."
                        type="info"
                        showIcon
                      />
                    )}
                    <Table
                      size="small"
                      columns={[
                        { title: 'Nome', dataIndex: 'name', key: 'name' },
                        { title: 'Imagem', dataIndex: 'image', key: 'image' },
                        { title: 'Status', dataIndex: 'status', key: 'status' },
                        { title: 'State', dataIndex: 'state', key: 'state' },
                        { title: 'Serviços', dataIndex: 'services_classified', key: 'services', render: (tags: any, rec: any) => (
                          <Space wrap>
                            {Array.isArray(tags) && tags.length > 0
                              ? tags.map((t: string, i: number) => <Tag key={i} color="geekblue">{t}</Tag>)
                              : (Array.isArray(rec?.ports)
                                  ? (rec.ports || []).map((p: any, i: number) => <Tag key={i} color="blue">{`${p.PublicPort ?? ''}->${p.PrivatePort ?? ''}/${p.Type ?? ''}`}</Tag>)
                                  : null)}
                          </Space>
                        ) }
                      ]}
                      dataSource={(dockerDetails.containers || []).map((c: any) => ({ key: c.id, ...c }))}
                      expandable={{
                        expandedRowRender: (c: any) => (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Descriptions bordered size="small" column={2}>
                              <Descriptions.Item label="ID">{c.id}</Descriptions.Item>
                              <Descriptions.Item label="Ports">{(c.ports || []).map((p: any) => `${p.PublicPort ?? ''}->${p.PrivatePort ?? ''}/${p.Type ?? ''}`).join(', ') || 'N/A'}</Descriptions.Item>
                            </Descriptions>
                            {c.logs_tail ? (
                              <Card size="small" title="Logs (tail)"><pre style={{ whiteSpace: 'pre-wrap' }}>{c.logs_tail}</pre></Card>
                            ) : (
                              <Alert message="Logs indisponíveis" type="info" />
                            )}
                          </Space>
                        )
                      }}
                    />
                  </Space>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                      message="Docker API não acessível (2375/2376)"
                      description="Se o host for VM/hipervisor, a API remota pode estar desabilitada. Opcionalmente exponha 2376 (TLS) ou habilite métricas do Engine em 9323."
                      type="warning"
                      showIcon
                    />
                    <Divider orientation="left">Tentar coleta via SSH</Divider>
                    <Space wrap>
                      <Input size="small" placeholder="Usuário SSH" value={sshUser} onChange={(e) => setSshUser(e.target.value)} style={{ width: 160 }} />
                      <Input.Password size="small" placeholder="Senha SSH" value={sshPass} onChange={(e) => setSshPass(e.target.value)} style={{ width: 180 }} />
                      <Input size="small" placeholder="Chave Privada (caminho)" value={sshKey} onChange={(e) => setSshKey(e.target.value)} style={{ width: 240 }} />
                      <Input size="small" type="number" placeholder="Porta" value={sshPort} onChange={(e) => setSshPort(Number(e.target.value || 22))} style={{ width: 100 }} />
                      <Input size="small" type="number" placeholder="Timeout (s)" value={sshTimeout} onChange={(e) => setSshTimeout(Number(e.target.value || 3.0))} style={{ width: 120 }} />
                      <Button size="small" type="primary" onClick={fetchDockerViaSSH}>
                        Coletar via SSH
                      </Button>
                    </Space>
                    <Alert message="Dica: Preencha as credenciais SSH e clique em Coletar via SSH para listar os containers." type="info" showIcon />
                  </Space>
                )}
              </Collapse.Panel>

              <Collapse.Panel header="Bancos de Dados" key="dbs">
                {dbProbes ? (
                  <Table
                    size="small"
                    columns={[
                      { title: 'Banco', dataIndex: 'name', key: 'name', render: (name: string) => (
                        <Tag color={
                          name === 'postgresql' ? 'geekblue' :
                          name === 'mysql' ? 'green' :
                          name === 'redis' ? 'red' :
                          name === 'mongodb' ? 'darkgreen' :
                          name === 'rabbitmq' ? 'orange' : 'volcano'
                        }>{name}</Tag>
                      ) },
                      { title: 'Porta', dataIndex: 'port', key: 'port' },
                      { title: 'Alcançável', dataIndex: 'reachable', key: 'reachable', render: (reachable: boolean) => (
                        <Badge status={reachable ? 'success' : 'error'} text={reachable ? 'Sim' : 'Não'} />
                      ) },
                      { title: 'Latência (ms)', dataIndex: 'latency_ms', key: 'latency_ms', render: (v: number) => (v !== undefined ? v : '-') },
                      { title: 'Detalhe', key: 'detail', render: (_: any, r: any) => {
                        if (r.version) return r.version;
                        if (typeof r.tls_supported !== 'undefined') return r.tls_supported ? 'TLS disponível' : 'Sem TLS';
                        if (typeof r.requires_auth !== 'undefined') return r.requires_auth ? 'Autenticação requerida' : 'Aberto';
                        if (typeof r.amqp_ready !== 'undefined') return r.amqp_ready ? 'AMQP pronto' : 'AMQP indisponível';
                        if (r.banner) return `Banner: ${r.banner}`;
                        if (r.error) return `Erro: ${r.error}`;
                        return '-';
                      } }
                    ]}
                    dataSource={(dbProbes || []).map((d: any, idx: number) => ({ key: `${d.name}-${idx}`, ...d }))}
                  />
                ) : (
                  <Alert message="Sem resultados de conexão a bancos" type="info" showIcon />
                )}
              </Collapse.Panel>
            </Collapse>
          </Space>
        ) : (
          <Alert message="Sem dados de host" type="error" />
        )}
      </Drawer>
    </div>
  );
};

export default Integrations;
