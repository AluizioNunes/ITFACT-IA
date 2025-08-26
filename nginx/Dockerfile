# ===========================================
# NGINX DOCKERFILE - CMM AUTOMACAO PLATFORM
# Version: 2.0
# Base: nginx:1.28.0-alpine
# ===========================================

# Build arguments
ARG NGINX_VERSION=1.28.0
ARG BUILD_DATE
ARG VCS_REF

# Base image com Alpine para menor tamanho
FROM nginx:${NGINX_VERSION}-alpine

# Labels para identificação
LABEL maintainer="CMM-AM DevOps Team" \
      description="Nginx Reverse Proxy for CMM Automacao Platform" \
      version="2.0" \
      build-date="${BUILD_DATE}" \
      vcs-ref="${VCS_REF}" \
      org.opencontainers.image.title="CMM Nginx Proxy" \
      org.opencontainers.image.description="High-performance nginx reverse proxy" \
      org.opencontainers.image.vendor="Câmara Municipal de Manaus"

# Variáveis de ambiente
ENV NGINX_VERSION=${NGINX_VERSION} \
    TZ=America/Manaus \
    NGINX_USER=nginx \
    NGINX_GROUP=nginx \
    LANG=pt_BR.UTF-8 \
    LANGUAGE=pt_BR:pt:en \
    LC_ALL=pt_BR.UTF-8

# Instalar dependências essenciais
RUN apk add --no-cache \
    # Ferramentas básicas
    curl \
    wget \
    openssl \
    ca-certificates \
    tzdata \
    # Monitoramento
    htop \
    procps \
    # Logs e debug
    logrotate \
    # Utilitários de rede
    bind-tools \
    # Editor para debug
    nano \
    # Compressão
    gzip \
    # Timezone
    && cp /usr/share/zoneinfo/America/Manaus /etc/localtime \
    && echo "America/Manaus" > /etc/timezone \
    && rm -rf /var/cache/apk/*

# Criar estrutura de diretórios
RUN mkdir -p \
    /etc/ssl/certs \
    /etc/ssl/private \
    /var/cache/nginx \
    /var/log/nginx \
    /etc/nginx/conf.d \
    /etc/nginx/snippets \
    /usr/local/bin \
    /var/www/html \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx

# Copiar configuração principal
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar configurações adicionais
COPY conf.d/ /etc/nginx/conf.d/

# Script de inicialização SSL melhorado
COPY <<'EOF' /docker-entrypoint.d/90-setup-ssl.sh
#!/bin/sh
set -e

echo "[SSL Setup] Iniciando configuração SSL..."

# Função para gerar certificados auto-assinados
generate_self_signed() {
    echo "[SSL Setup] Gerando certificados auto-assinados..."
    
    # Criar chave privada
    openssl genrsa -out /etc/ssl/certs/server.key 4096
    
    # Criar certificado auto-assinado
    openssl req -new -x509 \
        -key /etc/ssl/certs/server.key \
        -out /etc/ssl/certs/server.crt \
        -days 3650 \
        -subj "/C=BR/ST=AM/L=Manaus/O=Camara Municipal de Manaus/OU=TI/CN=automacao.cmm.am.gov.br/emailAddress=ti@cmm.am.gov.br" \
        -extensions v3_ca \
        -config <(
            echo '[req]'
            echo 'distinguished_name = req_distinguished_name'
            echo '[req_distinguished_name]'
            echo '[v3_ca]'
            echo 'basicConstraints = CA:FALSE'
            echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
            echo 'subjectAltName = @alt_names'
            echo '[alt_names]'
            echo 'DNS.1 = automacao.cmm.am.gov.br'
            echo 'DNS.2 = grafana.cmm.am.gov.br'
            echo 'DNS.3 = *.cmm.am.gov.br'
            echo 'IP.1 = 172.18.1.32'
            echo 'IP.2 = 127.0.0.1'
        )
    
    echo "[SSL Setup] Certificados auto-assinados criados com sucesso."
}

# Verificar certificados existentes
if [ -f "/etc/ssl/certs/server.crt" ] && [ -f "/etc/ssl/certs/server.key" ]; then
    echo "[SSL Setup] Certificados SSL encontrados. Verificando validade..."
    
    # Verificar se o certificado não expirou
    if openssl x509 -checkend 86400 -noout -in /etc/ssl/certs/server.crt >/dev/null 2>&1; then
        echo "[SSL Setup] Certificados SSL válidos e não expirados."
    else
        echo "[SSL Setup] Certificado SSL expirado. Regenerando..."
        generate_self_signed
    fi
else
    echo "[SSL Setup] Certificados SSL não encontrados."
    generate_self_signed
fi

# Configurar permissões de segurança
chmod 644 /etc/ssl/certs/server.crt
chmod 600 /etc/ssl/certs/server.key
chown root:root /etc/ssl/certs/server.crt /etc/ssl/certs/server.key

echo "[SSL Setup] Configuração SSL concluída com sucesso."
EOF

# Script de health check avançado
COPY <<'EOF' /usr/local/bin/nginx-healthcheck.sh
#!/bin/sh
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

HEALTH_CHECK_URL="http://localhost:80/health"
STATUS_CHECK_URL="http://localhost:8081/status"
TIMEOUT=10

echo "[Health Check] Iniciando verificação de saúde do nginx..."

# Verificar se o processo nginx está rodando
if ! pgrep nginx > /dev/null 2>&1; then
    echo "${RED}[Health Check] ❌ Processo nginx não está rodando${NC}"
    exit 1
fi

# Verificar portas principais
for port in 80 443 8081; do
    if ! netstat -tln | grep ":$port " > /dev/null 2>&1; then
        echo "${RED}[Health Check] ❌ Porta $port não está em uso${NC}"
        exit 1
    fi
done

# Teste HTTP básico
if curl -f -s --max-time $TIMEOUT "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    echo "${GREEN}[Health Check] ✅ Endpoint HTTP respondendo${NC}"
else
    echo "${RED}[Health Check] ❌ Endpoint HTTP não respondendo${NC}"
    exit 1
fi

# Teste de status
if curl -f -s --max-time $TIMEOUT "$STATUS_CHECK_URL" > /dev/null 2>&1; then
    echo "${GREEN}[Health Check] ✅ Endpoint de status respondendo${NC}"
else
    echo "${YELLOW}[Health Check] ⚠️  Endpoint de status não respondendo (não crítico)${NC}"
fi

# Verificar configuração nginx
if nginx -t > /dev/null 2>&1; then
    echo "${GREEN}[Health Check] ✅ Configuração nginx válida${NC}"
else
    echo "${RED}[Health Check] ❌ Configuração nginx inválida${NC}"
    exit 1
fi

# Verificar certificados SSL
if [ -f "/etc/ssl/certs/server.crt" ] && [ -f "/etc/ssl/certs/server.key" ]; then
    if openssl x509 -checkend 86400 -noout -in /etc/ssl/certs/server.crt >/dev/null 2>&1; then
        echo "${GREEN}[Health Check] ✅ Certificados SSL válidos${NC}"
    else
        echo "${YELLOW}[Health Check] ⚠️  Certificados SSL próximos do vencimento${NC}"
    fi
else
    echo "${YELLOW}[Health Check] ⚠️  Certificados SSL não encontrados${NC}"
fi

echo "${GREEN}[Health Check] ✅ Todas as verificações passaram com sucesso${NC}"
exit 0
EOF

# Script de monitoramento de status
COPY <<'EOF' /usr/local/bin/nginx-status.sh
#!/bin/sh
set -e

echo "=== NGINX STATUS REPORT ==="
echo "Timestamp: $(date)"
echo "Nginx Version: $(nginx -v 2>&1)"
echo "PID: $(cat /var/run/nginx.pid 2>/dev/null || echo 'N/A')"
echo "Uptime: $(ps -o etime= -p $(cat /var/run/nginx.pid 2>/dev/null) 2>/dev/null || echo 'N/A')"
echo ""
echo "=== ACTIVE CONNECTIONS ==="
netstat -tln | grep -E ':(80|443|8081|8080) ' || echo "No active connections"
echo ""
echo "=== NGINX PROCESSES ==="
ps aux | grep nginx | grep -v grep || echo "No nginx processes"
echo ""
echo "=== RECENT LOG ENTRIES ==="
tail -n 5 /var/log/nginx/access.log 2>/dev/null || echo "No access logs"
echo ""
echo "=== ERROR LOG ==="
tail -n 3 /var/log/nginx/error.log 2>/dev/null || echo "No error logs"
echo "=== END REPORT ==="
EOF

# Script de backup de configuração
COPY <<'EOF' /usr/local/bin/nginx-backup-config.sh
#!/bin/sh
set -e

BACKUP_DIR="/var/backups/nginx"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "[Backup] Criando backup da configuração nginx..."
tar -czf "$BACKUP_DIR/nginx_config_$DATE.tar.gz" \
    /etc/nginx/nginx.conf \
    /etc/nginx/conf.d \
    /etc/ssl/certs/server.crt \
    /etc/ssl/certs/server.key 2>/dev/null || true

echo "[Backup] Backup criado: $BACKUP_DIR/nginx_config_$DATE.tar.gz"

# Manter apenas os últimos 5 backups
ls -t "$BACKUP_DIR"/nginx_config_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
EOF

# Tornar scripts executáveis
RUN chmod +x /docker-entrypoint.d/90-setup-ssl.sh \
    && chmod +x /usr/local/bin/nginx-healthcheck.sh \
    && chmod +x /usr/local/bin/nginx-status.sh \
    && chmod +x /usr/local/bin/nginx-backup-config.sh

# Criar arquivo de index padrão
COPY <<'EOF' /usr/share/nginx/html/index.html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMM Automação - Loading</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .spinner {
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 { margin: 0 0 1rem; font-size: 2rem; }
        p { margin: 0; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>CMM Automação</h1>
        <p>Carregando sistema...</p>
    </div>
</body>
</html>
EOF

# Página de health check
COPY <<'EOF' /usr/share/nginx/html/health
Nginx Health Check OK
Timestamp: $(date)
Server: $(hostname)
Version: nginx/1.28.0
Status: Active
EOF

# Configurar logrotate para nginx
COPY <<'EOF' /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
EOF

# Expor portas
EXPOSE 80 443 8081 8080

# Definir diretório de trabalho
WORKDIR /etc/nginx

# Health check interno do container
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /usr/local/bin/nginx-healthcheck.sh

# Usar usuário não-root para segurança (quando possível)
# USER nginx

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]