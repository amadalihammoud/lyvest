/**
 * Decide o que o seletor de tamanho da PDP oferece — puro, sem React.
 *
 * Existem DOIS mundos de tamanho no projeto, e confundi-los é o que quebra o
 * checkout:
 *
 *  - `product.variants` (product_variants, vindo da grade do Bling): cada
 *    tamanho é uma linha comprável, com estoque próprio e um `id` que
 *    `create_order` EXIGE. Sem esse id o pedido é recusado com VARIANT_REQUIRED,
 *    porque a baixa de estoque acontece na variante.
 *  - `product.sizes` (products.sizes, texto livre do ERP): rótulo e nada mais.
 *    Não tem estoque por tamanho nem id. É o caso legado, de produto sem grade.
 *
 * Este módulo colapsa os dois em uma lista só, marcando qual é qual, para que a
 * UI não precise decidir — e para que a regra fique sob teste.
 */
import type { Product, ProductVariant } from '../services/ProductService';

export interface SizeOption {
    size: string;
    /** null = tamanho legado sem variante; nada será enviado ao checkout. */
    variantId: string | null;
    /** false = sem estoque; o botão aparece, mas não é escolhível. */
    available: boolean;
}

/**
 * Mostra tamanho esgotado como DESABILITADO em vez de escondê-lo.
 *
 * Some-lo faria a grade "P M GG" parecer o catálogo completo, e o cliente que
 * procura G concluiria que a loja nunca teve o tamanho dele. Visível e apagado
 * comunica a verdade: existe, acabou.
 */
export function buildSizeOptions(product: Pick<Product, 'variants' | 'sizes'>): SizeOption[] {
    if (product.variants?.length) {
        return product.variants
            .filter((v): v is ProductVariant & { size: string } => typeof v.size === 'string' && v.size !== '')
            .map((v) => ({ size: v.size, variantId: v.id, available: v.stock > 0 }));
    }

    return (product.sizes ?? [])
        .filter((s) => typeof s === 'string' && s.trim() !== '')
        .map((s) => ({ size: s, variantId: null, available: true }));
}

/** Há tamanho a escolher — logo, comprar sem escolher é erro. */
export function requiresSizeSelection(options: SizeOption[]): boolean {
    return options.length > 0;
}

/** Todo tamanho esgotado: o produto existe, mas não há o que vender. */
export function isFullyOutOfStock(options: SizeOption[]): boolean {
    return options.length > 0 && options.every((o) => !o.available);
}

export function findSizeOption(options: SizeOption[], size: string | null): SizeOption | undefined {
    if (size === null) return undefined;
    return options.find((o) => o.size === size);
}

/**
 * O `variantId` que deve viajar até `create_order` para o tamanho escolhido.
 *
 * Devolve undefined (não null) quando não há variante, porque é assim que o
 * campo some do JSON em vez de virar `"variantId": null` — o Zod do checkout
 * trata a chave como opcional, e mandar null explícito falharia a validação.
 */
export function resolveVariantId(options: SizeOption[], size: string | null): string | undefined {
    return findSizeOption(options, size)?.variantId ?? undefined;
}
