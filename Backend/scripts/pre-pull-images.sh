#!/bin/bash

# Script para fazer pré-pull das imagens Docker
# Isso ajuda a evitar timeouts durante o deploy no Portainer

echo "=== Iniciando pré-pull das imagens Docker ==="

# Lista das imagens principais do docker-compose
IMAGES=(
    "prometheuscommunity/postgres-exporter:v0.18.1"
    "prom/prometheus:latest"
    "grafana/grafana:latest"
    "grafana/loki:latest"
    "grafana/promtail:latest"
    "prom/blackbox-exporter:latest"
    "prom/alertmanager:latest"
    "redis:7-alpine"
    "rabbitmq:3-management"
    "postgres:15"
    "nginx:alpine"
    "google/cadvisor:latest"
    "grafana/tempo:latest"
    "oliver006/redis_exporter:latest"
    "kbudde/rabbitmq-exporter:latest"
    "nginx/nginx-prometheus-exporter:latest"
)

# Função para fazer pull com retry
pull_with_retry() {
    local image=$1
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Tentativa $attempt/$max_attempts: Fazendo pull da imagem $image"
        
        if docker pull "$image"; then
            echo "✅ Sucesso: $image"
            return 0
        else
            echo "❌ Falha na tentativa $attempt para $image"
            if [ $attempt -lt $max_attempts ]; then
                echo "Aguardando 10 segundos antes da próxima tentativa..."
                sleep 10
            fi
        fi
        
        ((attempt++))
    done
    
    echo "🚨 ERRO: Falha ao fazer pull da imagem $image após $max_attempts tentativas"
    return 1
}

# Contador de sucessos e falhas
success_count=0
failure_count=0
failed_images=()

# Fazer pull de cada imagem
for image in "${IMAGES[@]}"; do
    echo ""
    echo "📦 Processando: $image"
    
    if pull_with_retry "$image"; then
        ((success_count++))
    else
        ((failure_count++))
        failed_images+=("$image")
    fi
done

# Relatório final
echo ""
echo "=== RELATÓRIO FINAL ==="
echo "✅ Sucessos: $success_count"
echo "❌ Falhas: $failure_count"

if [ $failure_count -gt 0 ]; then
    echo ""
    echo "🚨 Imagens que falharam:"
    for failed_image in "${failed_images[@]}"; do
        echo "  - $failed_image"
    done
    echo ""
    echo "💡 Dicas para resolver problemas de conectividade:"
    echo "  1. Verifique sua conexão com a internet"
    echo "  2. Tente novamente em alguns minutos"
    echo "  3. Configure um registry mirror se disponível"
    echo "  4. Use versões específicas em vez de 'latest'"
fi

echo ""
echo "=== Pré-pull concluído ==="

# Retornar código de erro se houve falhas
if [ $failure_count -gt 0 ]; then
    exit 1
else
    exit 0
fi