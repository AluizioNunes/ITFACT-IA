export type ServiceKey =
  | 'grafana'
  | 'n8n'
  | 'rabbitmq'
  | 'redis'
  | 'chatwoot'
  | 'evolutionApi'
  | 'whatsapp';

// Centraliza URLs externas por ambiente
// Hoje: ambiente local com localhost:porta
export const SERVICE_URLS: Record<ServiceKey, string> = {
  grafana: 'http://localhost:3010',
  n8n: 'http://localhost:5678',
  rabbitmq: 'http://localhost:15672',
  // RedisInsight UI (v2) na porta 5540
  redis: 'http://localhost:5540',
  chatwoot: 'http://localhost:3002',
  // Evolution API exposta em 8082 para evitar conflito com Keycloak (8081)
  evolutionApi: 'http://localhost:8082',
  // WhatsApp usa Evolution API
  whatsapp: 'http://localhost:8082',
};

export const getServiceUrl = (key: ServiceKey): string => SERVICE_URLS[key];