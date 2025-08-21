# Ambiente Docker Compose com Nginx, PostgreSQL, Prometheus, Grafana e Frontend

Este ambiente inclui:
- Nginx como proxy reverso com certificados SSL
- PostgreSQL 17.6
- Prometheus para coleta de métricas
- Grafana com dashboards pré-configurados para Nginx
- Frontend React com Vite, TypeScript, Ant Design e Framer Motion
- API de automação para integração com serviços

## Como usar

1. Certifique-se de ter o Docker e o Docker Compose instalados
2. Execute o ambiente:
   ```bash
   docker-compose up -d
   ```

## Acesso aos serviços

- **Frontend (Painel de Controle)**: https://automacao.cmm.am.gov.br
- **Grafana**: https://automacao.cmm.am.gov.br/grafana
- **Prometheus**: https://automacao.cmm.am.gov.br/prometheus
- **API de Automação**: https://automacao.cmm.am.gov.br/api/

## Arquitetura

Todos os serviços são gerenciados automaticamente pelo Docker Compose:
- `nginx`: Proxy reverso e servidor web
- `frontend-builder`: Constrói e serve o frontend React
- `automation-api`: API para integração com PostgreSQL e outros serviços
- `prometheus`: Coleta de métricas
- `grafana`: Visualização de métricas
- `postgres`: Banco de dados

## Funcionalidades do Frontend

O frontend foi desenvolvido com:
- Vite como bundler
- React 18 com hooks
- TypeScript para tipagem
- Ant Design para componentes UI
- Framer Motion para animações
- React Router DOM para navegação

### Páginas disponíveis:
- Dashboard com visão geral do ambiente
- Página do Nginx com métricas em tempo real
- Página do Prometheus com informações do monitoramento
- Página do Grafana
- Página do PostgreSQL com dados reais do banco
- Página do Docker com status dos containers
- Páginas para N8N, Evolution API, Chatwoot, WhatsApp, Redis e RabbitMQ

## API de Automação

A API de automação expõe endpoints para integração com os serviços:
- `/api/postgres/info`: Informações gerais do PostgreSQL
- `/api/postgres/databases`: Lista de bancos de dados

## Comandos úteis

- Parar todos os serviços:
  ```bash
  docker-compose down
  ```

- Ver logs de um serviço específico:
  ```bash
  docker-compose logs -f <nome-do-serviço>
  ```

- Reiniciar um serviço específico:
  ```bash
  docker-compose restart <nome-do-serviço>
  ```

- Reconstruir todos os serviços:
  ```bash
  docker-compose up -d --build
  ```

## Configuração

Todos os arquivos de configuração estão incluídos no repositório:
- `nginx.conf`: Configuração do Nginx
- `prometheus.yml`: Configuração do Prometheus
- `grafana/provisioning/`: Configuração do Grafana
- `frontend/`: Código fonte do frontend
- `api/`: Código fonte da API de automação

## Notas importantes

- Todos os dados são persistidos em volumes Docker
- O frontend é construído automaticamente na inicialização
- Os certificados SSL devem estar em `/opt/docker/certificados/`
- O ambiente é acessível via `https://automacao.cmm.am.gov.br`