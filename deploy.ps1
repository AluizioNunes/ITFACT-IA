# Script de deployment automático para AUTOMACAO
# Este script deve ser executado no servidor Windows

Write-Host "==========================================" -ForegroundColor Green
Write-Host "INÍCIO DO DEPLOYMENT AUTOMAÇÃO CMM" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Erro: docker-compose.yml não encontrado. Execute este script na pasta do projeto." -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down

Write-Host "🔄 Fazendo pull das atualizações do git..." -ForegroundColor Yellow
git pull origin main

Write-Host "🔧 Removendo imagens antigas para forçar rebuild..." -ForegroundColor Yellow
docker-compose build --no-cache nginx frontend

Write-Host "🚀 Iniciando containers atualizados..." -ForegroundColor Yellow
docker-compose up -d --build

Write-Host "⏳ Aguardando containers iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "🔍 Verificando status dos containers..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "🌐 Testando conectividade HTTP..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80/health" -TimeoutSec 5
    Write-Host "HTTP Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "HTTP Error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://172.18.1.32:80/health" -TimeoutSec 5  
    Write-Host "HTTP Status IP: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "HTTP IP Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Logs do Nginx (últimas 20 linhas):" -ForegroundColor Yellow
docker-compose logs --tail=20 nginx

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT CONCLUÍDO!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs para testar:" -ForegroundColor Cyan
Write-Host "• HTTP: http://automacao.cmm.am.gov.br" -ForegroundColor White
Write-Host "• HTTP IP: http://172.18.1.32" -ForegroundColor White
Write-Host "• HTTPS: https://automacao.cmm.am.gov.br" -ForegroundColor White
Write-Host "• Debug: http://172.18.1.32:8081" -ForegroundColor White
Write-Host ""
Write-Host "Subdomínios configurados:" -ForegroundColor Cyan
Write-Host "• https://grafana.cmm.am.gov.br" -ForegroundColor White
Write-Host "• https://prometheus.cmm.am.gov.br" -ForegroundColor White
Write-Host "• https://n8n.cmm.am.gov.br" -ForegroundColor White
Write-Host "• https://chatwoot.cmm.am.gov.br" -ForegroundColor White
Write-Host "• https://whatsapp.cmm.am.gov.br" -ForegroundColor White
Write-Host "• https://rabbitmq.cmm.am.gov.br" -ForegroundColor White  
Write-Host "• https://redis.cmm.am.gov.br" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Green