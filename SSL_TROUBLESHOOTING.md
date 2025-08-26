# SSL Container Restart Loop - RESOLVIDO

## Problema Identificado
O container nginx estava em loop infinito de reinicialização devido a erros no script SSL:

```
chmod: changing permissions of '/etc/ssl/certs/server.crt': Read-only file system
```

## Causa Raiz
1. **Filesystem Read-Only**: Os certificados SSL estão montados como volumes read-only (`ro`) no docker-compose.yml
2. **Script SSL Problemático**: O script tentava modificar permissões (`chmod`/`chown`) em certificados montados como read-only
3. **Loop Infinito**: O script não tinha proteção contra múltiplas execuções

## Solução Implementada

### 1. Script SSL Melhorado (`/docker-entrypoint.d/90-setup-ssl.sh`)
- ✅ **Proteção contra loops**: Arquivo de controle `/tmp/.ssl-setup-completed`
- ✅ **Detecção read-only**: Testa se pode escrever antes de tentar modificar
- ✅ **Fallback inteligente**: Se certificados existem e são válidos, usa eles mesmo que read-only
- ✅ **Geração automática**: Cria certificados auto-assinados se necessário
- ✅ **Tratamento de erros**: Não falha se não conseguir alterar permissões

### 2. Melhorias no Dockerfile
- ✅ **Estrutura de diretórios**: Cria `/tmp/ssl` para operações temporárias
- ✅ **Permissões corretas**: Define permissões adequadas durante o build

## Como Deployar a Correção

### No seu servidor remoto, execute:

```bash
# 1. Parar containers
docker-compose down

# 2. Baixar correções
git pull

# 3. Rebuild apenas nginx (forçar rebuild)
docker-compose build --no-cache nginx

# 4. Subir todos os serviços
docker-compose up -d

# 5. Verificar status
docker-compose ps
docker logs nginx
```

## Verificação de Funcionamento

### 1. Container nginx deve estar "Up" sem restart loops:
```bash
docker-compose ps nginx
```

### 2. Portas devem estar publicadas:
- **80** (HTTP)
- **443** (HTTPS) 
- **8080** (Admin)

### 3. Logs devem mostrar inicialização bem-sucedida:
```bash
docker logs nginx
```

Deve ver:
```
[SSL Setup] Configuração SSL concluída com sucesso.
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## Teste de Acesso

Após deployment, teste:

```bash
# Teste HTTP
curl -I http://172.18.1.32

# Teste HTTPS (ignore certificado auto-assinado)
curl -I -k https://172.18.1.32

# Teste porta admin
curl -I http://172.18.1.32:8080
```

## Status dos Certificados

### Certificados Externos (Recomendado)
- **Localização**: `/opt/docker/certificados/`
- **Arquivos**: `cmm_am_gov_br_inter.crt` e `cmm_am_gov_br.key`
- **Montagem**: Read-only no container

### Certificados Auto-assinados (Fallback)
- **Quando usados**: Se certificados externos não existem ou são inválidos
- **Localização**: Gerados em `/tmp/ssl/` e copiados para `/etc/ssl/certs/`
- **Validade**: 10 anos
- **Domínios incluídos**: 
  - `automacao.cmm.am.gov.br`
  - `grafana.cmm.am.gov.br`
  - `*.cmm.am.gov.br`

## URLs de Acesso Final

Após correção, o sistema estará disponível em:

- **🌐 Sistema Principal**: https://automacao.cmm.am.gov.br (ou https://172.18.1.32)
- **📊 Grafana**: https://automacao.cmm.am.gov.br/grafana/
- **📝 API Docs**: https://automacao.cmm.am.gov.br/api/docs
- **⚙️ Admin**: http://172.18.1.32:8080

---
*Correção aplicada em: $(date)*
*Commit: 4ab837d*