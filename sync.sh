#!/bin/bash

# Script para sincronizar arquivos do projeto para /usr/share/AUTOMACAO/

echo "Sincronizando arquivos para /usr/share/AUTOMACAO/..."

# Copiar arquivos principais
sudo cp docker-compose.yml /usr/share/AUTOMACAO/
sudo cp nginx.conf /usr/share/AUTOMACAO/
sudo cp prometheus.yml /usr/share/AUTOMACAO/

# Copiar arquivos do Grafana
sudo cp grafana/provisioning/datasources/prometheus.yml /usr/share/AUTOMACAO/grafana/provisioning/datasources/
sudo cp grafana/provisioning/dashboards/default.yml /usr/share/AUTOMACAO/grafana/provisioning/dashboards/
sudo cp grafana/provisioning/dashboards/nginx_basic.json /usr/share/AUTOMACAO/grafana/provisioning/dashboards/
sudo cp grafana/provisioning/dashboards/nginx_advanced.json /usr/share/AUTOMACAO/grafana/provisioning/dashboards/

# Definir permissões adequadas
sudo chown -R root:root /usr/share/AUTOMACAO/
sudo chmod -R 755 /usr/share/AUTOMACAO/

echo "Sincronização concluída!"

# Opcional: Reiniciar os serviços afetados
# docker-compose down && docker-compose up -d

echo "Para aplicar as alterações, reimplante a stack no Portainer"