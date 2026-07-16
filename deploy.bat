@echo off
chcp 65001 >nul
cd /d "%~dp0"
set LOG=deploy.log
echo ===== DEPLOY INICIO %DATE% %TIME% ===== > "%LOG%"

echo [info] branch atual: >> "%LOG%" 2>&1
git rev-parse --abbrev-ref HEAD >> "%LOG%" 2>&1

echo [1/4] criando branch de preview >> "%LOG%" 2>&1
git checkout -B claude/neon-migration-deploy >> "%LOG%" 2>&1

echo [2/4] git add -A >> "%LOG%" 2>&1
git add -A >> "%LOG%" 2>&1

echo [3/4] commit >> "%LOG%" 2>&1
git commit -m "feat(db): migra Supabase -> Neon (Drizzle + API routes)" -m "Camada de dados reescrita de supabase-js para Drizzle+@neondatabase/serverless. Browser nao acessa mais o banco: favoritos/enderecos/pedidos/reviews via API routes com Clerk. Schema+seed aplicados no Neon (neondb). Fix: react-hot-toast declarado no package.json. tsc e next build verdes." >> "%LOG%" 2>&1

echo [4/4] push (preview) >> "%LOG%" 2>&1
git push -u origin claude/neon-migration-deploy >> "%LOG%" 2>&1

echo ===== DEPLOY DONE %DATE% %TIME% ===== >> "%LOG%"
