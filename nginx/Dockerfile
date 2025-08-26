# ===========================================
# NGINX DOCKERFILE - CMM AUTOMACAO PLATFORM
# Version: 2.1
# Base: nginx:1.28.0
# ===========================================

# Base image oficial nginx
FROM nginx:1.28.0

# Labels para identificação
LABEL maintainer="CMM-AM DevOps Team" \
      description="Nginx Reverse Proxy for CMM Automacao Platform" \
      version="2.1" \
      org.opencontainers.image.title="CMM Nginx Proxy" \
      org.opencontainers.image.description="High-performance nginx reverse proxy" \
      org.opencontainers.image.vendor="Câmara Municipal de Manaus"

# Variáveis de ambiente
ENV NGINX_VERSION=1.28.0 \
    TZ=America/Manaus \
    LANG=pt_BR.UTF-8 \
    LANGUAGE=pt_BR:pt:en \
    LC_ALL=pt_BR.UTF-8

# Instalar dependências essenciais
RUN apt-get update && apt-get install -y \
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
    dnsutils \
    # Editor para debug
    nano \
    # Compressão
    gzip \
    # Limpeza
    && rm -rf /var/lib/apt/lists/* \
    # Timezone
    && ln -sf /usr/share/zoneinfo/America/Manaus /etc/localtime \
    && echo "America/Manaus" > /etc/timezone

# Criar estrutura de diretórios
RUN mkdir -p \
    /etc/ssl/certs \
    /etc/ssl/private \
    /tmp/ssl \
    /var/cache/nginx \
    /var/log/nginx \
    /etc/nginx/conf.d \
    /usr/local/bin \
    /var/www/html \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /tmp/ssl \
    && chmod 755 /etc/ssl/certs /etc/ssl/private

# Copiar configuração principal
COPY nginx.conf /etc/nginx/nginx.conf

# Script de inicialização SSL
COPY <<'EOF' /docker-entrypoint.d/90-setup-ssl.sh
#!/bin/sh
set -e

echo "[SSL Setup] Iniciando configuração SSL..."

# Verificar se já foi executado para evitar loops
if [ -f "/tmp/.ssl-setup-completed" ]; then
    echo "[SSL Setup] Configuração SSL já foi executada anteriormente."
    exit 0
fi

# Função para verificar certificados existentes
check_existing_certs() {
    if [ -f "/etc/ssl/certs/server.crt" ] && [ -f "/etc/ssl/certs/server.key" ]; then
        echo "[SSL Setup] Certificados SSL encontrados. Verificando validade..."
        
        # Verificar se o certificado não expirou
        if openssl x509 -checkend 86400 -noout -in /etc/ssl/certs/server.crt >/dev/null 2>&1; then
            echo "[SSL Setup] Certificados SSL válidos e não expirados."
            return 0
        else
            echo "[SSL Setup] Certificados SSL expirados ou inválidos."
            return 1
        fi
    else
        echo "[SSL Setup] Certificados SSL não encontrados."
        return 1
    fi
}

# Verificar certificados existentes (montados via volume)
if check_existing_certs; then
    echo "[SSL Setup] Usando certificados existentes."
else
    echo "[SSL Setup] Certificados não encontrados ou inválidos. Verificando volumes montados..."
    
    # Verificar se certificados estão montados via volume do docker-compose
    if [ -f "/tmp/ssl/server.crt" ] && [ -f "/tmp/ssl/server.key" ]; then
        echo "[SSL Setup] Encontrados certificados no volume temporário. Copiando..."
        cp /tmp/ssl/server.crt /etc/ssl/certs/server.crt
        cp /tmp/ssl/server.key /etc/ssl/certs/server.key
        echo "[SSL Setup] Certificados copiados com sucesso."
    else
        echo "[SSL Setup] Nenhum certificado encontrado. Usando configuração sem SSL."
    fi
fi

# Configurar permissões de segurança
if [ -f "/etc/ssl/certs/server.crt" ] && [ -f "/etc/ssl/certs/server.key" ]; then
    chmod 644 /etc/ssl/certs/server.crt
    chmod 600 /etc/ssl/certs/server.key
    chown root:root /etc/ssl/certs/server.crt /etc/ssl/certs/server.key
    echo "[SSL Setup] Permissões configuradas."
fi

# Marcar como concluído para evitar loops
touch /tmp/.ssl-setup-completed

echo "[SSL Setup] Configuração SSL concluída com sucesso."
EOF

# Script de health check
COPY <<'EOF' /usr/local/bin/nginx-healthcheck.sh
#!/bin/sh
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

HEALTH_CHECK_URL="http://localhost:80/health"
TIMEOUT=10

echo "[Health Check] Iniciando verificação de saúde do nginx..."

# Verificar se o processo nginx está rodando
if ! pgrep nginx > /dev/null 2>&1; then
    echo "${RED}[Health Check] ❌ Processo nginx não está rodando${NC}"
    exit 1
fi

# Verificar portas principais
for port in 80 443 8080; do
    if netstat -tln | grep ":$port " > /dev/null 2>&1; then
        echo "${GREEN}[Health Check] ✅ Porta $port está em uso${NC}"
    else
        echo "${YELLOW}[Health Check] ⚠️  Porta $port não está em uso${NC}"
    fi
done

# Teste HTTP básico (se a porta 80 estiver disponível)
if netstat -tln | grep ":80 " > /dev/null 2>&1; then
    if curl -f -s --max-time $TIMEOUT "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        echo "${GREEN}[Health Check] ✅ Endpoint HTTP respondendo${NC}"
    else
        echo "${RED}[Health Check] ❌ Endpoint HTTP não respondendo${NC}"
        exit 1
    fi
fi

# Verificar configuração nginx
if nginx -t > /dev/null 2>&1; then
    echo "${GREEN}[Health Check] ✅ Configuração nginx válida${NC}"
else
    echo "${RED}[Health Check] ❌ Configuração nginx inválida${NC}"
    exit 1
fi

# Verificar certificados SSL se existirem
if [ -f "/etc/ssl/certs/server.crt" ] && [ -f "/etc/ssl/certs/server.key" ]; then
    if openssl x509 -checkend 86400 -noout -in /etc/ssl/certs/server.crt >/dev/null 2>&1; then
        echo "${GREEN}[Health Check] ✅ Certificados SSL válidos${NC}"
    else
        echo "${YELLOW}[Health Check] ⚠️  Certificados SSL próximos do vencimento${NC}"
    fi
else
    echo "${YELLOW}[Health Check] ⚠️  Certificados SSL não encontrados${NC}"
fi

echo "${GREEN}[Health Check] ✅ Verificações concluídas${NC}"
exit 0
EOF

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

# Tornar scripts executáveis
RUN chmod +x /docker-entrypoint.d/90-setup-ssl.sh \
    && chmod +x /usr/local/bin/nginx-healthcheck.sh

# Expor portas
EXPOSE 80 443 8080

# Definir diretório de trabalho
WORKDIR /etc/nginx

# Health check interno do container
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /usr/local/bin/nginx-healthcheck.sh

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]