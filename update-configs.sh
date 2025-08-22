#!/bin/bash

# Script para atualizar as configurações dos serviços sem reiniciar tudo

echo "Atualizando configurações dos serviços..."

# Atualizar configuração do Nginx
echo "Atualizando configuração do Nginx..."
docker cp nginx/nginx.conf nginx:/etc/nginx/nginx.conf
docker exec nginx nginx -s reload

# Atualizar configuração do Prometheus
echo "Atualizando configuração do Prometheus..."
docker cp prometheus/prometheus.yml prometheus:/etc/prometheus/prometheus.yml
docker exec prometheus kill -HUP 1

# Atualizar configuração do Grafana
echo "Atualizando configuração do Grafana..."
docker cp grafana/provisioning prometheus:/etc/grafana/provisioning
docker exec grafana sh -c "cd /usr/share/grafana && grafana-cli admin reload-plugins"

echo "Configurações atualizadas com sucesso!"

# Reiniciar serviços se necessário
echo "Se precisar reiniciar algum serviço, use:"
echo "docker-compose restart <nome-do-serviço>"