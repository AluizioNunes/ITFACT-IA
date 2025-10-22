-- Script para adicionar bancos N8N e Chatwoot que podem estar faltando
-- Execute este script conectado ao PostgreSQL como superuser

-- Verificar se usuário admin existe, criar se necessário
DO
$$BEGIN
   CREATE USER admin WITH PASSWORD 'admin' CREATEDB;
EXCEPTION WHEN duplicate_object THEN
   ALTER USER admin WITH PASSWORD 'admin';
   ALTER USER admin CREATEDB;
END$$;

-- Criar banco Evolution API se não existir
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'evolutionapi') THEN
      CREATE DATABASE evolutionapi OWNER admin;
   END IF;
END
$$;

-- Criar banco N8N se não existir
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n') THEN
      CREATE DATABASE n8n OWNER admin;
   END IF;
END
$$;

-- Criar banco Chatwoot se não existir
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chatwoot') THEN
      CREATE DATABASE chatwoot OWNER admin;
   END IF;
END
$$;

-- Garantir permissões
GRANT ALL PRIVILEGES ON DATABASE evolutionapi TO admin;
GRANT ALL PRIVILEGES ON DATABASE n8n TO admin;
GRANT ALL PRIVILEGES ON DATABASE chatwoot TO admin;

-- Configurar Evolution API
\c evolutionapi;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema Evolution API
CREATE SCHEMA IF NOT EXISTS evolutionapi;
GRANT ALL ON SCHEMA evolutionapi TO admin;
GRANT USAGE ON SCHEMA evolutionapi TO admin;

-- Tabelas básicas para Evolution API
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

-- Inserir dados iniciais no Evolution API
INSERT INTO evolutionapi.instances (name, token, status) 
VALUES 
    ('default-instance', 'evo-' || generate_random_uuid(), 'DISCONNECTED')
ON CONFLICT DO NOTHING;

-- Configurar N8N
\c n8n;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema N8N
CREATE SCHEMA IF NOT EXISTS n8n;
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

-- Inserir dados iniciais no N8N
INSERT INTO n8n.workflows (name, description, workflow_data, is_active) 
VALUES 
    ('Welcome Workflow', 'Workflow inicial de boas-vindas', '{"nodes": [], "connections": {}}', false)
ON CONFLICT DO NOTHING;

-- Configurar Chatwoot
\c chatwoot;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema Chatwoot
CREATE SCHEMA IF NOT EXISTS chatwoot;
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

-- Inserir dados iniciais no Chatwoot
INSERT INTO chatwoot.accounts (name, domain, support_email) 
VALUES 
    ('CMM Automação', 'cmm.am.gov.br', 'ti@cmm.am.gov.br')
ON CONFLICT DO NOTHING;

-- Voltar para AUTOMACAO e mostrar resultado
\c AUTOMACAO;
SELECT 
    'Bancos criados/verificados com sucesso!' AS status,
    string_agg(datname, ', ') AS bancos_existentes
FROM pg_database 
WHERE datname IN ('evolutionapi', 'n8n', 'chatwoot')
GROUP BY 1;