FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar arquivos do projeto
COPY . .

# Expor porta
EXPOSE 5173

# Comando de inicialização
CMD ["npm", "run", "dev"]