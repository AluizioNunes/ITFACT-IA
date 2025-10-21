# Nginx Reverse Proxy Dockerfile
FROM nginx:alpine

# Install openssl and curl
RUN apk add --no-cache openssl curl

# Prepare directories
RUN mkdir -p /etc/ssl/certs /etc/nginx/ssl

# Copy nginx configuration
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./conf.d/ /etc/nginx/conf.d/

# Create robust SSL setup script using heredoc (CRLF-safe) targeting /etc/nginx/ssl
RUN cat > /docker-entrypoint.d/90-setup-ssl.sh << 'EOF'
#!/bin/sh
set -e
SSL_SETUP_FLAG="/tmp/.ssl-setup-completed"
CERT="/etc/nginx/ssl/server.crt"
KEY="/etc/nginx/ssl/server.key"

if [ -f "$SSL_SETUP_FLAG" ]; then
  echo "[SSL Setup] SSL setup already completed"
  exit 0
fi

echo "[SSL Setup] Iniciando configuração SSL..."
if [ -f "$CERT" ] && [ -f "$KEY" ]; then
  if openssl x509 -in "$CERT" -noout -checkend 86400 >/dev/null 2>&1; then
    echo "[SSL Setup] Certificado existente válido"
    date > "$SSL_SETUP_FLAG"
    exit 0
  fi
fi

echo "[SSL Setup] Gerando certificados auto-assinados..."
mkdir -p "$(dirname "$CERT")"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY" \
  -out "$CERT" \
  -subj "/C=BR/ST=AM/L=Manaus/O=CMM/OU=TI/CN=automacao.cmm.am.gov.br"

chmod 644 "$CERT" || true
chmod 600 "$KEY" || true
date > "$SSL_SETUP_FLAG"
echo "[SSL Setup] Configuração SSL concluída"
EOF

RUN chmod +x /docker-entrypoint.d/90-setup-ssl.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Expose ports
EXPOSE 80 443 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]