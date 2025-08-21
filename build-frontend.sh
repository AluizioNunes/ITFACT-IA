#!/bin/bash

# Script para construir e implantar o frontend

echo "Construindo o frontend..."

# Navegar para o diretório do frontend
cd /usr/share/AUTOMACAO/frontend

# Instalar dependências
npm install

# Construir a aplicação
npm run build

# Copiar os arquivos construídos para o diretório compartilhado
cp -r dist/* /usr/share/nginx/html/

echo "Frontend construído e implantado com sucesso!"