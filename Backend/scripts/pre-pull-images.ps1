# Script PowerShell para fazer pré-pull das imagens Docker
# Isso ajuda a evitar timeouts durante o deploy no Portainer

Write-Host "=== Iniciando pré-pull das imagens Docker ===" -ForegroundColor Green

# Lista das imagens principais do docker-compose
$images = @(
    "prometheuscommunity/postgres-exporter:v0.18.1",
    "python:3.11.10-slim",
    "prom/prometheus:v2.53.0",
    "grafana/grafana:10.2.3",
    "grafana/loki:2.9.8",
    "grafana/promtail:2.9.7",
    "prom/blackbox-exporter:v0.24.0",
    "prom/alertmanager:v0.26.0",
    "redis:7-alpine",
    "rabbitmq:3-management",
    "postgres:15",
    "nginx:alpine",
    "gcr.io/cadvisor/cadvisor:v0.47.0",
    "grafana/tempo:2.3.1",
    "oliver006/redis_exporter:v1.55.0",
    "kbudde/rabbitmq-exporter:v1.0.0-RC7.1",
    "nginx/nginx-prometheus-exporter:1.5.1"
)

# Função para fazer pull com retry
function Pull-WithRetry {
    param(
        [string]$Image,
        [int]$MaxAttempts = 3
    )
    
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        Write-Host "Tentativa $attempt/$MaxAttempts`: Fazendo pull da imagem $Image" -ForegroundColor Yellow
        
        try {
            $result = docker pull $Image 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Sucesso: $Image" -ForegroundColor Green
                return $true
            } else {
                throw "Docker pull falhou com código $LASTEXITCODE"
            }
        }
        catch {
            Write-Host "❌ Falha na tentativa $attempt para $Image`: $($_.Exception.Message)" -ForegroundColor Red
            if ($attempt -lt $MaxAttempts) {
                Write-Host "Aguardando 10 segundos antes da próxima tentativa..." -ForegroundColor Yellow
                Start-Sleep -Seconds 10
            }
        }
    }
    
    Write-Host "🚨 ERRO: Falha ao fazer pull da imagem $Image após $MaxAttempts tentativas" -ForegroundColor Red
    return $false
}

# Contadores
$successCount = 0
$failureCount = 0
$failedImages = @()

# Fazer pull de cada imagem
foreach ($image in $images) {
    Write-Host ""
    Write-Host "📦 Processando: $image" -ForegroundColor Cyan
    
    if (Pull-WithRetry -Image $image) {
        $successCount++
    } else {
        $failureCount++
        $failedImages += $image
    }
}

# Relatório final
Write-Host ""
Write-Host "=== RELATÓRIO FINAL ===" -ForegroundColor Green
Write-Host "✅ Sucessos: $successCount" -ForegroundColor Green
Write-Host "❌ Falhas: $failureCount" -ForegroundColor Red

if ($failureCount -gt 0) {
    Write-Host ""
    Write-Host "🚨 Imagens que falharam:" -ForegroundColor Red
    foreach ($failedImage in $failedImages) {
        Write-Host "  - $failedImage" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "💡 Dicas para resolver problemas de conectividade:" -ForegroundColor Yellow
    Write-Host "  1. Verifique sua conexão com a internet"
    Write-Host "  2. Tente novamente em alguns minutos"
    Write-Host "  3. Configure um registry mirror se disponível"
    Write-Host "  4. Use versões específicas em vez de 'latest'"
    Write-Host "  5. Verifique se o Docker Desktop está funcionando corretamente"
}

Write-Host ""
Write-Host "=== Pré-pull concluído ===" -ForegroundColor Green

# Retornar código de erro se houve falhas
if ($failureCount -gt 0) {
    exit 1
} else {
    exit 0
}