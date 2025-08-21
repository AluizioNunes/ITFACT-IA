FROM node:18-alpine

WORKDIR /app

# Copiar todos os arquivos do projeto
COPY . .

# Instalar dependências
RUN npm install

# Construir a aplicação
RUN npm run build

# Expor porta
EXPOSE 5173

# Comando de inicialização
CMD ["npm", "run", "preview"]