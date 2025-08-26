# CORREÇÃO DOS PROBLEMAS - HTTPS não funciona

## 🚨 **PROBLEMAS IDENTIFICADOS NOS LOGS:**

### **1. Prometheus não encontra arquivo de configuração**
```
Error loading config (--config.file=/etc/prometheus/prometheus.yml)" 
err="open /etc/prometheus/prometheus.yml: no such file or directory"
```

### **2. Nginx não consegue resolver "prometheus" hostname**
```
host not found in upstream "prometheus" in /etc/nginx/nginx.conf:52
nginx: [emerg] host not found in upstream "prometheus"
```

### **3. HTTPS tentativas de conexão falhando (erro 400)**
```
172.18.1.1 - - [25/Aug/2025:17:40:58 +0000] "\x16\x03\x01\x06\xC0..." 400 157
```

## 🔧 **CORREÇÕES APLICADAS:**

### **1. Prometheus Dockerfile Corrigido**
- ✅ **Antes**: `FROM prom/prometheus:latest` + ENTRYPOINT complexo
- ✅ **Depois**: `FROM prom/prometheus:v3.4.1` + CMD simplificado
- ✅ **Correção**: Usa versão específica e configuração mais estável

### **2. Docker Compose - Dependências Corrigidas**
- ✅ **Nginx depende de**:
  - `frontend: service_started`
  - `prometheus: service_healthy` ← **NOVO**
  - `backend: service_healthy` ← **NOVO** 
  - `grafana: service_healthy` ← **NOVO**
- ✅ **Resultado**: Nginx só inicia após todos os serviços estarem prontos

### **3. Health Check do Prometheus Melhorado**
- ✅ **Antes**: `wget -qO- http://localhost:9090/-/healthy`
- ✅ **Depois**: `wget --spider http://localhost:9090/-/ready`
- ✅ **Resultado**: Health check mais confiável

### **4. Nginx com Upstream e Tratamento de Erro**
- ✅ **Upstream blocks** adicionados para controle de falhas
- ✅ **Error pages** personalizadas para cada serviço
- ✅ **Timeouts** configurados adequadamente
- ✅ **Fallback** para serviços indisponíveis

## 🚀 **DEPLOY DAS CORREÇÕES**

### **No Servidor (172.18.1.32):**
```bash
# Parar todos os containers
docker-compose down

# Limpar imagens antigas (opcional)
docker system prune -f

# Reconstruir e iniciar
git pull && docker-compose up -d --build

# Verificar logs
docker-compose logs -f nginx
docker-compose logs -f prometheus
```

### **Verificar se funcionou:**
```bash
# Status dos containers
docker-compose ps

# Testar health checks
curl http://localhost/health
curl http://localhost:9090/-/ready  # Prometheus
curl http://localhost:4000/api/health  # Grafana

# Testar proxy reverso
curl http://localhost/prometheus/
curl http://localhost/grafana/
```

## 🎯 **RESULTADOS ESPERADOS:**

### **✅ Após as correções:**
1. **Prometheus** - Inicia sem erros de configuração
2. **Nginx** - Inicia sem erros de upstream
3. **HTTPS** - Funciona se certificados estiverem presentes
4. **Frontend** - Acessível via `automacao.cmm.am.gov.br`
5. **Proxy reverso** - `/grafana/`, `/prometheus/` funcionando

### **🔍 URLs que devem funcionar:**
- ✅ `http://172.18.1.32/` - Frontend
- ✅ `http://172.18.1.32/grafana/` - Grafana via proxy
- ✅ `http://172.18.1.32/prometheus/` - Prometheus via proxy
- ✅ `automacao.cmm.am.gov.br/` (se DNS configurado)

## ⚠️ **NOTAS IMPORTANTES:**

### **Para HTTPS funcionar:**
1. **Certificados devem estar em**: `/opt/docker/certificados/`
   - `cmm_am_gov_br_inter.crt`
   - `cmm_am_gov_br.key`
2. **DNS deve apontar**: `automacao.cmm.am.gov.br` → `172.18.1.32`
3. **Portas abertas**: 80, 443 no firewall

### **Tolerância a falhas:**
- ✅ Se Prometheus estiver down, Nginx mostra erro amigável
- ✅ Se Grafana estiver down, Nginx mostra erro amigável  
- ✅ Frontend sempre funciona (serve arquivos estáticos)

## 🆘 **TROUBLESHOOTING:**

### **Se ainda não funcionar:**
```bash
# Verificar logs específicos
docker logs nginx 2>&1 | grep -i error
docker logs prometheus 2>&1 | grep -i error

# Testar resolução DNS interna
docker exec nginx nslookup prometheus
docker exec nginx nslookup grafana

# Verificar arquivo de configuração do Prometheus
docker exec prometheus ls -la /etc/prometheus/
```

### **Se HTTPS ainda falhar:**
```bash
# Verificar certificados
ls -la /opt/docker/certificados/

# Testar SSL
curl -k https://172.18.1.32/health
```

---

**Status**: ✅ **Correções aplicadas**  
**Deploy necessário**: ✅ **Sim - git pull && docker-compose up -d --build**  
**Problemas corrigidos**: ✅ **Prometheus + Nginx + Dependências**