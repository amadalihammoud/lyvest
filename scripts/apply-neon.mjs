#!/usr/bin/env node
/**
 * Aplica o schema + seed do Neon SEM depender do editor web da Vercel (sem passkey).
 * Conecta direto via DATABASE_URL (injetada pela integração Neon↔Vercel).
 *
 * Uso (na pasta do projeto, após `npm install`):
 *   1) Puxe as env vars de produção:  npx vercel env pull .env.local
 *      (ou defina DATABASE_URL no ambiente manualmente)
 *   2) node scripts/apply-neon.mjs
 *
 * Idempotente: pode rodar mais de uma vez sem duplicar dados.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Carrega DATABASE_URL de .env.local se ainda não estiver no ambiente.
function loadEnvLocal() {
    if (process.env.DATABASE_URL) return;
    try {
        const env = readFileSync(join(root, '.env.local'), 'utf8');
        for (const line of env.split('\n')) {
            const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
            if (m) {
                process.env.DATABASE_URL = m[1].replace(/^["']|["']$/g, '');
                break;
            }
        }
    } catch { /* sem .env.local */ }
}

/**
 * Divide um arquivo .sql em instruções, respeitando blocos dollar-quoted ($fn$ ... $fn$)
 * para não quebrar corpos de função no ';' interno.
 */
function splitStatements(sqlText) {
    const stmts = [];
    let buf = '';
    let dollarTag = null; // ex.: "$fn$" quando dentro de um bloco
    let i = 0;
    while (i < sqlText.length) {
        const ch = sqlText[i];

        // início/fim de dollar-quote
        if (ch === '$') {
            const m = sqlText.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
            if (m) {
                const tag = m[0];
                if (dollarTag === null) dollarTag = tag;
                else if (dollarTag === tag) dollarTag = null;
                buf += tag;
                i += tag.length;
                continue;
            }
        }

        // comentário de linha (fora de dollar-quote)
        if (dollarTag === null && ch === '-' && sqlText[i + 1] === '-') {
            const nl = sqlText.indexOf('\n', i);
            i = nl === -1 ? sqlText.length : nl;
            continue;
        }

        if (ch === ';' && dollarTag === null) {
            const s = buf.trim();
            if (s) stmts.push(s);
            buf = '';
            i++;
            continue;
        }

        buf += ch;
        i++;
    }
    const tail = buf.trim();
    if (tail) stmts.push(tail);
    return stmts;
}

async function main() {
    loadEnvLocal();
    if (!process.env.DATABASE_URL) {
        console.error('✗ DATABASE_URL ausente. Rode `npx vercel env pull .env.local` ou exporte a variável.');
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);
    const files = ['db/neon/0001_init.sql', 'db/neon/0002_seed.sql'];

    for (const file of files) {
        const text = readFileSync(join(root, file), 'utf8');
        const statements = splitStatements(text);
        console.log(`\n▶ ${file} — ${statements.length} instruções`);
        let n = 0;
        for (const stmt of statements) {
            n++;
            try {
                await sql.query(stmt);
                const head = stmt.replace(/\s+/g, ' ').slice(0, 60);
                console.log(`  ✓ [${n}/${statements.length}] ${head}...`);
            } catch (e) {
                console.error(`  ✗ [${n}/${statements.length}] falhou:\n${stmt}\n→ ${e.message}`);
                process.exit(1);
            }
        }
    }

    // Verificação final
    const [{ n_cat, n_prod }] = await sql.query(
        'SELECT (SELECT count(*) FROM categories) AS n_cat, (SELECT count(*) FROM products) AS n_prod'
    );
    console.log(`\n✅ Concluído. Categorias: ${n_cat} | Produtos: ${n_prod}`);
}

main().catch((e) => {
    console.error('Erro inesperado:', e);
    process.exit(1);
});
