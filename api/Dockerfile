FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar arquivos do projeto
COPY . .

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["node", "server.js"]