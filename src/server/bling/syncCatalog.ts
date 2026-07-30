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
 *  - Estoque de variantes no UPDATE só sobrescreve se ERP_STOCK_AUTHORITATIVE=1
 *    (mesma política do pai — evita overselling enquanto sendOrder não existe).
 */
import { and, eq, inArray } from 'drizzle-orm';

import { categories, productVariants, products } from '../../db/schema';
import { isErpStockAuthoritative } from '../../lib/server/erpFlags';
import { logInfo } from '../../lib/server/logger';
import { db } from '../dbClient';
import { blingGet } from './client';
import { decideProductWrite } from './productSlug';
import { buildProductValues, mapBlingProductFields, pickStockWriteValues, resolveLocalCategoryId, toSlugMatch } from './productValues';
import {
    collectVariationIds,
    temVariacoes,
    toVariantDrafts,
    type BlingVariacao,
    type VariantDraft,
} from './variations';

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
    /** 'V' = pai de uma grade, 'S' = simples (ou filho de grade), 'E' = composição. */
    formato?: string;
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
    variantes: {
        criadas: number;
        atualizadas: number;
        desativadas: number;
        paisComGrade: number;
        /** clones da grade que ja existiam como produto e sairam da vitrine */
        produtosDespromovidos: number;
    };
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

/** blingId da categoria -> uuid local. */
type CatIdMap = Map<number, string>;

async function syncCategories(
    blingCats: BlingCategoria[],
    report: CatalogSyncReport
): Promise<CatIdMap> {
    const catIdMap: CatIdMap = new Map();

    const nomeById = new Map<number, string>();
    for (const bc of blingCats) {
        const nome = (bc.descricao ?? '').trim();
        if (nome) nomeById.set(bc.id, nome);
    }

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

        const bySlug = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
        if (bySlug[0] && bySlug[0].blingId == null) {
            await db.update(categories).set({ blingId: bc.id, name: nome }).where(eq(categories.id, bySlug[0].id));
            catIdMap.set(bc.id, bySlug[0].id);
            report.categorias.atualizadas++;
            continue;
        }

        let finalSlug = slug;
        if (bySlug[0]) {
            const paiNome = bc.categoriaPai?.id ? nomeById.get(bc.categoriaPai.id) : undefined;
            finalSlug = paiNome ? `${slugify(paiNome)}-${slug}` : `${slug}-${bc.id}`;
        }

        const [created] = await db
            .insert(categories)
            .values({ name: nome, slug: finalSlug, blingId: bc.id })
            .returning({ id: categories.id });
        catIdMap.set(bc.id, created.id);
        report.categorias.criadas++;
    }

    return catIdMap;
}

async function resolveHierarchy(blingCats: BlingCategoria[], catIdMap: CatIdMap): Promise<void> {
    for (const bc of blingCats) {
        const localId = catIdMap.get(bc.id);
        if (!localId) continue;
        const parentBlingId = bc.categoriaPai?.id;
        const parentLocalId = parentBlingId ? catIdMap.get(parentBlingId) ?? null : null;
        await db.update(categories).set({ parentId: parentLocalId }).where(eq(categories.id, localId));
    }
}

async function demoteVariationProducts(
    idsDeVariacao: Set<number>,
    report: CatalogSyncReport
): Promise<void> {
    if (idsDeVariacao.size === 0) return;

    const despromovidos = await db
        .update(products)
        .set({ active: false })
        .where(and(inArray(products.blingId, [...idsDeVariacao]), eq(products.active, true)))
        .returning({ name: products.name });

    report.variantes.produtosDespromovidos = despromovidos.length;
    if (despromovidos.length > 0) {
        logInfo(
            'bling/sync: clones de grade despromovidos (agora sao variantes)',
            despromovidos.map((d) => d.name)
        );
    }
}

/**
 * Fase 2b — grade de um produto.
 *
 * UPDATE de stock: só quando ERP_STOCK_AUTHORITATIVE=1. Sem isso, preservar o
 * saldo local (já reduzido por create_order) evita overselling.
 * INSERT de variante nova: sempre grava stock do Bling (não há venda local).
 */
async function syncVariantsOf(
    productLocalId: string,
    drafts: VariantDraft[],
    report: CatalogSyncReport,
    stockIsAuthoritative: boolean
): Promise<void> {
    const locais = await db
        .select({ id: productVariants.id, blingId: productVariants.blingId })
        .from(productVariants)
        .where(eq(productVariants.productId, productLocalId));

    const localPorBling = new Map(locais.filter((l) => l.blingId != null).map((l) => [l.blingId!, l.id]));
    const vistos = new Set<number>();

    for (const d of drafts) {
        vistos.add(d.blingId);
        const base = {
            size: d.size,
            sku: d.sku,
            ean: d.ean,
            price: d.price,
            active: d.active,
        };

        const existente = localPorBling.get(d.blingId);
        if (existente) {
            const updatePayload = stockIsAuthoritative ? { ...base, stock: d.stock } : base;
            await db.update(productVariants).set(updatePayload).where(eq(productVariants.id, existente));
            report.variantes.atualizadas++;
        } else {
            // Variante nova: stock do Bling é a melhor (e única) informação.
            await db
                .insert(productVariants)
                .values({ ...base, stock: d.stock, productId: productLocalId, blingId: d.blingId });
            report.variantes.criadas++;
        }
    }

    for (const [blingId, localId] of localPorBling) {
        if (vistos.has(blingId)) continue;
        await db.update(productVariants).set({ active: false }).where(eq(productVariants.id, localId));
        report.variantes.desativadas++;
    }
}

async function syncProducts(
    blingProds: BlingProduto[],
    catIdMap: CatIdMap,
    variacoesPorPai: Map<number, VariantDraft[]>,
    idsDeVariacao: Set<number>,
    report: CatalogSyncReport
): Promise<void> {
    const stockIsAuthoritative = isErpStockAuthoritative();
    if (!stockIsAuthoritative) {
        logInfo('bling/sync: saldo do Bling NÃO sobrescreve o estoque local (ERP_STOCK_AUTHORITATIVE desligado)');
    }

    for (const bp of blingProds) {
        if (idsDeVariacao.has(bp.id)) continue;

        const fields = mapBlingProductFields(bp);
        if (!fields) continue;

        const slug = slugify(fields.nome);
        const values = buildProductValues(fields, resolveLocalCategoryId(catIdMap, bp.categoria));

        const grade = variacoesPorPai.get(bp.id);

        const { updateValues, insertValues } = pickStockWriteValues({
            values,
            stock: fields.stock,
            stockIsAuthoritative,
            hasGrade: grade !== undefined,
        });

        const byBling = await db.select().from(products).where(eq(products.blingId, bp.id)).limit(1);
        const bySlug = byBling[0]
            ? []
            : await db.select().from(products).where(eq(products.slug, slug)).limit(1);

        const decisao = decideProductWrite({
            baseSlug: slug,
            matchedByBlingId: byBling[0]?.id ?? null,
            matchedBySlug: toSlugMatch(bySlug[0]),
            codigo: bp.codigo,
            blingId: bp.id,
        });

        let localId: string;

        if (decisao.mode === 'update') {
            await db.update(products).set(updateValues).where(eq(products.id, byBling[0].id));
            localId = byBling[0].id;
            report.produtos.atualizados++;
        } else if (decisao.mode === 'adopt') {
            await db
                .update(products)
                .set({ ...updateValues, blingId: bp.id })
                .where(eq(products.id, bySlug[0].id));
            localId = bySlug[0].id;
            report.produtos.adotadosPorSlug++;
        } else {
            const [criado] = await db
                .insert(products)
                .values({ ...insertValues, slug: decisao.slug, blingId: bp.id })
                .returning({ id: products.id });
            localId = criado.id;
            report.produtos.criados++;
        }

        if (grade) {
            report.variantes.paisComGrade++;
            await syncVariantsOf(localId, grade, report, stockIsAuthoritative);
        }
    }
}

async function reportOrphans(
    blingProds: BlingProduto[],
    report: CatalogSyncReport
): Promise<void> {
    const blingIds = new Set(blingProds.map((p) => p.id));
    const locals = await db
        .select({ name: products.name, blingId: products.blingId })
        .from(products);

    for (const l of locals) {
        if (l.blingId == null) report.naoTocados++;
        else if (!blingIds.has(l.blingId)) report.produtos.inativosNoBling.push(l.name);
    }
}

export async function syncCatalog(): Promise<CatalogSyncReport> {
    const report: CatalogSyncReport = {
        categorias: { criadas: 0, atualizadas: 0 },
        produtos: { criados: 0, atualizados: 0, adotadosPorSlug: 0, inativosNoBling: [] },
        variantes: { criadas: 0, atualizadas: 0, desativadas: 0, paisComGrade: 0, produtosDespromovidos: 0 },
        naoTocados: 0,
    };

    const blingCats = await fetchAllPages<BlingCategoria>('/categorias/produtos');
    logInfo('bling/sync: categorias no Bling', blingCats.length);
    const catIdMap = await syncCategories(blingCats, report);
    await resolveHierarchy(blingCats, catIdMap);

    const blingProds = await fetchAllPages<BlingProduto>('/produtos?criterio=2');
    logInfo('bling/sync: produtos ativos no Bling', blingProds.length);

    const pais = blingProds.filter((p) => temVariacoes(p.formato));
    logInfo('bling/sync: produtos com grade', pais.length);

    const variacoesPorPai = new Map<number, VariantDraft[]>();
    const detalhes: Array<{ variacoes?: BlingVariacao[] }> = [];

    for (const pai of pais) {
        const det = await blingGet<{ data?: { variacoes?: BlingVariacao[] } }>(`/produtos/${pai.id}`);
        const variacoes = det.data?.variacoes ?? [];
        const drafts = toVariantDrafts(variacoes);

        if (drafts.length === 0) {
            throw new Error(
                `bling/sync: produto ${pai.id} ("${pai.nome}") esta marcado como grade mas nao devolveu ` +
                `variacao utilizavel. Sync abortado para nao desativar variantes nem recriar clones. ` +
                `Verifique o produto no Bling e rode de novo.`
            );
        }

        detalhes.push({ variacoes });
        variacoesPorPai.set(pai.id, drafts);
        await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
    }

    const idsDeVariacao = collectVariationIds(detalhes);
    logInfo('bling/sync: variações identificadas (não viram produto)', idsDeVariacao.size);

    await demoteVariationProducts(idsDeVariacao, report);
    await syncProducts(blingProds, catIdMap, variacoesPorPai, idsDeVariacao, report);

    await reportOrphans(blingProds, report);

    logInfo('bling/sync: concluído', report as unknown as Record<string, unknown>);
    return report;
}

export async function inspectBlingProducts(): Promise<unknown> {
    const lista = await blingGet<{ data: unknown[] }>('/produtos?criterio=2&pagina=1&limite=10');
    const primeiro = (lista.data?.[0] ?? null) as { id?: number } | null;

    let detalhe: unknown = null;
    if (primeiro?.id) {
        detalhe = await blingGet<unknown>(`/produtos/${primeiro.id}`);
    }

    return {
        totalNaPagina: lista.data?.length ?? 0,
        camposDaListagem: primeiro ? Object.keys(primeiro) : [],
        listaCrua: lista.data,
        detalheDoPrimeiro: detalhe,
    };
}
