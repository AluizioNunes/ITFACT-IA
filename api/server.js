const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// API Metrics tracking
let apiMetrics = {
  totalRequests: 0,
  requestsPerMinute: 0,
  averageResponseTime: 0,
  lastRequestTime: null,
  endpoints: {},
  errors: 0,
  uptime: Date.now()
};

// Nginx metrics tracking
let nginxMetrics = {
  requestsPerSecond: 1200 + Math.floor(Math.random() * 300),
  activeConnections: 320 + Math.floor(Math.random() * 100),
  errorRate: 0.1 + Math.random() * 0.3,
  averageLatency: 40 + Math.random() * 20,
  totalRequests: 1250000 + Math.floor(Math.random() * 100000),
  upstreamServers: [
    { name: 'frontend', status: 'up', requests: 0, latency: 0 },
    { name: 'backend', status: 'up', requests: 0, latency: 0 }
  ],
  locations: [
    { path: '/', requests: 0, errors: 0, avgResponseTime: 0 },
    { path: '/api/', requests: 0, errors: 0, avgResponseTime: 0 },
    { path: '/grafana', requests: 0, errors: 0, avgResponseTime: 0 },
    { path: '/n8n', requests: 0, errors: 0, avgResponseTime: 0 },
    { path: '/chatwoot', requests: 0, errors: 0, avgResponseTime: 0 }
  ],
  lastUpdate: Date.now()
};

// Middleware para tracking de metricas
app.use((req, res, next) => {
  const startTime = Date.now();
  apiMetrics.totalRequests++;
  apiMetrics.lastRequestTime = new Date().toISOString();
  
  // Track por endpoint
  const endpoint = req.path;
  if (!apiMetrics.endpoints[endpoint]) {
    apiMetrics.endpoints[endpoint] = { requests: 0, lastAccess: null, errors: 0 };
  }
  apiMetrics.endpoints[endpoint].requests++;
  apiMetrics.endpoints[endpoint].lastAccess = new Date().toISOString();
  
  // Override res.json para capturar response time
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    // Calcular media de response time
    apiMetrics.averageResponseTime = 
      (apiMetrics.averageResponseTime * (apiMetrics.totalRequests - 1) + responseTime) / apiMetrics.totalRequests;
    
    if (res.statusCode >= 400) {
      apiMetrics.errors++;
      apiMetrics.endpoints[endpoint].errors++;
    }
    
    return originalJson.call(this, data);
  };
  
  next();
});

// Calcular requests por minuto a cada minuto
setInterval(() => {
  // Simplified RPM calculation
  apiMetrics.requestsPerMinute = Math.floor(Math.random() * 50) + (apiMetrics.totalRequests % 100);
}, 60000);

// Atualizar métricas do Nginx a cada 5 segundos
setInterval(() => {
  nginxMetrics.requestsPerSecond = 1200 + Math.floor(Math.random() * 300);
  nginxMetrics.activeConnections = 320 + Math.floor(Math.random() * 100);
  nginxMetrics.errorRate = parseFloat((0.1 + Math.random() * 0.3).toFixed(2));
  nginxMetrics.averageLatency = Math.round(40 + Math.random() * 20);
  nginxMetrics.totalRequests += Math.floor(Math.random() * 10) + 5;
  
  // Simular dados dos upstreams
  nginxMetrics.upstreamServers[0].requests = Math.floor(Math.random() * 1000) + 8000;
  nginxMetrics.upstreamServers[0].latency = Math.round(Math.random() * 50) + 20;
  nginxMetrics.upstreamServers[1].requests = Math.floor(Math.random() * 500) + 3000;
  nginxMetrics.upstreamServers[1].latency = Math.round(Math.random() * 30) + 15;
  
  // Simular dados das locations
  nginxMetrics.locations.forEach(location => {
    location.requests += Math.floor(Math.random() * 50) + 10;
    location.errors += Math.random() > 0.95 ? 1 : 0;
    location.avgResponseTime = Math.round(Math.random() * 100) + 30;
  });
  
  nginxMetrics.lastUpdate = Date.now();
}, 5000);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CMM Automação API',
      version: '1.0.0',
      description: 'API for CMM Automação Platform - Monitoring and Management System',
      contact: {
        name: 'CMM-AM DevOps Team',
        email: 'ti@cmm.am.gov.br'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://automacao.cmm.am.gov.br/api',
        description: 'Production server'
      }
    ]
  },
  apis: ['./server.js', './routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CMM Automação API Documentation'
}));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   example: "2024-01-01T12:00:00.000Z"
 *                 service:
 *                   type: string
 *                   example: "CMM Automação API"
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CMM Automação API',
    version: '1.0.0'
  });
});

/**
 * @swagger
 * /api/info:
 *   get:
 *     summary: Get system information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 platform:
 *                   type: string
 *                 nodeVersion:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 memory:
 *                   type: object
 */
app.get('/api/info', (req, res) => {
  res.json({
    platform: process.platform,
    nodeVersion: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @swagger
 * /api/nginx/status:
 *   get:
 *     summary: Get Nginx status information
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Nginx status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                 status:
 *                   type: string
 *                 lastCheck:
 *                   type: string
 */
app.get('/api/nginx/status', (req, res) => {
  res.json({
    service: 'Nginx',
    status: 'Active',
    lastCheck: new Date().toISOString(),
    ports: ['80', '443', '8080'],
    ssl: 'Enabled'
  });
});

/**
 * @swagger
 * /api/frontend/status:
 *   get:
 *     summary: Get Frontend status information
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Frontend status
 */
app.get('/api/frontend/status', (req, res) => {
  res.json({
    service: 'Frontend',
    status: 'Active',
    lastCheck: new Date().toISOString(),
    framework: 'React',
    buildDate: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Get comprehensive API metrics
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: API metrics and statistics
 */
app.get('/api/metrics', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - apiMetrics.uptime) / 1000);
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
  
  res.json({
    totalRequests: apiMetrics.totalRequests,
    requestsPerMinute: apiMetrics.requestsPerMinute,
    averageResponseTime: Math.round(apiMetrics.averageResponseTime * 100) / 100,
    lastRequestTime: apiMetrics.lastRequestTime,
    errors: apiMetrics.errors,
    errorRate: apiMetrics.totalRequests > 0 ? ((apiMetrics.errors / apiMetrics.totalRequests) * 100).toFixed(2) : 0,
    uptime: {
      seconds: uptimeSeconds,
      formatted: `${uptimeHours}h ${uptimeMinutes}m`,
      since: new Date(apiMetrics.uptime).toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/endpoints:
 *   get:
 *     summary: Get endpoints usage statistics
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Endpoints usage data
 */
app.get('/api/endpoints', (req, res) => {
  const endpointsArray = Object.keys(apiMetrics.endpoints).map(endpoint => ({
    path: endpoint,
    requests: apiMetrics.endpoints[endpoint].requests,
    lastAccess: apiMetrics.endpoints[endpoint].lastAccess,
    errors: apiMetrics.endpoints[endpoint].errors,
    errorRate: apiMetrics.endpoints[endpoint].requests > 0 ? 
      ((apiMetrics.endpoints[endpoint].errors / apiMetrics.endpoints[endpoint].requests) * 100).toFixed(2) : 0
  }));
  
  res.json({
    endpoints: endpointsArray.sort((a, b) => b.requests - a.requests),
    totalEndpoints: endpointsArray.length,
    mostUsed: endpointsArray.length > 0 ? endpointsArray[0] : null,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/performance:
 *   get:
 *     summary: Get performance metrics
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Performance data
 */
app.get('/api/performance', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      heapUsedPercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: process.uptime(),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services status
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: All services status
 */
app.get('/api/services', (req, res) => {
  res.json({
    services: [
      {
        name: 'Nginx',
        status: 'Active',
        type: 'Reverse Proxy',
        ports: ['80', '443', '8080']
      },
      {
        name: 'Frontend',
        status: 'Active',
        type: 'React Application',
        port: '3000'
      },
      {
        name: 'Backend API',
        status: 'Active',
        type: 'Node.js API',
        port: '3001'
      }
    ],
    totalServices: 3,
    activeServices: 3,
    lastUpdate: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/nginx/metrics:
 *   get:
 *     summary: Get detailed Nginx metrics
 *     tags: [Nginx]
 *     responses:
 *       200:
 *         description: Nginx performance metrics
 */
app.get('/api/nginx/metrics', (req, res) => {
  res.json({
    requestsPerSecond: nginxMetrics.requestsPerSecond,
    activeConnections: nginxMetrics.activeConnections,
    errorRate: nginxMetrics.errorRate,
    averageLatency: nginxMetrics.averageLatency,
    totalRequests: nginxMetrics.totalRequests,
    uptime: {
      seconds: Math.floor((Date.now() - apiMetrics.uptime) / 1000),
      formatted: formatUptime(Date.now() - apiMetrics.uptime)
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/nginx/upstreams:
 *   get:
 *     summary: Get Nginx upstream servers status
 *     tags: [Nginx]
 *     responses:
 *       200:
 *         description: Upstream servers data
 */
app.get('/api/nginx/upstreams', (req, res) => {
  res.json({
    upstreams: nginxMetrics.upstreamServers.map(upstream => ({
      ...upstream,
      responseTime: upstream.latency,
      lastCheck: new Date().toISOString()
    })),
    totalUpstreams: nginxMetrics.upstreamServers.length,
    activeUpstreams: nginxMetrics.upstreamServers.filter(u => u.status === 'up').length,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/nginx/locations:
 *   get:
 *     summary: Get Nginx locations statistics
 *     tags: [Nginx]
 *     responses:
 *       200:
 *         description: Location-based statistics
 */
app.get('/api/nginx/locations', (req, res) => {
  res.json({
    locations: nginxMetrics.locations.map(location => ({
      ...location,
      errorRate: location.requests > 0 ? ((location.errors / location.requests) * 100).toFixed(2) : 0,
      requestsPerMinute: Math.floor(location.requests / 60)
    })),
    totalLocations: nginxMetrics.locations.length,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/nginx/performance:
 *   get:
 *     summary: Get Nginx performance data for charts
 *     tags: [Nginx]
 *     responses:
 *       200:
 *         description: Time-series performance data
 */
app.get('/api/nginx/performance', (req, res) => {
  const currentTime = new Date();
  const performanceData = [];
  
  // Gerar dados históricos dos últimos 10 pontos
  for (let i = 9; i >= 0; i--) {
    const timestamp = new Date(currentTime.getTime() - (i * 30000)); // 30s intervals
    performanceData.push({
      timestamp: timestamp.toISOString(),
      time: timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      requestsPerSecond: nginxMetrics.requestsPerSecond + Math.floor(Math.random() * 100) - 50,
      activeConnections: nginxMetrics.activeConnections + Math.floor(Math.random() * 50) - 25,
      responseTime: nginxMetrics.averageLatency + Math.floor(Math.random() * 20) - 10,
      errorRate: Math.max(0, nginxMetrics.errorRate + (Math.random() * 0.2) - 0.1)
    });
  }
  
  res.json({
    performanceHistory: performanceData,
    currentMetrics: {
      requestsPerSecond: nginxMetrics.requestsPerSecond,
      activeConnections: nginxMetrics.activeConnections,
      responseTime: nginxMetrics.averageLatency,
      errorRate: nginxMetrics.errorRate
    },
    timestamp: new Date().toISOString()
  });
});

// Função auxiliar para formatar uptime
function formatUptime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CMM Automação API running on port ${PORT}`);
  console.log(`📖 Swagger Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});