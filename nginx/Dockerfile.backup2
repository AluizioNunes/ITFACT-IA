FROM nginx:1.28.0

# Instalar curl e openssl para health checks e certificados
RUN apt-get update && \
    apt-get install -y curl openssl && \
    rm -rf /var/lib/apt/lists/*

# Copiar arquivo de configuração
COPY nginx.conf /etc/nginx/nginx.conf

# Script para criar certificados auto-assinados se não existirem
RUN mkdir -p /etc/ssl/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/certs/server.key \
    -out /etc/ssl/certs/server.crt \
    -subj "/C=BR/ST=AM/L=Manaus/O=CMM/OU=IT/CN=automacao.cmm.am.gov.br"

# Script de inicialização
COPY <<EOF /docker-entrypoint.d/90-setup-ssl.sh
#!/bin/bash
echo "Verificando certificados SSL..."
if [ ! -f "/etc/ssl/certs/server.crt" ] || [ ! -f "/etc/ssl/certs/server.key" ]; then
    echo "Certificados SSL não encontrados. Criando certificados auto-assinados..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/certs/server.key \
        -out /etc/ssl/certs/server.crt \
        -subj "/C=BR/ST=AM/L=Manaus/O=CMM/OU=IT/CN=automacao.cmm.am.gov.br"
    echo "Certificados auto-assinados criados."
else
    echo "Certificados SSL encontrados."
fi
EOF

RUN chmod +x /docker-entrypoint.d/90-setup-ssl.sh

# Expor portas
EXPOSE 80 443 8081

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]