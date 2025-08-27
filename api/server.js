const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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