-- Script de inicialização para PostgreSQL 17.6
-- CMM Automação Platform Database Setup - Apenas bancos necessários

-- Criar usuário admin se não existir
DO
$$BEGIN
   CREATE USER admin WITH PASSWORD 'admin' CREATEDB;
EXCEPTION WHEN duplicate_object THEN
   ALTER USER admin WITH PASSWORD 'admin';
   ALTER USER admin CREATEDB;
END$$;

-- Removido: extensões globais no banco principal (evitar dependência do schema public)

-- CRIAR BANCO DE DADOS EVOLUTIONAPI
\c AUTOMACAO;
DROP SCHEMA IF EXISTS public CASCADE;
CREATE DATABASE evolutionapi OWNER admin;
GRANT ALL PRIVILEGES ON DATABASE evolutionapi TO admin;

-- Configurar EvolutionAPI
\c evolutionapi;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema EvolutionAPI
CREATE SCHEMA IF NOT EXISTS evolutionapi AUTHORIZATION admin;
GRANT ALL ON SCHEMA evolutionapi TO admin;
GRANT USAGE ON SCHEMA evolutionapi TO admin;

-- Tabelas básicas para EvolutionAPI
CREATE TABLE IF NOT EXISTS evolutionapi.instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    token VARCHAR(255) NOT NULL,
    webhook_url TEXT,
    status VARCHAR(20) DEFAULT 'DISCONNECTED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evolutionapi.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID REFERENCES evolutionapi.instances(id),
    message_id VARCHAR(255) NOT NULL,
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    content TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON ALL TABLES IN SCHEMA evolutionapi TO admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA evolutionapi TO admin;

-- CRIAR BANCO DE DADOS N8N
\c AUTOMACAO;
CREATE DATABASE n8n OWNER admin;
GRANT ALL PRIVILEGES ON DATABASE n8n TO admin;

-- Configurar N8N
\c n8n;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema N8N
CREATE SCHEMA IF NOT EXISTS n8n AUTHORIZATION admin;
GRANT ALL ON SCHEMA n8n TO admin;
GRANT USAGE ON SCHEMA n8n TO admin;

-- Tabelas básicas para N8N
CREATE TABLE IF NOT EXISTS n8n.workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS n8n.executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES n8n.workflows(id),
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    execution_data JSONB,
    error_message TEXT
);

GRANT ALL ON ALL TABLES IN SCHEMA n8n TO admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA n8n TO admin;

-- CRIAR BANCO DE DADOS CHATWOOT
\c AUTOMACAO;
CREATE DATABASE chatwoot OWNER admin;
GRANT ALL PRIVILEGES ON DATABASE chatwoot TO admin;

-- Configurar Chatwoot
\c chatwoot;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema Chatwoot
CREATE SCHEMA IF NOT EXISTS chatwoot AUTHORIZATION admin;
GRANT ALL ON SCHEMA chatwoot TO admin;
GRANT USAGE ON SCHEMA chatwoot TO admin;

-- Tabelas básicas para Chatwoot
CREATE TABLE IF NOT EXISTS chatwoot.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    support_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatwoot.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES chatwoot.accounts(id),
    contact_phone VARCHAR(50),
    contact_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatwoot.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chatwoot.conversations(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON ALL TABLES IN SCHEMA chatwoot TO admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA chatwoot TO admin;

-- INSERIR DADOS INICIAIS NO EVOLUTIONAPI
\c evolutionapi;
INSERT INTO evolutionapi.instances (name, token, status) 
VALUES 
    ('default-instance', 'evo-' || generate_random_uuid(), 'DISCONNECTED')
ON CONFLICT DO NOTHING;

-- INSERIR DADOS INICIAIS NO N8N
\c n8n;
INSERT INTO n8n.workflows (name, description, workflow_data, is_active) 
VALUES 
    ('Welcome Workflow', 'Workflow inicial de boas-vindas', '{"nodes": [], "connections": {}}', false)
ON CONFLICT DO NOTHING;

-- INSERIR DADOS INICIAIS NO CHATWOOT
\c chatwoot;
INSERT INTO chatwoot.accounts (name, domain, support_email) 
VALUES 
    ('CMM Automação', 'cmm.am.gov.br', 'ti@cmm.am.gov.br')
ON CONFLICT DO NOTHING;

-- VOLTA PARA O BANCO PRINCIPAL PARA MENSAGEM FINAL
\c AUTOMACAO;
DROP DATABASE IF EXISTS postgres;
SELECT 'PostgreSQL 17.6 inicializado com sucesso para CMM Automação Platform' AS status_inicializacao,
       'Bancos criados: evolutionapi, n8n, chatwoot' AS bancos_criados,
       'Usuários criados: admin (para todos os bancos)' AS usuarios_criados;

-- Mensagem de confirmação
SELECT 'PostgreSQL 17.6 database initialized for CMM Automação Platform' AS initialization_status;