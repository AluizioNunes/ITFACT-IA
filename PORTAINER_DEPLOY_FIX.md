# Guia GitOps com Portainer + GitHub Actions

Este repositório está preparado para re-deploy automático no Portainer, sem passos manuais. O fluxo usa webhook do Portainer acionado por GitHub Actions.

## Visão Geral
- Stack: `automacao` (docker-compose.yml na raiz deste repositório)
- Portainer: habilitar GitOps com Webhook no stack
- GitHub Actions: workflow `.github/workflows/portainer-redeploy.yml` aciona o webhook em `push` para `main`
- Montagens por diretório (configs): Alertmanager, Promtail, Blackbox, Tempo e Postgres-Exporter

## Passo a Passo

### 1) Habilitar Webhook no Portainer
1. Acesse `Portainer → Stacks → automacao → Settings`.
2. Ative “Webhook” e copie a URL gerada (formato `http(s)://<host>/api/webhooks/<uuid>`).

### 2) Definir o secret no GitHub
1. No repositório → `Settings → Secrets and variables → Actions → New repository secret`.
2. Nome: `PORTAINER_WEBHOOK_URL`.
3. Valor: cole a URL do webhook copiada do Portainer.

### 3) Workflow de re-deploy
- Arquivo: `.github/workflows/portainer-redeploy.yml`.
- Disparo: `push` em `main` quando mudar `docker-compose.yml`, `Backend/**` ou `PORTAINER_DEPLOY_FIX.md`.
- Ação: valida sintaxe YAML do compose e invoca `POST` no webhook do Portainer.

### 4) Montagens resilientes (sem manual)
- Alertmanager: `./Backend/alertmanager:/etc/alertmanager:ro` + `--config.file=/etc/alertmanager/alertmanager.yml`
- Promtail: `./Backend/promtail:/etc/promtail:ro` + `-config.file=/etc/promtail/config.yml`
- Blackbox: `./Backend/blackbox:/etc/blackbox_exporter:ro` + `--config.file=/etc/blackbox_exporter/config.yml`
- Tempo: `./Backend/tempo:/etc/tempo:ro` + `-config.file=/etc/tempo/tempo.yaml`
- Postgres Exporter: `./Backend/postgresql:/etc/postgres-exporter:ro` + `--extend.query-path=/etc/postgres-exporter/postgres_exporter.yml`

Essas mudanças evitam erros de “arquivo vs diretório” durante deploy no Portainer.

## Verificações Pós-Deploy (automáticas, sem ação manual)
- Prometheus targets: `http://<host>:9090/api/v1/targets`
- Regras carregadas: `http://<host>:9090/api/v1/rules`
- Alertmanager health: `http://<host>:9093/-/healthy`
- Exporter /metrics: `http://<host>:9187/metrics`

## Opcional: Fallback via API (sem webhook)
Se preferir usar API Token do Portainer em vez de Webhook:
- Secrets adicionais:
  - `PORTAINER_URL` (ex.: `http://localhost:9000`)
  - `PORTAINER_STACK_ID` (ID do stack `automacao`)
  - `PORTAINER_TOKEN` (API token de um usuário com permissão)
- Ajuste o workflow para chamar:
  - `POST $PORTAINER_URL/api/stacks/{id}/git/redeploy?endpointId=<endpoint>`

> Observação: o webhook é a rota recomendada por simplicidade e segurança (URL única e sem payload sensível).

## Troubleshooting
- “Are you trying to mount a directory onto a file…”
  - Resolvido com mounts por diretório (já aplicado neste repositório).
- “out of bounds” em scrapes
  - Alinhe TZ/horário nos containers (ideal `UTC`).
- Promtail sem config
  - O mount agora é de diretório; confirme que `config.yml` está em `Backend/promtail`.

## Fluxo Operacional
- Você só faz `commit + push` → GitHub Actions valida e chama o Portainer → Portainer re-deploya o stack automaticamente.
- Não há nenhuma etapa manual no servidor ou Portainer após configurado o webhook e o secret no GitHub.