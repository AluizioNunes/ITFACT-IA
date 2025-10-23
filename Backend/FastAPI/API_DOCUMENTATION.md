# API Documentation - Novos Endpoints

## Endpoints de Auditoria e Eventos

### GET /api/events
Lista eventos do sistema com suporte aos novos campos `actor` e `source`.

**Parâmetros:**
- `limit` (opcional): Número máximo de eventos a retornar
- `offset` (opcional): Offset para paginação

**Resposta:**
```json
{
  "ok": true,
  "events": [
    {
      "id": 1,
      "device_id": "device123",
      "event_type": "snmp_set",
      "severity": "info",
      "description": "SNMP SET operation",
      "attributes": {...},
      "actor": "192.168.1.100",
      "source": "api",
      "ts": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## Endpoints de Topologia

### POST /api/topologia/links/purge-orphans
Remove links órfãos que referenciam dispositivos ou interfaces inexistentes.

**Resposta:**
```json
{
  "ok": true,
  "deleted": 5,
  "message": "Removidos 5 links órfãos"
}
```

### POST /api/topologia/links/update-latency
Atualiza a latência de um link específico.

**Body:**
```json
{
  "link_id": 123
}
```

**Resposta:**
```json
{
  "ok": true,
  "link_id": 123,
  "latency_ms": 15.5,
  "message": "Latência atualizada com sucesso"
}
```

### POST /api/topologia/links/probe-latency
Executa sondas ativas de latência em lote.

**Body:**
```json
{
  "device_id": "device123",  // opcional
  "max_concurrent": 10,      // opcional, padrão: 10
  "timeout": 5               // opcional, padrão: 5
}
```

**Resposta:**
```json
{
  "ok": true,
  "probed": 25,
  "successful": 20,
  "failed": 5,
  "message": "Sondas de latência executadas: 20/25 sucessos"
}
```

## Endpoints de Exportação

### GET /api/topologia/export/formats
Lista os formatos de exportação disponíveis.

**Resposta:**
```json
{
  "ok": true,
  "formats": [
    {
      "name": "json",
      "description": "JSON format with nodes and edges",
      "endpoint": "/api/topologia/export/json",
      "content_type": "application/json"
    },
    {
      "name": "graphml",
      "description": "GraphML XML format for graph analysis tools",
      "endpoint": "/api/topologia/export/graphml",
      "content_type": "application/xml"
    }
  ]
}
```

### GET /api/topologia/export/json
Exporta o grafo de topologia em formato JSON.

**Resposta:**
```json
{
  "format": "json",
  "version": "1.0",
  "generated_at": "2024-01-01T12:00:00Z",
  "metadata": {
    "nodes_count": 10,
    "edges_count": 15,
    "description": "Network topology graph exported from CMM Analytics"
  },
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### GET /api/topologia/export/graphml
Exporta o grafo de topologia em formato GraphML (XML).

**Content-Type:** `application/xml`

Retorna um arquivo GraphML válido que pode ser importado em ferramentas como:
- Gephi
- Cytoscape
- NetworkX
- yEd

## Melhorias de Segurança

### Rate Limiting
Todos os endpoints sensíveis agora incluem rate limiting baseado no IP do cliente:
- `/api/snmp/set`: Máximo 10 requisições por minuto
- `/api/netmiko/command`: Máximo 5 requisições por minuto

### Auditoria
Operações críticas agora registram eventos de auditoria com:
- `actor`: IP do cliente que fez a requisição
- `source`: Origem da operação (ex: "api", "snmp", "netmiko")
- Mascaramento automático de segredos nos atributos

### Validação SNMPv3
O endpoint `/api/snmp/set` agora valida credenciais SNMPv3 antes de executar operações.

## Notas Técnicas

- Todos os endpoints mantêm compatibilidade com versões anteriores
- Rate limiting usa cache em memória (pode ser migrado para Redis se necessário)
- Exportações são geradas em tempo real a partir do banco de dados
- Sondas de latência usam TCP connect para medir latência de rede
- Logs de auditoria incluem mascaramento automático de senhas e chaves