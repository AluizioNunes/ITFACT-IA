
// Sistema de descoberta redesenhado
const { spawn } = require('child_process');

class NetworkDiscovery {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      discoveredDevices: [],
      method: 'Windows PowerShell based discovery',
      platform: process.platform
    };
  }

  async discover(targets) {
    console.log('🚀 Starting network discovery...');
    
    for (const target of targets) {
      const device = await this.discoverDevice(target);
      this.results.discoveredDevices.push(device);
    }

    return this.results;
  }

  async discoverDevice(target) {
    const device = {
      ip: target,
      hostname: target,
      status: 'Unknown',
      connectivity: {},
      services: [],
      timestamp: new Date().toISOString()
    };

    try {
      const connectivity = await this.testConnectivity(target);
      device.connectivity = connectivity;
      device.status = connectivity.online ? 'Online' : 'Offline';

      if (connectivity.online) {
        device.services = await this.discoverServices(target);
      }

    } catch (error) {
      device.status = 'Error';
      device.error = error.message;
    }

    return device;
  }

  async testConnectivity(target) {
    const connectivity = { online: false, dns: false, ping: false };

    connectivity.dns = await this.testDNS(target);
    connectivity.ping = await this.testPing(target);
    connectivity.online = connectivity.dns || connectivity.ping;

    return connectivity;
  }

  async testDNS(target) {
    return new Promise((resolve) => {
      require('dns').lookup(target, (err) => resolve(!err));
    });
  }

  async testPing(target) {
    return new Promise((resolve) => {
      const ping = spawn('Test-Connection', ['-ComputerName', target, '-Count', '1', '-Quiet']);
      ping.on('close', (code) => resolve(code === 0));
    });
  }

  async discoverServices(target) {
    const services = [];
    const ports = [80, 443, 22, 3389, 2376];

    for (const port of ports) {
      const isOpen = await this.testPort(target, port);
      if (isOpen) {
        services.push({ port, service: this.getServiceName(port) });
      }
    }

    return services;
  }

  async testPort(target, port) {
    return new Promise((resolve) => {
      const net = require('net');
      const client = new net.Socket();
      client.setTimeout(3000);
      client.on('connect', () => { client.destroy(); resolve(true); });
      client.on('timeout', () => { client.destroy(); resolve(false); });
      client.on('error', () => { client.destroy(); resolve(false); });
      client.connect(port, target);
    });
  }

  getServiceName(port) {
    const services = { 80: 'HTTP', 443: 'HTTPS', 22: 'SSH', 3389: 'RDP', 2376: 'Docker' };
    return services[port] || 'Unknown';
  }
}

async function performDiscovery(targets) {
  const discovery = new NetworkDiscovery();
  return await discovery.discover(targets);
}

module.exports = { performDiscovery };

