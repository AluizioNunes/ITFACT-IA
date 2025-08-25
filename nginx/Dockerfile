FROM nginx:1.28.0

# Instalar curl para health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copiar arquivo de configuração
COPY nginx.conf /etc/nginx/nginx.conf

# Expor portas
EXPOSE 80 443

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]