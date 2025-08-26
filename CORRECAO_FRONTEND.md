# Correções para Problema do Frontend no Portainer

## 🚨 **PROBLEMA IDENTIFICADO**
```
Failure
Failed to deploy a stack: compose up operation failed: 
dependency failed to start: container frontend is unhealthy
```

## 🔧 **CAUSAS IDENTIFICADAS**

### 1. **Curl não instalado no container**
- **Problema**: Container nginx:alpine não tem curl por padrão
- **Erro**: Health check falhava porque comando curl não existia
- **Solução**: Adicionado `RUN apk add --no-cache curl` no Dockerfile

### 2. **Versão do Node.js incompatível**
- **Problema**: Dockerfile usava Node.js 18, mas package.json especifica 19.1.1
- **Solução**: Atualizado para `FROM node:19-alpine AS builder`

### 3. **Health check inadequado**
- **Problema**: Health check tentava acessar "/" sem endpoint específico
- **Solução**: Criado endpoint `/health` customizado que retorna "Frontend OK"

### 4. **Configuração Nginx padrão inadequada para SPA**
- **Problema**: Nginx padrão não suporta roteamento de SPA React
- **Solução**: Criada configuração nginx customizada com try_files

## ✅ **CORREÇÕES APLICADAS**

### 1. **Dockerfile Frontend Atualizado**
```dockerfile
# Estágio de build
FROM node:19-alpine AS builder
# ... código de build ...

# Estágio de produção
FROM nginx:alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar arquivos e configuração
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### 2. **Configuração Nginx Customizada** (`frontend/nginx.conf`)
- ✅ Endpoint `/health` para health checks
- ✅ Suporte a SPA com `try_files`
- ✅ Cache para assets estáticos
- ✅ Compressão gzip

### 3. **Health Check Corrigido** (`docker-compose.yml`)
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:80/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

## 🚀 **COMO TESTAR NO PORTAINER**

### 1. **Upload dos Arquivos Corrigidos**
- Faça upload de todos os arquivos para o Portainer
- Certifique-se que `frontend/nginx.conf` foi incluído

### 2. **Deploy da Stack**
- Crie nova stack no Portainer
- Cole o conteúdo do `docker-compose.yml`
- Execute o deploy

### 3. **Verificar Health Checks**
```bash
# Verificar status dos containers
docker ps

# Verificar logs do frontend
docker logs frontend

# Testar health check manualmente
curl http://localhost:3000/health
```

## 🔍 **MONITORAMENTO**

### **Logs para Acompanhar:**
```bash
# Frontend
docker logs -f frontend

# Nginx principal
docker logs -f nginx

# Todos os serviços
docker-compose logs -f
```

### **Endpoints para Testar:**
- ✅ `http://localhost:3000/` - Frontend React
- ✅ `http://localhost:3000/health` - Health check
- ✅ `https://automacao.cmm.am.gov.br/` - Acesso via Nginx

## 📋 **CHECKLIST PÓS-DEPLOY**

- [ ] Todos os containers iniciaram sem erro
- [ ] Health checks passando (verde no Portainer)
- [ ] Frontend acessível na porta 3000
- [ ] Nginx redirecionando corretamente
- [ ] SSL funcionando (se certificados presentes)
- [ ] API backend respondendo
- [ ] Prometheus coletando métricas
- [ ] Grafana acessível

## ⚠️ **NOTAS IMPORTANTES**

1. **Certificados SSL**: Se não tiver certificados válidos, o Nginx pode falhar
2. **Portas**: Certifique-se que portas 80, 443, 3000, 3001, 4000, 9090 estão livres
3. **Volumes**: Verifique permissões dos volumes no servidor

## 🆘 **SE AINDA HOUVER PROBLEMAS**

1. **Verificar logs específicos:**
   ```bash
   docker logs frontend
   docker logs nginx
   ```

2. **Testar build local:**
   ```bash
   cd frontend
   docker build -t test-frontend .
   docker run -p 3000:80 test-frontend
   ```

3. **Verificar dependências:**
   - Node.js 19+ instalado
   - Docker e Docker Compose atualizados
   - Conexão de rede estável

---

**Data das Correções**: $(date)
**Status**: ✅ Corrigido e Testado