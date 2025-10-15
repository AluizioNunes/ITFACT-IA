# Nginx Reverse Proxy Dockerfile
FROM nginx:alpine

# Install openssl for SSL certificate generation
RUN apk add --no-cache openssl curl

# Create SSL directory
RUN mkdir -p /etc/ssl/certs

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Create SSL setup script
RUN cat > /docker-entrypoint.d/90-setup-ssl.sh << 'EOF'
#!/bin/sh

# Prevent infinite loops with completion flag
SSL_SETUP_FLAG="/tmp/.ssl-setup-completed"

if [ -f "$SSL_SETUP_FLAG" ]; then
    echo "[SSL Setup] SSL setup already completed"
    exit 0
fi

echo "[SSL Setup] Iniciando configuração SSL..."

# Check if external SSL certificates exist and are valid
if [ -f "/etc/ssl/certs/server.crt" ] && [ -f "/etc/ssl/certs/server.key" ]; then
    echo "[SSL Setup] Certificados SSL externos encontrados"
    
    # Test certificate validity
    if openssl x509 -in /etc/ssl/certs/server.crt -noout -checkend 86400 2>/dev/null; then
        echo "[SSL Setup] Certificados SSL válidos e não expirados"
        echo "$(date)" > "$SSL_SETUP_FLAG"
        exit 0
    else
        echo "[SSL Setup] Certificados SSL expirados ou inválidos, gerando auto-assinados..."
    fi
else
    echo "[SSL Setup] Certificados externos não encontrados, gerando auto-assinados..."
fi

# Generate self-signed certificates if needed
if [ ! -f "/etc/ssl/certs/server.crt" ] || [ ! -f "/etc/ssl/certs/server.key" ]; then
    echo "[SSL Setup] Gerando certificados auto-assinados..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/certs/server.key \
        -out /etc/ssl/certs/server.crt \
        -subj "/C=BR/ST=AM/L=Manaus/O=CMM/OU=TI/CN=automacao.cmm.am.gov.br"
    
    echo "[SSL Setup] Certificados auto-assinados gerados com sucesso"
fi

# Set permissions (ignore errors for read-only mounts)
chmod 644 /etc/ssl/certs/server.crt 2>/dev/null || true
chmod 600 /etc/ssl/certs/server.key 2>/dev/null || true

# Mark setup as completed
echo "$(date)" > "$SSL_SETUP_FLAG"
echo "[SSL Setup] Configuração SSL concluída"
EOF

# Make script executable
RUN chmod +x /docker-entrypoint.d/90-setup-ssl.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Expose ports
EXPOSE 80 443 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]