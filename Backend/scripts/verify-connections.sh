#!/bin/bash

# Script para verificar conexões com os serviços

echo "=== Verificando conexões com os serviços ==="

# Verificar PostgreSQL
echo "1. Verificando PostgreSQL..."
docker exec -i postgresql pg_isready -U admin -d postgres
if [ $? -eq 0 ]; then
    echo "✓ PostgreSQL está acessível"
else
    echo "✗ PostgreSQL não está acessível"
fi

# Verificar bancos de dados
echo "2. Verificando bancos de dados..."
for db in postgres evolutionapi n8n chatwoot; do
    echo "Verificando banco $db:"
    docker exec -i postgresql psql -U admin -d postgres -c "SELECT datname FROM pg_database WHERE datname = '$db';" 2>/dev/null | grep $db
    if [ $? -eq 0 ]; then
        echo "✓ Banco $db existe"
    else
        echo "✗ Banco $db não encontrado"
    fi
done

# Verificar N8N
echo "3. Verificando N8N..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/healthz
if [ $? -eq 0 ]; then
    echo "✓ N8N está respondendo"
else
    echo "✗ N8N não está respondendo"
fi

# Verificar Chatwoot
echo "4. Verificando Chatwoot..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health
if [ $? -eq 0 ]; then
    echo "✓ Chatwoot está respondendo"
else
    echo "✗ Chatwoot não está respondendo"
fi

# Verificar Evolution API
echo "5. Verificando Evolution API..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/health
if [ $? -eq 0 ]; then
    echo "✓ Evolution API está respondendo"
else
    echo "✗ Evolution API não está respondendo"
fi

echo "=== Fim da verificação ==="