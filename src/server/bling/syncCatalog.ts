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

import { categories, productVariants, products } from '../../db/schema';
import { isErpStockAuthoritative } from '../../lib/server/erpFlags';
import { logInfo } from '../../lib/server/logger';
import { db } from '../dbClient';
import { blingGet } from './client';
import { decideProductWrite } from './productSlug';
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
    variantes: { criadas: number; atualizadas: number; desativadas: number; paisComGrade: number };
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

/**
 * Fase 1 — categorias.
 *
 * @returns o mapa blingId -> uuid local, necessário para vincular os produtos.
 */
async function syncCategories(
    blingCats: BlingCategoria[],
    report: CatalogSyncReport
): Promise<CatIdMap> {
    const catIdMap: CatIdMap = new Map();

    // Nomes do Bling por id, pra poder desambiguar slugs repetidos (ex.: "Cueca"
    // existe em Masculino E em Menino) usando o nome do pai, sem depender da
    // ordem de paginação da API.
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

        // adota categoria existente do seed com mesmo slug — SÓ se ela ainda não
        // pertence a outra categoria real do Bling (bling_id nulo). Se já tiver
        // bling_id, é uma colisão de nome legítima (ex.: "Cueca" em Masculino E
        // Menino) e precisa virar uma linha própria, senão os produtos das duas
        // categorias se misturam.
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

/**
 * Fase 1b — hierarquia (parent_id).
 *
 * Segunda passada de propósito: só aqui catIdMap está completo, então
 * categoriaPai.id resolve mesmo quando o pai vem DEPOIS do filho na paginação
 * da API do Bling. É o que torna o resultado independente da ordem.
 */
async function resolveHierarchy(blingCats: BlingCategoria[], catIdMap: CatIdMap): Promise<void> {
    for (const bc of blingCats) {
        const localId = catIdMap.get(bc.id);
        if (!localId) continue;
        const parentBlingId = bc.categoriaPai?.id;
        const parentLocalId = parentBlingId ? catIdMap.get(parentBlingId) ?? null : null;
        await db.update(categories).set({ parentId: parentLocalId }).where(eq(categories.id, localId));
    }
}

/**
 * Fase 2b — grade de um produto.
 *
 * Correlaciona por `bling_id` da variação (índice único parcial da migração
 * 0006). Variantes locais que sumiram do Bling são DESATIVADAS, não apagadas:
 * apagar destruiria o vínculo de pedidos antigos que referenciam a variante.
 *
 * Escrever aqui dispara o trigger trg_sync_product_stock, que recalcula
 * products.stock como a soma das variantes ativas — por isso o pai não precisa
 * (e não deve) ter estoque próprio quando tem grade.
 */
async function syncVariantsOf(
    productLocalId: string,
    drafts: VariantDraft[],
    report: CatalogSyncReport
): Promise<void> {
    const locais = await db
        .select({ id: productVariants.id, blingId: productVariants.blingId })
        .from(productVariants)
        .where(eq(productVariants.productId, productLocalId));

    const localPorBling = new Map(locais.filter((l) => l.blingId != null).map((l) => [l.blingId!, l.id]));
    const vistos = new Set<number>();

    for (const d of drafts) {
        vistos.add(d.blingId);
        const values = {
            size: d.size,
            sku: d.sku,
            ean: d.ean,
            stock: d.stock,
            price: d.price,
            active: d.active,
        };

        const existente = localPorBling.get(d.blingId);
        if (existente) {
            await db.update(productVariants).set(values).where(eq(productVariants.id, existente));
            report.variantes.atualizadas++;
        } else {
            await db
                .insert(productVariants)
                .values({ ...values, productId: productLocalId, blingId: d.blingId });
            report.variantes.criadas++;
        }
    }

    for (const [blingId, localId] of localPorBling) {
        if (vistos.has(blingId)) continue;
        await db.update(productVariants).set({ active: false }).where(eq(productVariants.id, localId));
        report.variantes.desativadas++;
    }
}

/** Fase 2 — produtos. */
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
        const nome = (bp.nome ?? '').trim();
        if (!nome) continue;

        // O CORAÇÃO DA CORREÇÃO: filhos de grade não viram produto próprio.
        // A listagem do Bling devolve pai e filhos lado a lado, sem vínculo —
        // era isso que enchia a vitrine de clones ("Sutiã ... Tamanho:P" como
        // produto solto). Eles entram como linhas de product_variants, logo
        // abaixo, junto do pai.
        if (idsDeVariacao.has(bp.id)) continue;

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
            active: bp.situacao !== 'I',
            ...(image ? { imageUrl: image } : {}),
            ...(categoryId ? { categoryId } : {}),
        };

        // O saldo do Bling só sobrescreve o saldo local quando o ERP é a fonte
        // da verdade — hoje ele não é, porque as vendas do site não chegam lá.
        // Ver src/lib/server/erpFlags.ts. Em produtos NOVOS o saldo do Bling é
        // sempre usado: não há venda local para preservar.
        const updateValues = stockIsAuthoritative ? { ...values, stock } : values;

        const byBling = await db.select().from(products).where(eq(products.blingId, bp.id)).limit(1);
        const bySlug = byBling[0]
            ? []
            : await db.select().from(products).where(eq(products.slug, slug)).limit(1);

        // A decisão vive em ./productSlug (pura e testada). O ponto delicado é o
        // caso 4: colidir com um produto que JÁ pertence a outro item do Bling.
        // Antes, adotávamos a linha e sobrescrevíamos o bling_id dela — dois
        // produtos homônimos viravam um só, alternando de identidade a cada sync.
        const decisao = decideProductWrite({
            baseSlug: slug,
            matchedByBlingId: byBling[0]?.id ?? null,
            matchedBySlug: bySlug[0]
                ? { id: bySlug[0].id, blingId: bySlug[0].blingId ?? null }
                : null,
            codigo: bp.codigo,
            blingId: bp.id,
        });

        const grade = variacoesPorPai.get(bp.id);

        // Produto com grade não tem estoque próprio: o saldo vive nas variantes
        // e o trigger do banco recalcula products.stock a partir delas.
        const insertValues = grade ? values : { ...values, stock };

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
            await syncVariantsOf(localId, grade, report);
        }
    }
}

/**
 * Fase 3 — órfãos.
 *
 * Apenas RELATA produtos locais cujo bling_id sumiu da listagem. Não desativa
 * nada: um sync parcial (erro de paginação, cota estourada) desativaria a
 * vitrine inteira. A decisão de desativar é humana.
 */
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

/**
 * Orquestra o sync completo. Cada fase faz uma coisa e entrega à próxima o que
 * ela precisa — antes tudo isto vivia numa função só, de complexidade 47.
 */
export async function syncCatalog(): Promise<CatalogSyncReport> {
    const report: CatalogSyncReport = {
        categorias: { criadas: 0, atualizadas: 0 },
        produtos: { criados: 0, atualizados: 0, adotadosPorSlug: 0, inativosNoBling: [] },
        variantes: { criadas: 0, atualizadas: 0, desativadas: 0, paisComGrade: 0 },
        naoTocados: 0,
    };

    const blingCats = await fetchAllPages<BlingCategoria>('/categorias/produtos');
    logInfo('bling/sync: categorias no Bling', blingCats.length);
    const catIdMap = await syncCategories(blingCats, report);
    await resolveHierarchy(blingCats, catIdMap);

    const blingProds = await fetchAllPages<BlingProduto>('/produtos?criterio=2'); // 2 = ativos
    logInfo('bling/sync: produtos ativos no Bling', blingProds.length);

    // A listagem NÃO traz as variações: só o GET por id do pai as devolve.
    // Uma chamada extra por produto com grade, com a mesma pausa de rate limit
    // usada na paginação (~3 req/s no Bling).
    const pais = blingProds.filter((p) => temVariacoes(p.formato));
    logInfo('bling/sync: produtos com grade', pais.length);

    const variacoesPorPai = new Map<number, VariantDraft[]>();
    const detalhes: Array<{ variacoes?: BlingVariacao[] }> = [];

    for (const pai of pais) {
        const det = await blingGet<{ data?: { variacoes?: BlingVariacao[] } }>(`/produtos/${pai.id}`);
        const variacoes = det.data?.variacoes ?? [];
        detalhes.push({ variacoes });
        variacoesPorPai.set(pai.id, toVariantDrafts(variacoes));
        await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
    }

    const idsDeVariacao = collectVariationIds(detalhes);
    logInfo('bling/sync: variações identificadas (não viram produto)', idsDeVariacao.size);

    await syncProducts(blingProds, catIdMap, variacoesPorPai, idsDeVariacao, report);

    await reportOrphans(blingProds, report);

    logInfo('bling/sync: concluído', report as unknown as Record<string, unknown>);
    return report;
}

/**
 * DIAGNÓSTICO — leitura pura, não escreve nada.
 *
 * Devolve o payload cru do Bling para os produtos, e o detalhe de UM produto
 * buscado individualmente (o endpoint de listagem costuma omitir `variacoes`,
 * que só aparece no GET por id). Serve para descobrir como o Bling representa
 * grade antes de implementar a importação de variantes.
 */
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
