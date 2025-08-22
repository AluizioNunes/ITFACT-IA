FROM node:24.6.0

WORKDIR /app

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar dependências usando npm install ao invés de npm ci
RUN npm install --only=production

# Copiar arquivos do projeto
COPY . .

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["node", "server.js"]