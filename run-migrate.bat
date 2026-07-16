@echo off
chcp 65001 >nul
cd /d "%~dp0"
set LOG=migrate.log
echo ===== INICIO %DATE% %TIME% ===== > "%LOG%"

echo [1/5] npm install >> "%LOG%" 2>&1
call npm install >> "%LOG%" 2>&1
if errorlevel 1 goto :err

echo [2/5] vercel env pull (production) >> "%LOG%" 2>&1
call npx --yes vercel env pull .env.local --environment=production --yes >> "%LOG%" 2>&1
if errorlevel 1 goto :err

echo [3/5] db:apply (schema + seed no Neon) >> "%LOG%" 2>&1
call npm run db:apply >> "%LOG%" 2>&1
if errorlevel 1 goto :err

echo [4/5] tsc --noEmit >> "%LOG%" 2>&1
call npm run check >> "%LOG%" 2>&1

echo [5/5] build >> "%LOG%" 2>&1
call npm run build >> "%LOG%" 2>&1

echo ===== DONE OK %DATE% %TIME% ===== >> "%LOG%"
echo. >> "%LOG%"
echo Resultado final gravado em migrate.log
goto :eof

:err
echo ===== FALHOU (veja acima) %DATE% %TIME% ===== >> "%LOG%"
