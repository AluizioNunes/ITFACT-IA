# ===========================================
# NGINX DOCKERFILE - CMM AUTOMACAO PLATFORM
# Version: 2.3
# Base: nginx:1.28.0
# ===========================================

# Base image oficial nginx
FROM nginx:alpine

# Instalar openssl para certificados
RUN apk add --no-cache openssl

# Criar diretórios necessários
RUN mkdir -p /var/log/nginx /etc/ssl/certs

# Copiar configuração personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Script para gerar certificados auto-assinados se necessário
RUN cat > /docker-entrypoint.d/90-ssl-setup.sh << 'EOF'
#!/bin/sh
set -e

# Verificar se já foi executado para evitar loops
if [ -f "/tmp/.ssl-setup-completed" ]; then
    echo "[SSL Setup] Já executado anteriormente."
    exit 0
fi

echo "[SSL Setup] Verificando certificados SSL..."

# Verificar se certificados existem
if [ ! -f "/etc/ssl/certs/server.crt" ] || [ ! -f "/etc/ssl/certs/server.key" ]; then
    echo "[SSL Setup] Certificados não encontrados. Gerando auto-assinados..."
    
    # Gerar certificados auto-assinados
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/certs/server.key \
        -out /etc/ssl/certs/server.crt \
        -subj "/C=BR/ST=AM/L=Manaus/O=CMM/CN=automacao.cmm.am.gov.br"
    
    echo "[SSL Setup] Certificados auto-assinados criados."
else
    echo "[SSL Setup] Certificados SSL encontrados."
fi

# Tentar definir permissões (ignorar se read-only)
chmod 644 /etc/ssl/certs/server.crt 2>/dev/null || echo "[SSL Setup] Aviso: Não foi possível alterar permissões (read-only filesystem)"
chmod 600 /etc/ssl/certs/server.key 2>/dev/null || echo "[SSL Setup] Aviso: Não foi possível alterar permissões (read-only filesystem)"

# Marcar como concluído para evitar loops
touch /tmp/.ssl-setup-completed

echo "[SSL Setup] Configuração SSL concluída."
EOF

# Tornar script executável
RUN chmod +x /docker-entrypoint.d/90-ssl-setup.sh

# Expor portas
EXPOSE 80 443 8080

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]