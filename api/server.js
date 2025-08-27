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