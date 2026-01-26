@echo off
TITLE Ecommerce Tutti & Nino - DEV SERVER
cd /d "%~dp0"

echo ============================================
echo      INICIANDO O AMBIENTE DE TESTES
echo ============================================

echo.
echo [1/2] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando pacotes...
    cmd /c "npm install"
) else (
    echo Pacotes ja instalados.
)

echo.
echo [2/2] Iniciando o servidor...
echo.
echo ---------------------------------------------------
echo  AGUARDE A MENSAGEM "Local: http://localhost:5173"
echo  NAO FECHE ESTA JANELA ENQUANTO TESTAR O SITE!
echo ---------------------------------------------------
echo.

:: Usando node direto para evitar erro com o caractere "&" no nome da pasta
node "node_modules\vite\bin\vite.js"

echo.
echo O servidor parou ou deu erro.
pause
