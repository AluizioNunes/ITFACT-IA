-- Schema de inventário e descoberta para CMM Automação
\c postgres;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de servidores
CREATE TABLE IF NOT EXISTS public.servers (
  id SERIAL PRIMARY KEY,
  hostname VARCHAR(255) NOT NULL,
  ip VARCHAR(64) NOT NULL,
  os VARCHAR(64),
  location VARCHAR(128),
  status VARCHAR(32) DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_servers_ip ON public.servers(ip);

-- Tabela de serviços por servidor
CREATE TABLE IF NOT EXISTS public.services (
  id SERIAL PRIMARY KEY,
  server_id INT REFERENCES public.servers(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  port INT,
  protocol VARCHAR(16),
  status VARCHAR(32) DEFAULT 'unknown',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_services_server ON public.services(server_id);

-- Tabela de descobertas
CREATE TABLE IF NOT EXISTS public.discoveries (
  id SERIAL PRIMARY KEY,
  target VARCHAR(255) NOT NULL,
  method VARCHAR(64) NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_discoveries_target ON public.discoveries(target);

-- Tabela de verificações de serviços
CREATE TABLE IF NOT EXISTS public.service_checks (
  id SERIAL PRIMARY KEY,
  service_id INT REFERENCES public.services(id) ON DELETE CASCADE,
  check_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) DEFAULT 'unknown',
  latency_ms INT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_checks_service ON public.service_checks(service_id);

-- Tabela de alertas
CREATE TABLE IF NOT EXISTS public.alerts (
  id SERIAL PRIMARY KEY,
  severity VARCHAR(16) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(32) NOT NULL, -- server|service|check
  entity_id INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON public.alerts(entity_type, entity_id);