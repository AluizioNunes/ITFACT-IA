#!/bin/bash

# Script para debugar o problema do Grafana
echo "=== Debugando o problema do Grafana ==="

echo "1. Verificando se o container do Grafana está em execução..."
docker ps | grep grafana

echo "2. Verificando logs do Grafana..."
docker logs grafana | tail -20

echo "3. Verificando se o Nginx está em execução..."
docker ps | grep nginx

echo "4. Verificando logs do Nginx..."
docker logs nginx | tail -20

echo "5. Testando conectividade entre Nginx e Grafana..."
docker exec nginx wget -q -O - http://grafana:3000/api/health

echo "6. Verificando configuração do Nginx..."
docker exec nginx cat /etc/nginx/nginx.conf

echo "=== Fim do debug ==="