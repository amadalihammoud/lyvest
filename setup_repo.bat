@echo off
TITLE Configurando Repositorio Git
cd /d "%~dp0"

echo ==========================================
echo   CONFIGURACAO AUTOMATICA DO REPOSITORIO
echo ==========================================
echo Trabalhando na pasta:
echo %CD%

set GIT_PATH="C:\Program Files\Git\cmd\git.exe"

if not exist %GIT_PATH% (
    echo [ERRO] Git nao encontrado em C:\Program Files\Git\cmd\git.exe
    echo Tentando encontrar no PATH...
    set GIT_PATH=git
)

echo.
echo [1/4] Inicializando repositorio...
%GIT_PATH% init
echo [OK] Git init realizado.

echo.
echo [2/4] Configurando identidade...
%GIT_PATH% config user.email "deploy@tutti-nino.com"
%GIT_PATH% config user.name "Tutti Nino Deploy"
echo [OK] Identidade configurada.

echo.
echo [3/4] Adicionando arquivos...
%GIT_PATH% add .
echo [OK] Arquivos adicionados.

echo.
echo [4/4] Criando commit inicial...
%GIT_PATH% commit -m "Deploy inicial do Ecommerce"
echo [OK] Arquivos commitados.

echo.
echo ==========================================
echo   TUDO PRONTO LOCALMENTE!
echo ==========================================
echo.
echo AGORA O ULTIMO PASSO EH COM VOCE:
echo.
echo 1. Va no site do GitHub (https://github.com/new) e crie o repositorio.
echo 2. Copie os comandos para "push an existing repository".
echo 3. Cole eles aqui embaixo e aperte ENTER.
echo.
cmd /k
