#!/bin/bash

# Script de deployment automático para AUTOMACAO
# Este script deve ser executado no servidor 172.18.1.32

echo "=========================================="
echo "INÍCIO DO DEPLOYMENT AUTOMAÇÃO CMM"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado. Execute este script na pasta do projeto."
    exit 1
fi

echo "🔄 Parando containers existentes..."
docker-compose down

echo "🔄 Fazendo pull das atualizações do git..."
git pull origin main

echo "🔧 Removendo imagens antigas para forçar rebuild..."
docker-compose build --no-cache nginx frontend

echo "🚀 Iniciando containers atualizados..."
docker-compose up -d --build

echo "⏳ Aguardando containers iniciarem..."
sleep 30

echo "🔍 Verificando status dos containers..."
docker-compose ps

echo ""
echo "🌐 Testando conectividade HTTP..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:80/health
curl -s -o /dev/null -w "HTTP Status IP: %{http_code}\n" http://172.18.1.32:80/health

echo ""
echo "📊 Logs do Nginx (últimas 20 linhas):"
docker-compose logs --tail=20 nginx

echo ""
echo "=========================================="
echo "DEPLOYMENT CONCLUÍDO!"
echo ""
echo "URLs para testar:"
echo "• HTTP: http://automacao.cmm.am.gov.br"
echo "• HTTP IP: http://172.18.1.32"
echo "• HTTPS: https://automacao.cmm.am.gov.br"
echo ""
echo "Subdomínios configurados:"
echo "• https://grafana.cmm.am.gov.br"
echo "• https://prometheus.cmm.am.gov.br"
echo "• https://n8n.cmm.am.gov.br"
echo "• https://chatwoot.cmm.am.gov.br"
echo "• https://whatsapp.cmm.am.gov.br"
echo "• https://rabbitmq.cmm.am.gov.br"
echo "• https://redis.cmm.am.gov.br"
echo "=========================================="