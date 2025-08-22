#!/bin/bash

# Script completo para debugar o problema do Grafana
echo "=== Debugando o problema do Grafana ==="

echo "1. Verificando se o container do Grafana está em execução..."
docker ps | grep grafana

echo ""
echo "2. Verificando logs do Grafana (últimas 50 linhas)..."
docker logs grafana | tail -50

echo ""
echo "3. Verificando variáveis de ambiente do Grafana..."
docker exec grafana env | grep GF_

echo ""
echo "4. Testando conectividade direta com o Grafana na porta 4000..."
docker exec grafana wget -q -O - http://localhost:4000/api/health || echo "Falha ao conectar ao Grafana internamente"

echo ""
echo "5. Verificando status do Prometheus (dependência do Grafana)..."
docker ps | grep prometheus
docker logs prometheus | tail -10

echo ""
echo "6. Testando conectividade entre Grafana e Prometheus..."
docker exec grafana wget -q -O - http://prometheus:9090/-/healthy || echo "Falha ao conectar ao Prometheus"

echo ""
echo "7. Verificando permissões do volume do Grafana..."
docker exec grafana ls -la /var/lib/grafana/

echo ""
echo "8. Testando acesso via Nginx..."
curl -I http://localhost/grafana/ 2>/dev/null || echo "Falha ao acessar via Nginx"

echo ""
echo "=== Fim do debug ==="