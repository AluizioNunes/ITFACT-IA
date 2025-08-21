#!/bin/bash

# Criar diretórios necessários
sudo mkdir -p /usr/share/AUTOMACAO/grafana/provisioning/dashboards
sudo mkdir -p /usr/share/AUTOMACAO/grafana/provisioning/datasources

# Copiar arquivos principais
sudo cp C:/AUTOMACAO/docker-compose.yml /usr/share/AUTOMACAO/
sudo cp C:/AUTOMACAO/nginx.conf /usr/share/AUTOMACAO/
sudo cp C:/AUTOMACAO/prometheus.yml /usr/share/AUTOMACAO/

# Copiar arquivos do Grafana
sudo cp C:/AUTOMACAO/grafana/provisioning/datasources/prometheus.yml /usr/share/AUTOMACAO/grafana/provisioning/datasources/
sudo cp C:/AUTOMACAO/grafana/provisioning/dashboards/default.yml /usr/share/AUTOMACAO/grafana/provisioning/dashboards/
sudo cp C:/AUTOMACAO/grafana/provisioning/dashboards/nginx_basic.json /usr/share/AUTOMACAO/grafana/provisioning/dashboards/
sudo cp C:/AUTOMACAO/grafana/provisioning/dashboards/nginx_advanced.json /usr/share/AUTOMACAO/grafana/provisioning/dashboards/

# Definir permissões adequadas
sudo chown -R root:root /usr/share/AUTOMACAO/
sudo chmod -R 755 /usr/share/AUTOMACAO/

echo "Arquivos copiados com sucesso para /usr/share/AUTOMACAO/"