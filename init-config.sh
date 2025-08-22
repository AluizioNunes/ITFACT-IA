#!/bin/bash

# Script de inicialização para copiar arquivos de configuração
echo "Copiando arquivos de configuração..."

# Copiar arquivos de configuração do Prometheus
docker cp prometheus.yml prometheus:/etc/prometheus/prometheus.yml

echo "Arquivos de configuração copiados com sucesso!"