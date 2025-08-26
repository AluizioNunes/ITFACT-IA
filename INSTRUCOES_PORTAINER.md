# INSTRUÇÕES PARA RESOLVER ERRO NO PORTAINER

## 🚨 **ERRO ATUAL:**
```
Failed to deploy a stack: compose build operation failed: failed to solve: process "/bin/sh -c npm ci --only=production" did not complete successfully: exit code: 1
```

## 🔍 **CAUSA DO PROBLEMA:**
O Portainer está usando uma versão em cache do Dockerfile que contém `npm ci --only=production`

## ✅ **SOLUÇÃO IMPLEMENTADA:**

### 1. Dockerfiles Antigos Removidos
- ❌ `frontend/Dockerfile` - REMOVIDO
- ❌ `frontend/Dockerfile.simple` - REMOVIDO
- ❌ `frontend/Dockerfile.portainer` - REMOVIDO

### 2. Dockerfile Novo Criado
- ✅ `frontend/Dockerfile.new` - NOVO E LIMPO

### 3. Docker Compose Atualizado
- ✅ `docker-compose.yml` - Usa `Dockerfile.new`

## 🚀 **PASSOS PARA RESOLVER:**

### Passo 1: Limpar Cache do Portainer
1. **Vá no Portainer**
2. **Stacks** → **Sua Stack**
3. **Delete** a stack atual
4. **Images** → **Remove** todas as imagens relacionadas
5. **Volumes** → **Remove** volumes antigos (se necessário)

### Passo 2: Upload dos Arquivos
1. **Faça upload** de TODOS os arquivos corrigidos
2. **Certifique-se** que `Dockerfile.new` está na pasta `frontend/`
3. **Verifique** que `docker-compose.yml` está na raiz

### Passo 3: Criar Nova Stack
1. **Criar Stack** no Portainer
2. **Nome**: `automacao` (ou o nome que preferir)
3. **Upload** do `docker-compose.yml`
4. **Deploy** da stack

## 📁 **ESTRUTURA FINAL:**

```
AUTOMACAO/
├── frontend/
│   ├── Dockerfile.new          ← NOVO E LIMPO
│   ├── src/
│   ├── package.json
│   └── ...
├── api/
│   └── Dockerfile
├── prometheus/
│   └── Dockerfile
├── grafana/
│   └── Dockerfile
├── nginx/
│   └── Dockerfile
└── docker-compose.yml          ← ATUALIZADO
```

## 🔧 **Dockerfile.new (SOLUÇÃO):**

```dockerfile
FROM node:24.6.0
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
RUN mkdir -p /dist && cp -r dist/* /dist/
CMD ["sh", "-c", "echo 'Frontend ready!' && tail -f /dev/null"]
```

## ⚠️ **IMPORTANTE:**

- ✅ **NÃO use** Dockerfiles antigos
- ✅ **SEMPRE limpe** o cache do Portainer
- ✅ **Use APENAS** `Dockerfile.new`
- ✅ **Verifique** que todos os arquivos foram atualizados

## 🎯 **RESULTADO ESPERADO:**

**Após seguir esses passos, o Portainer deve funcionar sem erros!**

- ✅ **Build do frontend** bem-sucedido
- ✅ **Todos os serviços** funcionando
- ✅ **Sistema completo** operacional
- ✅ **Sem erros** de cache 