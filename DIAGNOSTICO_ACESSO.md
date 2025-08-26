# DIAGNÓSTICO DE PROBLEMAS - AUTOMAÇÃO CMM

## PROBLEMA IDENTIFICADO

O DNS está funcionando corretamente (`automacao.cmm.am.gov.br` aponta para `172.18.1.32`), mas há problemas na configuração do Nginx que impedem o acesso.

## PRINCIPAIS CORREÇÕES APLICADAS

### 1. Configuração SSL Simplificada
- Removido `default_server` duplicado que causava conflitos
- Certificados SSL agora são opcionais (criados automaticamente se não existirem)
- Configuração SSL mais tolerante

### 2. Estrutura de Roteamento Dupla
- **`/grafana/`** → Acesso direto ao container Grafana
- **`/grafanacore`** → Página frontend React sobre o Grafana
- **`https://grafana.cmm.am.gov.br`** → Acesso direto via subdomínio

### 3. Botões "Acessar" Funcionais
Todos os botões azuis nas páginas frontend agora apontam para os subdomínios:
- Grafana → `https://grafana.cmm.am.gov.br`
- Prometheus → `https://prometheus.cmm.am.gov.br`
- N8N → `https://n8n.cmm.am.gov.br`
- Chatwoot → `https://chatwoot.cmm.am.gov.br`
- WhatsApp → `https://whatsapp.cmm.am.gov.br`
- RabbitMQ → `https://rabbitmq.cmm.am.gov.br`
- Redis → `https://redis.cmm.am.gov.br`

## COMANDOS DE DIAGNÓSTICO

### No Servidor (172.18.1.32)

```bash
# 1. Verificar containers
docker-compose ps

# 2. Testar Nginx local
curl -I http://localhost:80/health
curl -I http://localhost:8081/status

# 3. Verificar logs
docker-compose logs nginx | tail -50
docker-compose logs frontend | tail -20

# 4. Testar conectividade interna
docker exec nginx curl -I http://grafana:4000/api/health
docker exec nginx curl -I http://prometheus:9090/-/healthy

# 5. Verificar certificados SSL
docker exec nginx ls -la /etc/ssl/certs/
```

### Do Cliente Externo

```bash
# 1. Testar DNS
nslookup automacao.cmm.am.gov.br
ping automacao.cmm.am.gov.br

# 2. Testar conectividade HTTP
curl -I http://automacao.cmm.am.gov.br/health
curl -I http://172.18.1.32/health

# 3. Testar HTTPS (se certificados válidos)
curl -I https://automacao.cmm.am.gov.br/health

# 4. Testar subdomínios
curl -I http://grafana.cmm.am.gov.br
curl -I http://prometheus.cmm.am.gov.br
```

## ESTRUTURA DE ACESSO

### Domínio Principal
- `http://automacao.cmm.am.gov.br` → Dashboard React
- `http://automacao.cmm.am.gov.br/grafana/` → Container Grafana
- `http://automacao.cmm.am.gov.br/grafanacore` → Página React do Grafana
- `http://automacao.cmm.am.gov.br/prometheus/` → Container Prometheus
- `http://automacao.cmm.am.gov.br/prometheuscore` → Página React do Prometheus

### Subdomínios (Acesso Direto)
- `https://grafana.cmm.am.gov.br` → Container Grafana
- `https://prometheus.cmm.am.gov.br` → Container Prometheus
- `https://n8n.cmm.am.gov.br` → Container N8N
- `https://chatwoot.cmm.am.gov.br` → Container Chatwoot
- `https://whatsapp.cmm.am.gov.br` → Container WhatsApp
- `https://rabbitmq.cmm.am.gov.br` → Interface RabbitMQ
- `https://redis.cmm.am.gov.br` → Interface Redis

## DEPLOYMENT AUTOMÁTICO

Use os scripts criados para deployment automático:

### Windows PowerShell
```powershell
.\deploy.ps1
```

### Linux/Bash
```bash
chmod +x deploy.sh
./deploy.sh
```

## TROUBLESHOOTING COMUM

### 1. Container Nginx não inicia
```bash
# Verificar logs de erro
docker-compose logs nginx

# Testar configuração
docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf nginx:1.28.0 nginx -t
```

### 2. Erro 502 Bad Gateway
```bash
# Verificar se os containers estão rodando
docker-compose ps

# Restart containers específicos
docker-compose restart grafana prometheus
```

### 3. Certificados SSL
```bash
# Verificar certificados no container
docker exec nginx openssl x509 -in /etc/ssl/certs/server.crt -text -noout
```

### 4. DNS não resolve
- Verificar configuração no Windows Server DNS
- Confirmar que todos os subdomínios estão apontando para 172.18.1.32

## PRÓXIMOS PASSOS

1. Execute o deployment: `.\deploy.ps1`
2. Teste o acesso: `http://automacao.cmm.am.gov.br`
3. Configure certificados SSL válidos se necessário
4. Teste todos os subdomínios
5. Verifique se os botões "Acessar" funcionam corretamente