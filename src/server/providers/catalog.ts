// Provider central do catálogo (produtos + categorias) — DB-first, com fallback
// para o mock (src/data/products.ts) quando DATABASE_URL não está configurada
// (ex.: ambiente local sem .env.local). Usado por API routes (/api/products,
// /api/categories) e por server components (home, categoria/[slug]).
//
// Objetivo desta migração: nenhuma tela da vitrine deve mais importar
// `productsData` diretamente — tudo passa por aqui.
import { and, avg, count, eq, ilike, inArray, or } from 'drizzle-orm';

import { categories, products, reviews } from '../../db/schema';
import { logError } from '../../lib/server/logger';
import { productsData } from '../../data/products';
import { Product } from '../../services/ProductService';
import { generateSlug } from '../../utils/slug';
import { db, isDbConfigured } from '../dbClient';

export interface CatalogCategory {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
}

export interface CategoryTreeNode extends CatalogCategory {
    children: CategoryTreeNode[];
}

/** Monta a árvore (só topo → filhos, espelha a hierarquia de 2 níveis do Bling). */
export function buildCategoryTree(flat: CatalogCategory[]): CategoryTreeNode[] {
    const byId = new Map<string, CategoryTreeNode>(flat.map((c) => [c.id, { ...c, children: [] }]));
    const roots: CategoryTreeNode[] = [];
    for (const node of byId.values()) {
        if (node.parentId && byId.has(node.parentId)) {
            byId.get(node.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
}

/** Retorna o próprio id + todos os ids descendentes (usado para agregar produtos de uma categoria-pai). */
function collectDescendantIds(rootId: string, flat: CatalogCategory[]): string[] {
    const ids = [rootId];
    let frontier = [rootId];
    while (frontier.length > 0) {
        const children = flat.filter((c) => c.parentId && frontier.includes(c.parentId)).map((c) => c.id);
        if (children.length === 0) break;
        ids.push(...children);
        frontier = children;
    }
    return ids;
}

export interface GetProductsOptions {
    categorySlug?: string;
    search?: string;
    limit?: number;
}

/** Converte um item do mock (src/data/products.ts) para o formato unificado `Product`. */
function mockToProduct(p: (typeof productsData)[number]): Product {
    return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        category: { name: p.category, slug: generateSlug(p.category) },
        specs: p.specs,
        ean: p.ean,
        active: true,
        sizes: p.sizes,
        colors: p.colors,
        badge: p.badge,
        rating: p.rating,
        reviews: p.reviews,
    };
}

function filterMockProducts(opts: GetProductsOptions): Product[] {
    let result = productsData;
    if (opts.categorySlug) {
        result = result.filter((p) => generateSlug(p.category) === opts.categorySlug);
    }
    if (opts.search) {
        const q = opts.search.toLowerCase();
        result = result.filter(
            (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
    }
    if (opts.limit) result = result.slice(0, opts.limit);
    return result.map(mockToProduct);
}

/** Lista categorias (flat). Sem banco configurado, deriva do mock (uma por nome distinto, sem hierarquia). */
export async function getCategories(): Promise<CatalogCategory[]> {
    if (!isDbConfigured()) {
        const seen = new Map<string, CatalogCategory>();
        for (const p of productsData) {
            const slug = generateSlug(p.category);
            if (!seen.has(slug)) seen.set(slug, { id: slug, name: p.category, slug, parentId: null });
        }
        return Array.from(seen.values());
    }

    try {
        const rows = await db
            .select({ id: categories.id, name: categories.name, slug: categories.slug, parentId: categories.parentId })
            .from(categories)
            .orderBy(categories.name);
        return rows;
    } catch (e) {
        logError('catalog: erro ao listar categorias', e);
        return [];
    }
}

/** Árvore de categorias (topo → filhos) pronta pro menu/mega-menu. */
export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
    const flat = await getCategories();
    return buildCategoryTree(flat);
}

/** Lista produtos ativos, com filtro opcional por categoria (slug) e busca por texto. */
export async function getProducts(opts: GetProductsOptions = {}): Promise<Product[]> {
    if (!isDbConfigured()) {
        return filterMockProducts(opts);
    }

    try {
        const whereClauses = [eq(products.active, true)];
        if (opts.categorySlug) {
            // Categoria-pai deve agregar produtos das subcategorias (ex.: "Feminino" mostra
            // produtos cadastrados em "Sutiã", "Calcinha" etc, que são filhas dela no Bling).
            const flatCats = await getCategories();
            const target = flatCats.find((c) => c.slug === opts.categorySlug);
            if (target) {
                const ids = collectDescendantIds(target.id, flatCats);
                whereClauses.push(inArray(products.categoryId, ids));
            } else {
                whereClauses.push(eq(categories.slug, opts.categorySlug));
            }
        }
        if (opts.search) {
            const q = `%${opts.search}%`;
            const searchClause = or(ilike(products.name, q), ilike(products.description, q));
            if (searchClause) whereClauses.push(searchClause);
        }

        let query = db
            .select({
                id: products.id,
                name: products.name,
                description: products.description,
                price: products.price,
                promotionalPrice: products.promotionalPrice,
                imageUrl: products.imageUrl,
                images: products.images,
                stock: products.stock,
                sizes: products.sizes,
                colors: products.colors,
                specs: products.specs,
                ean: products.ean,
                badge: products.badge,
                categoryName: categories.name,
                categorySlug: categories.slug,
            })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(and(...whereClauses))
            .$dynamic();

        if (opts.limit) query = query.limit(opts.limit);

        const rows = await query;

        // Rating/contagem de reviews agregados à parte (evita GROUP BY complexo).
        const productIds = rows.map((r) => r.id);
        const ratingMap = new Map<string, { avg: number; count: number }>();
        if (productIds.length > 0) {
            // Agregação NO BANCO, filtrada pelos produtos desta página.
            //
            // Antes: o WHERE filtrava só por `approved`, sem inArray — toda
            // chamada trazia a tabela `reviews` INTEIRA pela conexão e cruzava
            // em memória com `productIds.includes()` dentro de um loop, ou seja
            // busca linear aninhada: O(n_reviews x n_produtos). Com 300 produtos
            // e 5.000 avaliações são 1,5 milhão de comparações por pageview,
            // além de trafegar 5.000 linhas para usar poucas.
            //
            // O índice idx_reviews_product (0001_init.sql:127) cobre este filtro.
            const ratingRows = await db
                .select({
                    productId: reviews.productId,
                    avgRating: avg(reviews.rating),
                    reviewCount: count(reviews.id),
                })
                .from(reviews)
                .where(and(eq(reviews.approved, true), inArray(reviews.productId, productIds)))
                .groupBy(reviews.productId);

            for (const r of ratingRows) {
                if (!r.productId) continue;
                const media = Number(r.avgRating);
                const total = Number(r.reviewCount);
                if (!Number.isFinite(media) || total <= 0) continue;
                ratingMap.set(r.productId, { avg: media, count: total });
            }
        }

        return rows.map((row): Product => {
            const ratingInfo = ratingMap.get(row.id);
            return {
                id: row.id,
                name: row.name,
                description: row.description ?? '',
                price: Number(row.promotionalPrice ?? row.price),
                oldPrice: row.promotionalPrice ? Number(row.price) : undefined,
                image: row.imageUrl || (row.images?.[0] ?? ''),
                category: row.categoryName
                    ? { name: row.categoryName, slug: row.categorySlug ?? '' }
                    : undefined,
                specs: (row.specs as Record<string, string>) ?? {},
                ean: row.ean ?? undefined,
                active: true,
                stock_quantity: row.stock ?? 0,
                sizes: row.sizes ?? undefined,
                colors: (row.colors as unknown[]) ?? [],
                badge: row.badge ?? null,
                rating: ratingInfo ? Math.round(ratingInfo.avg) : undefined,
                reviews: ratingInfo?.count,
            };
        });
    } catch (e) {
        // NÃO cair no mock aqui. O fallback antigo transformava indisponibilidade
        // do banco numa LOJA FALSA: a vitrine passava a exibir produtos
        // hardcoded, com preços de fevereiro e ids numéricos (1..12). O cliente
        // adicionava ao carrinho e o checkout estourava, porque products.id é
        // uuid — `inArray(products.id, ['1'])` levanta "invalid input syntax for
        // type uuid" e vira 500 genérico, com o carrinho perdido.
        // Um erro visível é melhor que uma venda impossível.
        logError('catalog: erro ao listar produtos', e);
        throw e;
    }
}
