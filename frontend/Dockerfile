FROM node:24.6.0

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Criar diretório de saída
RUN mkdir -p /dist

# Copiar arquivos buildados
RUN cp -r dist/* /dist/

# Comando para manter container rodando
CMD ["sh", "-c", "echo 'Frontend ready!' && tail -f /dev/null"]