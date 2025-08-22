# Correções de Build - Docker Compose

## Data: 2025-01-22

### 🔧 **PROBLEMAS DE BUILD CORRIGIDOS!**

## Erros Identificados e Corrigidos

### 1. Prometheus - Versão Inexistente
- **Erro**: `prom/prometheus:3.5.0: not found`
- **Causa**: Versão 3.5.0 não existe no Docker Hub
- **Solução**: Alterado para `prom/prometheus:v3.4.1`
- **Arquivo**: `prometheus/Dockerfile`

### 2. Grafana - Contexto de Build Incorreto
- **Erro**: `"/provisioning": not found`
- **Causa**: Contexto de build apontando para diretório raiz
- **Solução**: Corrigido contexto para `./grafana`
- **Arquivo**: `docker-compose.yml`

## Contextos de Build Corrigidos

### ✅ **Contextos Corretos:**
- **Frontend**: `context: ./frontend`
- **Backend**: `context: ./api`
- **Prometheus**: `context: ./prometheus`
- **Grafana**: `context: ./grafana` ← **CORRIGIDO**
- **Nginx**: `context: ./nginx`

### ❌ **Contexto Incorreto (ANTES):**
```yaml
grafana:
  build:
    context: .                    # ❌ Diretório raiz
    dockerfile: grafana/Dockerfile
```

### ✅ **Contexto Correto (DEPOIS):**
```yaml
grafana:
  build:
    context: ./grafana            # ✅ Diretório específico
    dockerfile: Dockerfile
```

## Estrutura de Diretórios Correta

```
AUTOMACAO/
├── frontend/
│   ├── Dockerfile
│   └── provisioning/
├── api/
│   └── Dockerfile
├── prometheus/
│   ├── Dockerfile
│   └── prometheus.yml
├── grafana/
│   ├── Dockerfile
│   └── provisioning/
│       ├── dashboards/
│       └── datasources/
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

## Benefícios das Correções

- ✅ **Build do Prometheus** funcionará com versão válida
- ✅ **Build do Grafana** encontrará diretório provisioning
- ✅ **Contextos de build** corretos para todos os serviços
- ✅ **Estrutura de arquivos** organizada e funcional
- ✅ **Deploy no Portainer** deve funcionar sem erros

## Como Testar

1. **Faça upload** dos arquivos corrigidos
2. **Crie a stack** no Portainer
3. **Verifique logs** de build de cada serviço
4. **Confirme** que todos os containers iniciam

## Arquivos Corrigidos

1. `prometheus/Dockerfile` - Versão 3.4.1 ✅
2. `docker-compose.yml` - Contexto Grafana ✅
3. `VERSIONS.md` - Documentação atualizada ✅
4. `CHANGELOG.md` - Histórico de mudanças ✅
5. `BUILD_FIXES.md` - Este arquivo ✅ 