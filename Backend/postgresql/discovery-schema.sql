-- Schema de inventário e descoberta para CMM Automação (limpo)
-- Executado no banco AUTOMACAO (padrão). Sem criações no schema public.

-- Criar schema AUTOMACAO
CREATE SCHEMA IF NOT EXISTS "AUTOMACAO" AUTHORIZATION admin;

-- Remover tabela legada, se existir
DROP TABLE IF EXISTS "AUTOMACAO"."Dsipositivos" CASCADE;

-- Tabela principal de dispositivos
CREATE TABLE IF NOT EXISTS "AUTOMACAO"."Devices" (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(64) UNIQUE,
  hostname VARCHAR(255) UNIQUE,
  os VARCHAR(64),
  status VARCHAR(32) DEFAULT 'Unknown',
  services JSONB DEFAULT '[]'::jsonb,
  last_seen TIMESTAMPTZ,
  node_exporter JSONB DEFAULT '{}'::jsonb,
  virtualization VARCHAR(64),
  real BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remover schema public deste banco, se ainda existir
DROP SCHEMA IF EXISTS public CASCADE;

-- Permissões
GRANT ALL ON SCHEMA "AUTOMACAO" TO admin;
GRANT ALL ON ALL TABLES IN SCHEMA "AUTOMACAO" TO admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "AUTOMACAO" TO admin;