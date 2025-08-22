# Sistema de Automação CMM AM

Sistema completo de monitoramento e automação para a CMM AM, incluindo frontend React, API Node.js, Prometheus, Grafana, PostgreSQL e Nginx.

## 🚀 Funcionalidades

- **Dashboard Centralizado**: Interface única para monitorar todos os serviços
- **Monitoramento**: Prometheus para coleta de métricas
- **Visualização**: Grafana para dashboards e alertas
- **Banco de Dados**: PostgreSQL para armazenamento de dados
- **Proxy Reverso**: Nginx para roteamento e SSL
- **API REST**: Backend Node.js para integração

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nginx         │    │   Prometheus    │
│   (React)       │◄──►│   (Proxy)       │◄──►│   (Métricas)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Grafana       │              │
         │              │   (Dashboards)  │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Node.js   │    │   PostgreSQL    │    │   Volumes       │
│   (Backend)     │    │   (Database)    │    │   (Dados)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Certificados SSL válidos para o domínio `automacao.cmm.am.gov.br`
- Acesso ao servidor Linux remoto (IP: 172.18.1.32)

## 🔧 Configuração

### 1. Preparar Certificados SSL

Coloque os certificados SSL no diretório `/opt/docker/certificados/`:
- `cmm_am_gov_br_inter.crt` - Certificado público
- `cmm_am_gov_br.key` - Chave privada

### 2. Deploy no Servidor Remoto

```bash
# Conectar ao servidor remoto
ssh usuario@172.18.1.32

# Clonar ou copiar o projeto
git clone <repositorio> /caminho/para/automacao
cd /caminho/para/automacao

# Executar o sistema
docker-compose up -d
```

## 🚀 Uso

### Acessar Aplicações

- **Frontend Principal**: https://automacao.cmm.am.gov.br/
- **Grafana**: https://automacao.cmm.am.gov.br/grafana/
- **Prometheus**: https://automacao.cmm.am.gov.br/prometheus/
- **API**: https://automacao.cmm.am.gov.br/api/

### Credenciais Padrão

- **Grafana**: Admin / Ricardo@1964
- **PostgreSQL**: Admin / Ricardo@1964

## 📊 Monitoramento

### Métricas Coletadas

- **Nginx**: Status, requisições, erros
- **PostgreSQL**: Conexões, performance, tamanho do banco
- **API**: Health checks, tempo de resposta
- **Prometheus**: Métricas do sistema

### Dashboards Disponíveis

- Dashboard principal com visão geral
- Métricas em tempo real dos serviços
- Gráficos de performance
- Status de saúde dos containers

## 🔍 Troubleshooting

### Verificar Status dos Serviços

```bash
# Status geral
docker-compose ps

# Logs de um serviço específico
docker-compose logs nginx
docker-compose logs prometheus
docker-compose logs grafana

# Health checks
curl https://automacao.cmm.am.gov.br/health
curl https://automacao.cmm.am.gov.br/api/health
```

### Problemas Comuns

1. **Certificados SSL**: Verificar se estão no caminho correto
2. **Portas**: Confirmar que as portas 80, 443, 3001, 4000 estão livres
3. **Volumes**: Verificar permissões dos diretórios de dados

## 📁 Estrutura do Projeto

```
automacao/
├── frontend/           # Aplicação React
├── api/               # API Node.js
├── nginx/             # Configuração do Nginx
├── prometheus/        # Configuração do Prometheus
├── grafana/           # Configuração do Grafana
├── docker-compose.yml # Orquestração dos serviços
└── README.md          # Este arquivo
```

## 🔄 Atualizações

Para atualizar o sistema:

```bash
# Parar serviços
docker-compose down

# Reconstruir imagens
docker-compose build --no-cache

# Reiniciar serviços
docker-compose up -d
```

## 📞 Suporte

Para suporte técnico, entre em contato com a equipe de TI da CMM AM.

---

**Versão**: 2.0.0  
**Última Atualização**: Dezembro 2024  
**Desenvolvido por**: Equipe de Automação CMM AM