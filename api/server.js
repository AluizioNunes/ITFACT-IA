const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com PostgreSQL
const pgClient = new Client({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'Admin',
  password: process.env.POSTGRES_PASSWORD || 'Ricardo@1964',
  database: process.env.POSTGRES_DB || 'postgres',
});

// Conectar ao PostgreSQL
pgClient.connect()
  .then(() => console.log('Conectado ao PostgreSQL'))
  .catch(err => console.error('Erro ao conectar ao PostgreSQL', err));

// Rotas

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Obter informações do PostgreSQL
app.get('/api/postgres/info', async (req, res) => {
  try {
    // Versão do PostgreSQL
    const versionResult = await pgClient.query('SELECT version()');
    const version = versionResult.rows[0].version;
    
    // Número de conexões ativas
    const connectionsResult = await pgClient.query(`
      SELECT count(*) as connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `);
    const connections = parseInt(connectionsResult.rows[0].connections);
    
    // Número de bancos de dados
    const databasesResult = await pgClient.query(`
      SELECT count(*) as databases 
      FROM pg_database 
      WHERE datistemplate = false
    `);
    const databases = parseInt(databasesResult.rows[0].databases);
    
    // Tamanho total do banco
    const sizeResult = await pgClient.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    const size = sizeResult.rows[0].size;
    
    res.json({
      version,
      connections,
      databases,
      size,
      uptime: 'Informação não disponível diretamente via SQL'
    });
  } catch (error) {
    console.error('Erro ao obter informações do PostgreSQL:', error);
    res.status(500).json({ error: 'Erro ao obter informações do PostgreSQL' });
  }
});

// Obter lista de bancos de dados
app.get('/api/postgres/databases', async (req, res) => {
  try {
    const result = await pgClient.query(`
      SELECT datname as name, 
             pg_size_pretty(pg_database_size(datname)) as size,
             (SELECT count(*) FROM pg_stat_user_tables WHERE schemaname = 'public') as tables
      FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter lista de bancos de dados:', error);
    res.status(500).json({ error: 'Erro ao obter lista de bancos de dados' });
  }
});

// Obter estatísticas do PostgreSQL
app.get('/api/postgres/stats', async (req, res) => {
  try {
    const result = await pgClient.query(`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity) as total_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter estatísticas do PostgreSQL:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas do PostgreSQL' });
  }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor API rodando em http://0.0.0.0:${port}`);
});