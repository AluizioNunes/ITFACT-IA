# Solução para Erro de Deploy no Portainer

## Problema
```
Failed to pull images of the stack: compose pull operation failed: Error response from daemon: Head "https://registry-1.docker.io/v2/prometheuscommunity/postgres-exporter/manifests/latest": Get "https://auth.docker.io/token?scope=repository%3Aprometheuscommunity%2Fpostgres-exporter%3Apull&service=registry.docker.io": net/http: TLS handshake timeout
```

## Causa
O erro ocorre devido a timeouts de conectividade com o Docker Hub durante o pull das imagens, especialmente quando se usa tags `:latest`.

## 🔧 Soluções Implementadas

### 1. **Fixação de Versões de Imagens**
Alteramos as seguintes imagens de `:latest` para versões específicas:

| Serviço | Imagem Original | Imagem Atual |
|---------|----------------|-------------|
| postgres-exporter | `prometheuscommunity/postgres-exporter:latest` | `prometheuscommunity/postgres-exporter:v0.18.1` |
| python (FastAPI) | `python:3.11-slim` | `python:3.11.10-slim` |
| nginx-prometheus-exporter | `nginx/nginx-prometheus-exporter:latest` | `nginx/nginx-prometheus-exporter:1.5.1` |
| grafana | `grafana/grafana:latest` | `grafana/grafana:10.2.3` |
| tempo | `grafana/tempo:latest` | `grafana/tempo:2.3.1` |
| redis-exporter | `oliver006/redis_exporter:latest` | `oliver006/redis_exporter:v1.55.0` |
| rabbitmq-exporter | `kbudde/rabbitmq-exporter:latest` | `kbudde/rabbitmq-exporter:v1.0.0-RC7.1` |
| alertmanager | `prom/alertmanager:latest` | `prom/alertmanager:v0.26.0` |
| blackbox-exporter | `prom/blackbox-exporter:latest` | `prom/blackbox-exporter:v0.24.0` |
| loki | `grafana/loki:2.9.4` | `grafana/loki:2.9.8` |
| promtail | `grafana/promtail:2.9.4` | `grafana/promtail:2.9.7` |
| redis | `redis:latest` | `redis:7-alpine` |
| cadvisor | `gcr.io/cadvisor/cadvisor:latest` | `gcr.io/cadvisor/cadvisor:v0.47.0` |

### 2. ✅ Scripts de Pré-Pull
Criados scripts para fazer pull das imagens antes do deploy:

- **Linux/Mac**: `Backend/scripts/pre-pull-images.sh`
- **Windows**: `Backend/scripts/pre-pull-images.ps1`

## Como Resolver

### Opção 1: Deploy Direto (Recomendado)
1. Use o arquivo `docker-compose.yml` atualizado
2. As versões fixas devem resolver o problema de timeout
3. Tente o deploy novamente no Portainer

### Opção 2: Pré-Pull Manual
Se ainda houver problemas, execute o pré-pull das imagens:

**No Windows (PowerShell):**
```powershell
cd "d:\PROJETOS\AUTOMACAO"
.\Backend\scripts\pre-pull-images.ps1
```

**No Linux/Mac:**
```bash
cd /path/to/AUTOMACAO
chmod +x Backend/scripts/pre-pull-images.sh
./Backend/scripts/pre-pull-images.sh
```

### Opção 3: Pull Individual
Se uma imagem específica falhar, faça o pull manual:

```bash
docker pull prometheuscommunity/postgres-exporter:v0.18.1
docker pull python:3.11.10-slim
docker pull nginx/nginx-prometheus-exporter:1.5.1
docker pull grafana/grafana:10.2.3
docker pull grafana/tempo:2.3.1
docker pull oliver006/redis_exporter:v1.55.0
docker pull kbudde/rabbitmq-exporter:v1.0.0-RC7.1
docker pull prom/alertmanager:v0.26.0
docker pull prom/blackbox-exporter:v0.24.0
docker pull grafana/loki:2.9.8
docker pull grafana/promtail:2.9.7
docker pull redis:7-alpine
docker pull gcr.io/cadvisor/cadvisor:v0.47.0
```

### Opção 4: Configurar Registry Mirror
Para ambientes corporativos, configure um registry mirror:

1. Edite `/etc/docker/daemon.json` (Linux) ou Docker Desktop settings (Windows)
2. Adicione:
```json
{
  "registry-mirrors": ["https://your-mirror-url"]
}
```
3. Reinicie o Docker

## Verificação
Após aplicar as correções:

1. ✅ Verifique se o Docker está funcionando: `docker version`
2. ✅ Teste conectividade: `docker pull hello-world`
3. ✅ Execute o deploy no Portainer
4. ✅ Monitore os logs para verificar se todos os serviços subiram

## Imagens Atualizadas
| Serviço | Imagem Anterior | Imagem Atual |
|---------|----------------|--------------|
| postgres-exporter | `prometheuscommunity/postgres-exporter:latest` | `prometheuscommunity/postgres-exporter:v0.18.1` |
| redis | `redis:latest` | `redis:7-alpine` |
| cadvisor | `gcr.io/cadvisor/cadvisor:latest` | `gcr.io/cadvisor/cadvisor:v0.47.0` |

## Prevenção Futura
- ✅ Sempre use versões específicas em produção
- ✅ Teste pulls localmente antes do deploy
- ✅ Configure timeouts adequados no Portainer
- ✅ Monitore a conectividade com registries externos

## Suporte Adicional
Se o problema persistir:

1. Verifique logs do Docker: `docker system events`
2. Teste conectividade: `curl -I https://registry-1.docker.io/`
3. Verifique configurações de proxy/firewall
4. Considere usar um registry privado para imagens críticas