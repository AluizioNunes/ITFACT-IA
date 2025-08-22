FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json primeiro
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar todos os arquivos do projeto
COPY . .

# Construir a aplicação
RUN npm run build

# Criar diretório de saída
RUN mkdir -p /dist

# Copiar arquivos construídos para o diretório de saída
RUN cp -r dist/* /dist/

# Comando para manter o container rodando
CMD ["sh", "-c", "echo 'Frontend build completed' && tail -f /dev/null"]