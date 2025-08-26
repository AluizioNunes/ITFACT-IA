#!/bin/bash
# SCRIPT DE BUILD - ALTERAÇÕES DE ROTAS COM "CORE"
# Execute este script no servidor 172.18.1.32

echo "🚀 APLICANDO ALTERAÇÕES DE ROTAS COM 'CORE'"
echo "============================================="
echo "Data: $(date)"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ ERRO: docker-compose.yml não encontrado!"
    echo "Execute este script no diretório raiz do projeto AUTOMACAO"
    exit 1
fi

echo "✅ Diretório correto encontrado"
echo ""

echo "🔍 1. VERIFICANDO STATUS ATUAL DOS CONTAINERS"
echo "--------------------------------------------"
docker-compose ps
echo ""

echo "🛑 2. PARANDO CONTAINER FRONTEND"
echo "--------------------------------"
docker-compose stop frontend
echo ""

echo "🏗️ 3. RECONSTRUINDO FRONTEND COM NOVAS ROTAS"
echo "--------------------------------------------"
echo "Removendo imagem antiga do frontend..."
docker rmi automacao_frontend 2>/dev/null || echo "Imagem não existe ainda"

echo "Construindo nova imagem do frontend..."
docker-compose build --no-cache frontend

if [ $? -eq 0 ]; then
    echo "✅ Build do frontend concluído com sucesso!"
else
    echo "❌ ERRO no build do frontend!"
    exit 1
fi
echo ""

echo "🚀 4. REINICIANDO SERVIÇOS"
echo "--------------------------"
docker-compose up -d

echo "Aguardando containers iniciarem..."
sleep 10
echo ""

echo "🔍 5. VERIFICANDO STATUS FINAL"
echo "------------------------------"
docker-compose ps
echo ""

echo "🧪 6. TESTANDO NOVAS ROTAS"
echo "-------------------------"
echo "Testando dashboard (inalterado):"
curl -s -o /dev/null -w "Dashboard: HTTP %{http_code}\n" http://localhost/dashboard || echo "❌ Dashboard falhou"

echo "Testando health check:"
curl -s -o /dev/null -w "Health: HTTP %{http_code}\n" http://localhost/health || echo "❌ Health check falhou"

echo "Testando frontend root:"
curl -s -o /dev/null -w "Root: HTTP %{http_code}\n" http://localhost/ || echo "❌ Root falhou"

echo ""
echo "🎯 7. NOVAS URLs DISPONÍVEIS"
echo "----------------------------"
IP=$(hostname -I | awk '{print $1}')
echo "Acesse as novas rotas em:"
echo "• Dashboard: http://$IP/dashboard"
echo "• Grafana: http://$IP/grafanacore"
echo "• Prometheus: http://$IP/prometheuscore"
echo "• PostgreSQL: http://$IP/postgrescore"
echo "• Docker: http://$IP/dockercore"
echo "• Nginx: http://$IP/nginxcore"
echo "• N8N: http://$IP/n8ncore"
echo "• Chatwoot: http://$IP/chatwootcore"
echo "• Evolution API: http://$IP/evolutionapicore"
echo "• WhatsApp: http://$IP/whatsappcore"
echo "• Redis: http://$IP/rediscore"
echo "• RabbitMQ: http://$IP/rabbitmqcore"
echo ""

echo "📋 8. LOGS RECENTES DO FRONTEND"
echo "-------------------------------"
echo "Últimas 10 linhas do log do frontend:"
docker logs frontend --tail 10
echo ""

echo "✅ DEPLOY DAS NOVAS ROTAS CONCLUÍDO!"
echo "===================================="
echo ""
echo "🔗 Para testar do seu computador local:"
echo "http://172.18.1.32/grafanacore"
echo "http://172.18.1.32/whatsappcore"
echo ""
echo "📝 Consulte ALTERACAO_ROTAS_CORE.md para detalhes completos"