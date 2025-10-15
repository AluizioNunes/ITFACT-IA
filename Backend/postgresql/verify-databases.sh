#!/bin/bash

# Script para verificar se os bancos de dados foram criados corretamente
echo "Verificando bancos de dados..."

# Verificar conexão com PostgreSQL
echo "Testando conexão com PostgreSQL..."
pg_isready -U admin -d postgres -h localhost -p 5432

if [ $? -eq 0 ]; then
    echo "Conexão com PostgreSQL estabelecida com sucesso!"
    
    # Listar bancos de dados
    echo "Listando bancos de dados:"
    psql -U admin -d postgres -h localhost -p 5432 -c "\l"
    
    # Verificar bancos específicos
    echo "Verificando bancos de dados específicos:"
    for db in evolutionapi n8n chatwoot; do
        echo "Verificando banco $db:"
        psql -U admin -d postgres -h localhost -p 5432 -c "SELECT datname FROM pg_database WHERE datname = '$db';"
    done
    
    # Verificar schemas
    echo "Verificando schemas:"
    for db in evolutionapi n8n chatwoot; do
        echo "Schemas no banco $db:"
        psql -U admin -d $db -h localhost -p 5432 -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = '$db';"
    done
else
    echo "Falha na conexão com PostgreSQL!"
    exit 1
fi