#!/bin/bash
# DIAGNÓSTICO DOS CONTAINERS - AUTOMACAO
# Execute este script no servidor 172.18.1.32

echo "================== DIAGNÓSTICO AUTOMACAO =================="
echo "Data: $(date)"
echo "Servidor: $(hostname) - $(hostname -I)"
echo ""

echo "🔍 1. STATUS DOS CONTAINERS:"
echo "----------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "🔍 2. CONTAINERS COM PROBLEMAS:"
echo "----------------------------------------"
docker ps -a --filter "status=exited" --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}"
echo ""

echo "🔍 3. HEALTH CHECKS:"
echo "----------------------------------------"
echo "Frontend (port 3000):"
curl -s -o /dev/null -w "HTTP %{http_code} - Tempo: %{time_total}s\n" http://localhost:3000/health || echo "❌ FALHOU"

echo "Grafana (port 4000):"
curl -s -o /dev/null -w "HTTP %{http_code} - Tempo: %{time_total}s\n" http://localhost:4000/api/health || echo "❌ FALHOU"

echo "Prometheus (port 9090):"
curl -s -o /dev/null -w "HTTP %{http_code} - Tempo: %{time_total}s\n" http://localhost:9090/-/healthy || echo "❌ FALHOU"

echo "Backend API (port 3001):"
curl -s -o /dev/null -w "HTTP %{http_code} - Tempo: %{time_total}s\n" http://localhost:3001/health || echo "❌ FALHOU"

echo "Nginx (port 80):"
curl -s -o /dev/null -w "HTTP %{http_code} - Tempo: %{time_total}s\n" http://localhost:80/health || echo "❌ FALHOU"

echo "Nginx HTTPS (port 443):"
curl -s -k -o /dev/null -w "HTTP %{http_code} - Tempo: %{time_total}s\n" https://localhost:443/health || echo "❌ FALHOU"
echo ""

echo "🔍 4. PORTAS EM USO:"
echo "----------------------------------------"
netstat -tulpn | grep -E ':(80|443|3000|3001|4000|9090)' | head -10
echo ""

echo "🔍 5. LOGS DOS PRINCIPAIS CONTAINERS:"
echo "----------------------------------------"
echo "=== NGINX LOGS (últimas 5 linhas) ==="
docker logs nginx --tail 5 2>/dev/null || echo "❌ Container nginx não encontrado"
echo ""

echo "=== PROMETHEUS LOGS (últimas 5 linhas) ==="
docker logs prometheus --tail 5 2>/dev/null || echo "❌ Container prometheus não encontrado"
echo ""

echo "=== FRONTEND LOGS (últimas 5 linhas) ==="
docker logs frontend --tail 5 2>/dev/null || echo "❌ Container frontend não encontrado"
echo ""

echo "🔍 6. VOLUMES E REDES:"
echo "----------------------------------------"
echo "=== REDES DOCKER ==="
docker network ls | grep cmm

echo "=== VOLUMES ==="
docker volume ls | grep -E "(postgres|prometheus|grafana|frontend)"
echo ""

echo "🔍 7. CERTIFICADOS SSL:"
echo "----------------------------------------"
if [ -d "/opt/docker/certificados" ]; then
    echo "✅ Diretório de certificados existe:"
    ls -la /opt/docker/certificados/
else
    echo "❌ Diretório de certificados NÃO existe: /opt/docker/certificados"
fi
echo ""

echo "🔍 8. TESTE DNS:"
echo "----------------------------------------"
echo "Resolvendo automacao.cmm.am.gov.br:"
nslookup automacao.cmm.am.gov.br || echo "❌ DNS não resolve"
echo ""

echo "🔍 9. ARQUIVO DOCKER-COMPOSE:"
echo "----------------------------------------"
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml encontrado"
    echo "Serviços definidos:"
    grep -E "^  [a-zA-Z]" docker-compose.yml | sed 's/:$//' | sed 's/^  /- /'
else
    echo "❌ docker-compose.yml NÃO encontrado no diretório atual"
    echo "Diretório atual: $(pwd)"
fi
echo ""

echo "================== FIM DO DIAGNÓSTICO =================="