# Alteração de Rotas - Adição de "core" ao Final

## 🔄 **ALTERAÇÕES REALIZADAS**

### **Rotas Modificadas**
Todas as rotas foram alteradas para incluir "core" no final, **exceto o Dashboard**:

| **Antiga Rota** | **Nova Rota** | **Status** |
|-----------------|---------------|------------|
| `/dashboard` | `/dashboard` | ✅ **Inalterado** |
| `/prometheus` | `/prometheuscore` | ✅ **Alterado** |
| `/grafana` | `/grafanacore` | ✅ **Alterado** |
| `/nginx` | `/nginxcore` | ✅ **Alterado** |
| `/postgres` | `/postgrescore` | ✅ **Alterado** |
| `/docker` | `/dockercore` | ✅ **Alterado** |
| `/n8n` | `/n8ncore` | ✅ **Alterado** |
| `/evolutionapi` | `/evolutionapicore` | ✅ **Alterado** |
| `/chatwoot` | `/chatwootcore` | ✅ **Alterado** |
| `/whatsapp` | `/whatsappcore` | ✅ **Alterado** |
| `/redis` | `/rediscore` | ✅ **Alterado** |
| `/rabbitmq` | `/rabbitmqcore` | ✅ **Alterado** |

### **URLs Completas de Acesso**
Após o deploy, as URLs ficarão:

- ✅ `automacao.cmm.am.gov.br/dashboard` - Dashboard principal
- ✅ `automacao.cmm.am.gov.br/grafanacore` - Grafana
- ✅ `automacao.cmm.am.gov.br/prometheuscore` - Prometheus
- ✅ `automacao.cmm.am.gov.br/postgrescore` - PostgreSQL
- ✅ `automacao.cmm.am.gov.br/dockercore` - Docker
- ✅ `automacao.cmm.am.gov.br/nginxcore` - Nginx
- ✅ `automacao.cmm.am.gov.br/n8ncore` - N8N
- ✅ `automacao.cmm.am.gov.br/chatwootcore` - Chatwoot
- ✅ `automacao.cmm.am.gov.br/evolutionapicore` - Evolution API
- ✅ `automacao.cmm.am.gov.br/whatsappcore` - WhatsApp
- ✅ `automacao.cmm.am.gov.br/rediscore` - Redis
- ✅ `automacao.cmm.am.gov.br/rabbitmqcore` - RabbitMQ

## 📁 **ARQUIVOS MODIFICADOS**

### 1. **`frontend/src/App.tsx`**
- ✅ Atualizadas todas as rotas do React Router
- ✅ Dashboard mantido como `/dashboard`
- ✅ Todas as outras rotas com "core" no final

### 2. **`frontend/src/components/Sidebar.tsx`**
- ✅ Atualizado array `menuItems` com novos caminhos
- ✅ Modificada função `getSelectedKey()` para mapear corretamente
- ✅ Navegação funcionando para todas as novas rotas

### 3. **`nginx/nginx.conf`**
- ✅ **Nenhuma alteração necessária**
- ✅ Configuração `try_files` já suporta as novas rotas
- ✅ React Router lidera o roteamento interno

## 🚀 **DEPLOY AUTOMÁTICO VIA GIT**

### **Processo Simplificado (Sem Scripts Manuais):**
```bash
# No servidor remoto 172.18.1.32
ssh usuario@172.18.1.32
cd /caminho/para/automacao

# Deploy automático em um comando
git pull && docker-compose up -d --build
```

### **O que acontece automaticamente:**
- ✅ **Git pull** - Baixa últimas alterações do repositório
- ✅ **--build** - Força rebuild das imagens modificadas  
- ✅ **no_cache: true** - Frontend reconstruído completamente
- ✅ **Novas rotas** - Aplicadas automaticamente sem intervenção manual

### **2. Testar as Novas URLs**
```bash
# Dashboard (inalterado)
curl http://172.18.1.32/dashboard

# Novas rotas com 'core'
curl http://172.18.1.32/grafanacore
curl http://172.18.1.32/prometheuscore
curl http://172.18.1.32/whatsappcore

# Ou pelo DNS (se configurado)
curl http://automacao.cmm.am.gov.br/grafanacore
```

### **3. Verificar Navegação**
1. Acesse `http://172.18.1.32/` (redirecionará para `/dashboard`)
2. Clique nos itens do menu sidebar
3. Verifique se as URLs mudam para as novas rotas com "core"
4. Teste navegação direta digitando as URLs

## 🔍 **COMPORTAMENTO ESPERADO**

### **✅ Funcionamento Correto:**
1. **Homepage** (`/`) → Redireciona para `/dashboard`
2. **Menu Sidebar** → Navega para rotas com "core"
3. **URLs Diretas** → Funcionam corretamente
4. **Refresh da Página** → Mantém a rota atual
5. **404 Fallback** → Redireciona para `/dashboard`

### **🎯 Navegação do Usuário:**
- Usuário clica em "Grafana" → Vai para `/grafanacore`
- Usuário clica em "WhatsApp" → Vai para `/whatsappcore`
- Usuário digita URL direta → Funciona normalmente
- Dashboard sempre acessível em `/dashboard`

## 📝 **NOTAS IMPORTANTES**

1. **Compatibilidade**: URLs antigas não funcionarão mais
2. **Bookmarks**: Usuários precisarão atualizar favoritos
3. **Links Externos**: Atualize qualquer link externo para as novas URLs
4. **Nginx**: Não precisa de alteração, já suporta as novas rotas
5. **SEO**: Considere redirects 301 se necessário para SEO

## 🔄 **REVERSÃO (se necessária)**

Para voltar às rotas antigas, reverta os arquivos:
- `frontend/src/App.tsx`
- `frontend/src/components/Sidebar.tsx`

E refaça o build do frontend.

---

**Data da Alteração**: $(date)  
**Arquivos Modificados**: 2  
**Novas Rotas**: 11 (+ dashboard inalterado)  
**Status**: ✅ Pronto para Deploy