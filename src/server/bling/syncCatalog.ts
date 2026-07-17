/**
 * Sync de catálogo Bling → Neon (categorias + produtos).
 *
 * Regras:
 *  - Upsert por bling_id (nunca duplica; atualiza nome/preço/estoque/etc).
 *  - Produtos do seed sem bling_id ficam intactos; casamos por slug quando o
 *    nome bate, adotando o bling_id (evita duplicar o catálogo inicial).
 *  - NÃO desativa nada automaticamente: produto que sumiu do Bling apenas é
 *    reportado (decisão de desativar é humana, evita apagão de vitrine).
 *  - Imagem: usa a urlImagem do Bling quando existir; senão preserva a atual.
 *  - Rate limit: ~3 req/s → pausa de 400ms entre páginas.
 */
import { eq } from 'drizzle-orm';

import { categories, products } from '../../db/schema';
import { logInfo } from '../../lib/server/logger';
import { db } from '../dbClient';

import { blingGet } from './client';

const PAGE_LIMIT = 100;
const PAGE_DELAY_MS = 400;

const slugify = (s: string) =>
    s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

interface BlingCategoria {
    id: number;
    descricao: string;
    categoriaPai?: { id: number };
}

interface BlingProduto {
    id: number;
    nome: string;
    codigo?: string;
    preco?: number;
    precoPromocional?: number | null;
    situacao?: string; // 'A' ativo / 'I' inativo
    descricaoCurta?: string;
    imagemURL?: string;
    urlImagem?: string;
    estoque?: { saldoVirtualTotal?: number };
    categoria?: { id: number };
}

export interface CatalogSyncReport {
    categorias: { criadas: number; atualizadas: number };
    produtos: { criados: number; atualizados: number; adotadosPorSlug: number; inativosNoBling: string[] };
    naoTocados: number;
}

async function fetchAllPages<T>(basePath: string): Promise<T[]> {
    const all: T[] = [];
    for (let pagina = 1; ; pagina++) {
        const sep = basePath.includes('?') ? '&' : '?';
        const res = await blingGet<{ data: T[] }>(`${basePath}${sep}pagina=${pagina}&limite=${PAGE_LIMIT}`);
        const rows = res.data ?? [];
        all.push(...rows);
        if (rows.length < PAGE_LIMIT) break;
        await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
    }
    return all;
}

export async function syncCatalog(): Promise<CatalogSyncReport> {
    const report: CatalogSyncReport = {
        categorias: { criadas: 0, atualizadas: 0 },
        produtos: { criados: 0, atualizados: 0, adotadosPorSlug: 0, inativosNoBling: [] },
        naoTocados: 0,
    };

    // ---------- 1. Categorias ----------
    const blingCats = await fetchAllPages<BlingCategoria>('/categorias/produtos');
    logInfo('bling/sync: categorias no Bling', blingCats.length);

    const catIdMap = new Map<number, string>(); // blingId -> uuid local

    for (const bc of blingCats) {
        const nome = (bc.descricao ?? '').trim();
        if (!nome) continue;
        const slug = slugify(nome);

        const byBling = await db.select().from(categories).where(eq(categories.blingId, bc.id)).limit(1);
        if (byBling[0]) {
            await db.update(categories).set({ name: nome }).where(eq(categories.id, byBling[0].id));
            catIdMap.set(bc.id, byBling[0].id);
            report.categorias.atualizadas++;
            continue;
        }

        // adota categoria existente do seed com mesmo slug
        const bySlug = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
        if (bySlug[0]) {
            await db.update(categories).set({ blingId: bc.id, name: nome }).where(eq(categories.id, bySlug[0].id));
            catIdMap.set(bc.id, bySlug[0].id);
            report.categorias.atualizadas++;
            continue;
        }

        const [created] = await db
            .insert(categories)
            .values({ name: nome, slug, blingId: bc.id })
            .returning({ id: categories.id });
        catIdMap.set(bc.id, created.id);
        report.categorias.criadas++;
    }

    // ---------- 2. Produtos ----------
    const blingProds = await fetchAllPages<BlingProduto>('/produtos?criterio=2'); // 2 = ativos
    logInfo('bling/sync: produtos ativos no Bling', blingProds.length);

    for (const bp of blingProds) {
        const nome = (bp.nome ?? '').trim();
        if (!nome) continue;
        const slug = slugify(nome);
        const image = bp.imagemURL || bp.urlImagem || null;
        const stock = Math.max(0, Math.trunc(bp.estoque?.saldoVirtualTotal ?? 0));
        const price = String(bp.preco ?? 0);
        const promo = bp.precoPromocional != null && bp.precoPromocional > 0 ? String(bp.precoPromocional) : null;
        const categoryId = bp.categoria?.id ? catIdMap.get(bp.categoria.id) ?? null : null;

        const values = {
            name: nome,
            description: bp.descricaoCurta ?? undefined,
            price,
            promotionalPrice: promo,
            stock,
            active: bp.situacao !== 'I',
            ...(image ? { imageUrl: image } : {}),
            ...(categoryId ? { categoryId } : {}),
        };

        const byBling = await db.select().from(products).where(eq(products.blingId, bp.id)).limit(1);
        if (byBling[0]) {
            await db.update(products).set(values).where(eq(products.id, byBling[0].id));
            report.produtos.atualizados++;
            continue;
        }

        const bySlug = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
        if (bySlug[0]) {
            await db.update(products).set({ ...values, blingId: bp.id }).where(eq(products.id, bySlug[0].id));
            report.produtos.adotadosPorSlug++;
            continue;
        }

        await db.insert(products).values({ ...values, slug, blingId: bp.id });
        report.produtos.criados++;
    }

    // ---------- 3. Relatório de órfãos (no banco com bling_id que sumiram do Bling) ----------
    const blingIds = new Set(blingProds.map((p) => p.id));
    const locals = await db
        .select({ name: products.name, blingId: products.blingId })
        .from(products);
    for (const l of locals) {
        if (l.blingId == null) report.naoTocados++;
        else if (!blingIds.has(l.blingId)) report.produtos.inativosNoBling.push(l.name);
    }

    logInfo('bling/sync: concluído', report as unknown as Record<string, unknown>);
    return report;
}
