FROM node:18-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache git

WORKDIR /app

# Copiar package.json e package-lock.json primeiro
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para o build)
RUN npm ci --verbose

# Copiar todos os arquivos do projeto
COPY . .

# Verificar se os arquivos foram copiados corretamente
RUN ls -la

# Construir a aplicação com tratamento de erro
RUN npm run build || (echo "Build failed" && exit 1)

# Verificar se o build foi bem-sucedido
RUN ls -la dist/

# Criar diretório de saída
RUN mkdir -p /dist

# Copiar arquivos construídos para o diretório de saída
RUN cp -r dist/* /dist/

# Verificar se os arquivos foram copiados
RUN ls -la /dist/

# Limpar dependências de desenvolvimento para reduzir tamanho da imagem
RUN npm prune --production

# Comando para manter o container rodando
CMD ["sh", "-c", "echo 'Frontend build completed successfully!' && tail -f /dev/null"]