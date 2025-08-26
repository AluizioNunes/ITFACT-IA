# GUIA DE CORREÇÃO E TESTE - SERVIDOR REMOTO 172.18.1.32

## 🚀 **PASSOS PARA CORRIGIR**

### 1. **Conectar ao Servidor Remoto**
```bash
ssh usuario@172.18.1.32
cd /caminho/para/automacao
```

### 2. **Verificar Status Atual**
```bash
# Ver containers rodando
docker ps

# Ver containers com problema
docker ps -a

# Ver logs do nginx especificamente
docker logs nginx
```

### 3. **Fazer Upload dos Arquivos Corrigidos**
- Faça upload dos arquivos corrigidos:
  - `nginx/nginx.conf` (corrigido)
  - `nginx/Dockerfile` (corrigido)
  - `docker-compose.yml` (corrigido)

### 4. **Reiniciar os Serviços**
```bash
# Parar todos os containers
docker-compose down

# Reconstruir apenas o nginx (que foi modificado)
docker-compose build --no-cache nginx

# Subir todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

### 5. **Testar os Serviços**

#### **a) Testes Diretos (que já funcionam):**
```bash
# Frontend (deve continuar funcionando)
curl http://172.18.1.32:3000/

# Grafana (deve continuar funcionando)
curl http://172.18.1.32:4000/

# Testar Prometheus (deve começar a funcionar)
curl http://172.18.1.32:9090/

# Testar Backend API
curl http://172.18.1.32:3001/health
```

#### **b) Testes via Nginx (proxy reverso - deve começar a funcionar):**
```bash
# Nginx direto
curl http://172.18.1.32:80/health

# Grafana via proxy
curl http://172.18.1.32:80/grafana/

# Prometheus via proxy
curl http://172.18.1.32:80/prometheus/

# API via proxy
curl http://172.18.1.32:80/api/health

# Frontend via proxy
curl http://172.18.1.32:80/
```

#### **c) Testes via DNS (se configurado):**
```bash
# Verificar se DNS resolve
nslookup automacao.cmm.am.gov.br

# Se resolver, testar:
curl http://automacao.cmm.am.gov.br/health
curl http://automacao.cmm.am.gov.br/grafana/
curl http://automacao.cmm.am.gov.br/prometheus/
```

## 🔧 **PRINCIPAIS CORREÇÕES APLICADAS**

### 1. **Nginx HTTP habilitado**
- **Antes**: Forçava redirect para HTTPS (que falhava sem certificados)
- **Depois**: Permite acesso HTTP direto nas portas 80

### 2. **Roteamento proxy corrigido**
- **Antes**: Não funcionava por causa do redirect forçado
- **Depois**: Proxy reverso funcionando para `/grafana/`, `/prometheus/`, `/api/`

### 3. **Health checks corrigidos**
- **Antes**: Endpoints incorretos causavam falhas
- **Depois**: Endpoints específicos `/health` em cada serviço

### 4. **Curl instalado**
- **Antes**: Container nginx sem curl para health checks
- **Depois**: Curl instalado para health checks funcionarem

## 🎯 **RESULTADOS ESPERADOS**

Após aplicar as correções, você deve conseguir acessar:

### **✅ Do seu computador local:**
- `http://172.18.1.32:80/` - Frontend via proxy
- `http://172.18.1.32:80/grafana/` - Grafana via proxy
- `http://172.18.1.32:80/prometheus/` - Prometheus via proxy
- `http://172.18.1.32:80/api/health` - API via proxy

### **✅ Se DNS configurado:**
- `http://automacao.cmm.am.gov.br/` - Frontend
- `http://automacao.cmm.am.gov.br/grafana/` - Grafana
- `http://automacao.cmm.am.gov.br/prometheus/` - Prometheus

## 🚨 **SE AINDA NÃO FUNCIONAR**

Execute o script de diagnóstico:
```bash
chmod +x diagnostico.sh
./diagnostico.sh
```

E me envie a saída para análise detalhada.

## 📝 **NOTAS IMPORTANTES**

1. **DNS**: O domínio `automacao.cmm.am.gov.br` precisa apontar para `172.18.1.32`
2. **Certificados**: Para HTTPS, ainda precisa dos certificados em `/opt/docker/certificados/`
3. **Firewall**: Certifique-se que portas 80, 443, 3000, 3001, 4000, 9090 estão abertas
4. **Prometheus**: Se ainda não funcionar na 9090, pode ser problema de permissões de usuário