#!/bin/bash

# Script de inicialização do Nginx para CMM Automação
# Este script deve ser executado no servidor 172.18.1.32

echo "=========================================="
echo "INICIALIZANDO NGINX - CMM AUTOMACAO"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado."
    echo "Execute este script na pasta raiz do projeto."
    exit 1
fi

# Parar containers existentes
echo "🔄 Parando containers existentes..."
docker-compose down nginx

# Reconstruir imagem do Nginx
echo "🔧 Reconstruindo imagem do Nginx..."
docker-compose build --no-cache nginx

# Iniciar apenas o Nginx
echo "🚀 Iniciando Nginx..."
docker-compose up -d nginx

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar status
echo "🔍 Verificando status do Nginx..."
docker-compose ps nginx

# Verificar logs
echo "📊 Últimas linhas de log do Nginx:"
docker-compose logs --tail=20 nginx

echo ""
echo "✅ Nginx reinicializado com sucesso!"
echo ""
echo "Teste os endpoints:"
echo "• HTTP:  curl -I http://localhost:80/health"
echo "• HTTPS: curl -I https://localhost:443/health (se certificados estiverem configurados)"
echo "• Admin: curl -I http://localhost:8080/health"