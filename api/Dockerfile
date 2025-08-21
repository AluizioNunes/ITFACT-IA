FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar arquivos do projeto
COPY . .

# Explicar variáveis de ambiente
ENV DOCKER_HOST=docker:2376
ENV POSTGRES_HOST=postgres
ENV POSTGRES_PORT=5432
ENV POSTGRES_USER=Admin
ENV POSTGRES_PASSWORD=Ricardo@1964
ENV POSTGRES_DB=postgres

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["node", "server.js"]