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
SRC_DIR="/etc/ssl/cmm"

if [ -f "$SSL_SETUP_FLAG" ]; then
  echo "[SSL Setup] SSL setup already completed"
  exit 0
fi

echo "[SSL Setup] Starting SSL configuration..."
mkdir -p "$(dirname "$CERT")"

use_external=false
if [ -d "$SRC_DIR" ]; then
  if [ -f "$SRC_DIR/fullchain.pem" ] && [ -f "$SRC_DIR/privkey.pem" ]; then
    cp "$SRC_DIR/fullchain.pem" "$CERT"
    cp "$SRC_DIR/privkey.pem" "$KEY"
    use_external=true
    echo "[SSL Setup] Using external fullchain.pem and privkey.pem"
  elif [ -f "$SRC_DIR/cmm_am_gov_br_inter.crt" ] && [ -f "$SRC_DIR/cmm_am_gov_br.key" ]; then
    if grep -q "BEGIN CERTIFICATE" "$SRC_DIR/cmm_am_gov_br_inter.crt" >/dev/null 2>&1; then
      cp "$SRC_DIR/cmm_am_gov_br_inter.crt" "$CERT"
      echo "[SSL Setup] Using external PEM certificate cmm_am_gov_br_inter.crt"
    else
      echo "[SSL Setup] Converting DER certificate to PEM"
      openssl x509 -inform DER -in "$SRC_DIR/cmm_am_gov_br_inter.crt" -out "$CERT"
    fi
    cp "$SRC_DIR/cmm_am_gov_br.key" "$KEY"
    use_external=true
  elif [ -f "$SRC_DIR/cmm_am_gov_br.crt" ] && [ -f "$SRC_DIR/cmm_am_gov_br.key" ]; then
    if grep -q "BEGIN CERTIFICATE" "$SRC_DIR/cmm_am_gov_br.crt" >/dev/null 2>&1; then
      cp "$SRC_DIR/cmm_am_gov_br.crt" "$CERT"
    else
      echo "[SSL Setup] Converting DER certificate to PEM"
      openssl x509 -inform DER -in "$SRC_DIR/cmm_am_gov_br.crt" -out "$CERT"
    fi
    cp "$SRC_DIR/cmm_am_gov_br.key" "$KEY"
    use_external=true
  fi
fi

if [ "$use_external" = true ]; then
  chmod 644 "$CERT" || true
  chmod 600 "$KEY" || true
  if openssl x509 -in "$CERT" -noout >/dev/null 2>&1; then
    echo "[SSL Setup] External certificate installed"
    date > "$SSL_SETUP_FLAG"
    exit 0
  else
    echo "[SSL Setup] External certificate invalid; falling back to self-signed"
  fi
fi

echo "[SSL Setup] Generating self-signed certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$KEY" -out "$CERT" -subj "/C=BR/ST=AM/L=Manaus/O=CMM/OU=TI/CN=automacao.cmm.am.gov.br"
chmod 644 "$CERT" || true
chmod 600 "$KEY" || true
date > "$SSL_SETUP_FLAG"
echo "[SSL Setup] SSL configuration completed"
EOF

RUN chmod +x /docker-entrypoint.d/90-setup-ssl.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Expose ports
EXPOSE 80 443 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]