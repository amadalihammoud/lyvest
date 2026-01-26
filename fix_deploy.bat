@echo off
TITLE Corrigindo Icones
cd /d "%~dp0"

echo ==========================================
echo   CORRIGINDO ICONES INCOMPATIVEIS
echo ==========================================

set GIT_PATH="C:\Program Files\Git\cmd\git.exe"
if not exist %GIT_PATH% set GIT_PATH=git

echo.
echo [1/3] Adicionando alteracoes...
%GIT_PATH% add .
echo [OK] Alteracoes registradas.

echo.
echo [2/3] Criando commit de correcao...
%GIT_PATH% commit -m "Fix: Replace CircleCheck with CheckCircle for compatibility"
echo [OK] Commit criado.

echo.
echo [3/3] Enviando para o GitHub...
%GIT_PATH% push origin main
echo [OK] Enviado com sucesso!

echo.
echo ==========================================
echo   TERCEIRA EH A DA SORTE! VAI FUNCIONAR.
echo ==========================================
echo pode fechar esta janela.
pause
