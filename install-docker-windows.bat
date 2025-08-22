@echo off
echo Installing Docker Desktop for Windows...
echo.

REM Check if Docker is already installed
where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker is already installed.
    docker --version
    goto start_containers
)

echo Docker is not installed. Please follow these steps:
echo.
echo 1. Download Docker Desktop for Windows from:
echo    https://www.docker.com/products/docker-desktop/
echo.
echo 2. Install Docker Desktop
echo.
echo 3. Restart your computer
echo.
echo 4. Run this script again
echo.
pause
exit /b

:start_containers
echo Starting Docker containers...
docker-compose up -d
echo.
echo Containers started successfully!
echo.
echo You should now be able to access Grafana at:
echo https://automacao.cmm.am.gov.br/grafana
echo.
pause