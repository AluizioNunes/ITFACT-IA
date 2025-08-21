#!/bin/sh

# Script de inicialização automática
echo "Iniciando ambiente de automação..."

# Criar diretórios necessários
mkdir -p /usr/share/AUTOMACAO/grafana/provisioning/dashboards
mkdir -p /usr/share/AUTOMACAO/grafana/provisioning/datasources

# Copiar arquivos de configuração
cp -r /app/* /usr/share/AUTOMACAO/

echo "Ambiente configurado com sucesso!"