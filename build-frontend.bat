@echo off
echo Construindo o frontend...

REM Navegar para o diretório do frontend
cd /d C:\AUTOMACAO\frontend

REM Instalar dependências
npm install

REM Construir a aplicação
npm run build

REM Copiar os arquivos construídos para o diretório nginx-html
xcopy /s /e /y dist\*.* ..\nginx-html\

echo Frontend construído e implantado com sucesso!