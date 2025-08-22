# Estágio de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências primeiro para melhorar o cache
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Instalar dependências
RUN npm ci

# Copiar o restante do código
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar os arquivos de build para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração personalizada do Nginx (opcional)
# COPY nginx-custom.conf /etc/nginx/conf.d/default.conf

# Expor a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
