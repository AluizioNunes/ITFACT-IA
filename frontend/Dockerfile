FROM node:24.6.0

WORKDIR /app

# Copiar tudo de uma vez
COPY . .

# Instalar dependências
RUN npm install

# Build da aplicação
RUN npm run build

# Criar diretório de saída
RUN mkdir -p /dist

# Copiar arquivos buildados
RUN cp -r dist/* /dist/

# Comando simples
CMD ["sh", "-c", "echo 'Frontend ready!' && tail -f /dev/null"]