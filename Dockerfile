# Estágio de build
FROM node:22-bullseye AS builder

WORKDIR /app

# Copiar arquivos de dependências primeiro para melhorar o cache
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Build da aplicação
RUN npm run build

# Verificar se os arquivos foram gerados
RUN ls -la /app/dist

# Estágio de produção
FROM nginx:alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Criar diretório para os arquivos
RUN mkdir -p /usr/share/nginx/html

# Copiar os arquivos de build para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração nginx customizada (arquivo está em ./Backend/nginx.conf)
COPY ./Backend/nginx.conf /etc/nginx/conf.d/default.conf

# Verificar se os arquivos foram copiados corretamente
RUN ls -la /usr/share/nginx/html && echo "Arquivos copiados com sucesso"

# Verificar se o index.html existe
RUN if [ ! -f /usr/share/nginx/html/index.html ]; then echo "ERRO: index.html não encontrado" && exit 1; fi

# Expor a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
