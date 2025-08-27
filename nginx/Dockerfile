# ===========================================
# NGINX DOCKERFILE - CMM AUTOMACAO PLATFORM
# Version: 2.3
# Base: nginx:1.28.0
# ===========================================

# Base image oficial nginx
FROM nginx:alpine

# Copiar configuração personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Criar diretórios necessários
RUN mkdir -p /var/log/nginx

# Expor portas
EXPOSE 80 8080

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]