#!/bin/sh
# Script de entrypoint personalizado para verificar certificados SSL

set -e

echo "[Custom Entrypoint] Iniciando verificação dos certificados SSL..."

# Verificar se os certificados existem e são válidos
if [ -f "/etc/ssl/certs/server.crt" ] && [ -f "/etc/ssl/certs/server.key" ]; then
    echo "[Custom Entrypoint] Certificados SSL encontrados."
    
    # Verificar validade dos certificados
    if openssl x509 -checkend 86400 -noout -in /etc/ssl/certs/server.crt >/dev/null 2>&1; then
        echo "[Custom Entrypoint] Certificados SSL válidos. Mantendo configuração HTTPS."
    else
        echo "[Custom Entrypoint] Certificados SSL expirados ou inválidos. Removendo configuração HTTPS."
        rm -f /etc/nginx/conf.d/https.conf
    fi
else
    echo "[Custom Entrypoint] Certificados SSL não encontrados. Removendo configuração HTTPS."
    rm -f /etc/nginx/conf.d/https.conf
fi

echo "[Custom Entrypoint] Verificação concluída. Iniciando nginx..."

# Executar o entrypoint padrão do nginx
exec /docker-entrypoint.sh "$@"