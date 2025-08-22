# Painel de Controle - Frontend

Frontend do sistema de automação desenvolvido com React, TypeScript, Ant Design e Framer Motion.

## Estrutura de Rotas

- `/dashboard` - Página inicial com visão geral do sistema
- `/coreprometheus` - Página do Prometheus (frontend)
- `/coregrafana` - Página do Grafana (frontend)
- `/nginx` - Página do Nginx
- `/postgres` - Página do PostgreSQL
- `/docker` - Página do Docker
- `/n8n` - Página do N8N
- `/evolutionapi` - Página da Evolution API
- `/chatwoot` - Página do Chatwoot
- `/whatsapp` - Página do WhatsApp
- `/redis` - Página do Redis
- `/rabbitmq` - Página do RabbitMQ

## Notas Importantes

As rotas `/grafana/` e `/prometheus/` estão reservadas para as aplicações reais desses serviços, acessíveis através do proxy reverso do Nginx.

## Tecnologias Utilizadas

- React 18 com Hooks
- TypeScript
- Ant Design para componentes UI
- Framer Motion para animações
- React Router DOM para navegação
- Vite como bundler

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o linter

## Estrutura de Pastas

```
src/
  ├── components/     # Componentes reutilizáveis
  ├── hooks/          # Hooks customizados
  ├── pages/          # Páginas da aplicação
  ├── assets/         # Arquivos estáticos
  ├── types/          # Definições de tipos TypeScript
  ├── App.tsx         # Componente principal
  ├── main.tsx        # Ponto de entrada da aplicação
  └── theme.ts        # Configuração de tema do Ant Design
```
