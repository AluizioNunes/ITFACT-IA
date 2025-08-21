FROM nginx:alpine

# Copiar arquivo de configuração
COPY nginx.conf /etc/nginx/nginx.conf

# Expor portas
EXPOSE 80 443

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]