# Deploy Automático via Git - Sem Scripts Manuais

## 🚀 **CONFIGURAÇÃO APLICADA**

### **Modificações no `docker-compose.yml`:**
- ✅ Adicionado `no_cache: true` no frontend
- ✅ Forçará rebuild completo a cada deploy
- ✅ Garantirá que mudanças no código sejam aplicadas

### **Como Funciona:**
Agora, sempre que você fizer um deploy via git, o Docker Compose automaticamente:
1. Detectará mudanças nos arquivos do frontend
2. Reconstruirá a imagem do frontend do zero (sem cache)
3. Aplicará as novas rotas automaticamente

## 📋 **PROCESSO DE DEPLOY VIA GIT**

### **1. No Seu Computador Local:**
```bash
# Fazer suas modificações nos arquivos
# Commit das alterações
git add .
git commit -m "Alterações nas rotas com 'core'"
git push origin main
```

### **2. No Servidor Remoto (172.18.1.32):**
```bash
# Conectar ao servidor
ssh usuario@172.18.1.32
cd /caminho/para/automacao

# Puxar as alterações do git
git pull origin main

# Deploy automático (reconstruirá frontend automaticamente)
docker-compose up -d --build

# Opcional: Ver logs para confirmar
docker-compose logs -f frontend
```

## ⚡ **COMANDO ÚNICO DE DEPLOY**

No servidor, você precisará executar apenas:
```bash
git pull && docker-compose up -d --build
```

### **O que acontece automaticamente:**
1. ✅ **Git pull** - Baixa últimas alterações
2. ✅ **--build** - Força rebuild das imagens modificadas
3. ✅ **no_cache: true** - Garante rebuild completo do frontend
4. ✅ **up -d** - Sobe os containers em background

## 🎯 **VERIFICAÇÃO AUTOMÁTICA**

Após o deploy, as novas rotas estarão automaticamente disponíveis:

- ✅ `http://172.18.1.32/dashboard` (inalterado)
- ✅ `http://172.18.1.32/grafanacore` (nova)
- ✅ `http://172.18.1.32/whatsappcore` (nova)
- ✅ `http://automacao.cmm.am.gov.br/grafanacore` (se DNS configurado)

## 🔄 **FLUXO DE TRABALHO SIMPLIFICADO**

### **Desenvolvimento Local:**
1. Modifique arquivos React/frontend
2. `git add . && git commit -m "mensagem"`
3. `git push origin main`

### **Deploy Servidor:**
1. `ssh usuario@172.18.1.32`
2. `cd /caminho/para/automacao`
3. `git pull && docker-compose up -d --build`
4. ✅ **Pronto!** Alterações aplicadas automaticamente

## 📊 **MONITORAMENTO DO DEPLOY**

Para acompanhar o deploy em tempo real:
```bash
# Ver todos os containers
docker-compose ps

# Logs do frontend durante rebuild
docker-compose logs -f frontend

# Verificar se aplicação respondeu
curl http://localhost/health
```

## ⚠️ **NOTAS IMPORTANTES**

### **Vantagens:**
- ✅ **Zero scripts manuais** - Apenas git + docker-compose
- ✅ **Rebuild automático** - Detecta mudanças automaticamente
- ✅ **Sem cache** - Sempre aplica últimas mudanças
- ✅ **Processo único** - Um comando faz tudo

### **Considerações:**
- 🔄 **Tempo de build**: Frontend será reconstruído a cada deploy (1-3 minutos)
- 📦 **Consumo**: Rebuild completo usa mais recursos
- 🔒 **Confiabilidade**: Garante que mudanças sejam sempre aplicadas

## 🆘 **TROUBLESHOOTING**

### **Se o deploy não aplicar mudanças:**
```bash
# Forçar rebuild completo
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### **Se containers não subirem:**
```bash
# Ver logs de erro
docker-compose logs frontend
docker-compose logs nginx

# Verificar status
docker-compose ps
```

### **Se rotas não funcionarem:**
```bash
# Testar diretamente
curl http://localhost/grafanacore
curl http://localhost/dashboard

# Ver configuração nginx
docker exec nginx cat /etc/nginx/conf.d/default.conf
```

## 🎉 **RESULTADO FINAL**

Agora você tem um **processo de deploy totalmente automatizado**:

1. **Modifica código** → Commit → Push
2. **No servidor** → `git pull && docker-compose up -d --build`  
3. **✅ Aplicação atualizada** com novas rotas funcionando!

---

**Configuração**: ✅ Aplicada  
**Scripts manuais**: ❌ Eliminados  
**Deploy automático**: ✅ Funcional  
**Rotas com 'core'**: ✅ Implementadas