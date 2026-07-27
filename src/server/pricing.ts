/**
 * Matemática de dinheiro — pura, sem I/O. Lar ÚNICO das regras de preço.
 *
 * Por que um módulo só: o preço EXIBIDO na vitrine e o preço COBRADO no
 * checkout têm que sair da mesma regra. Enquanto viviam em arquivos separados,
 * já divergiam — e divergência entre vitrine e cobrança é reclamação de cliente
 * e problema de CDC, não bug de UI.
 *
 * Nada aqui é a autoridade final: a função SQL create_order recalcula tudo
 * dentro da transação. Estas funções alimentam o que se mostra ao cliente e o
 * valor enviado ao gateway.
 */
import { validateCoupon } from '../config/coupons';

export interface DbProductPrice {
    id: string;
    name: string;
    price: string;
    promotionalPrice: string | null;
}

export interface CartLine {
    id: string | number;
    quantity: number;
}

export interface VerifiedItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

/**
 * Preço unitário que vale de verdade.
 *
 * `promotional_price ?? price` estava errado: `??` só desvia em null, então uma
 * promoção gravada como "0.00" — plausível vindo de um ERP — seria adotada e o
 * item sairia a R$0. Promoção só vale quando é número finito e positivo.
 */
export function effectiveUnitPrice(price: string, promotionalPrice: string | null): number {
    const promo = promotionalPrice === null ? NaN : Number(promotionalPrice);
    if (Number.isFinite(promo) && promo > 0) return promo;
    return Number(price);
}

/** Preço a exibir + preço riscado (a promoção manda; o cheio vira oldPrice). */
export function resolveDisplayPrice(
    price: string,
    promotionalPrice: string | null
): { price: number; oldPrice?: number } {
    const efetivo = effectiveUnitPrice(price, promotionalPrice);
    const cheio = Number(price);
    return efetivo < cheio ? { price: efetivo, oldPrice: cheio } : { price: efetivo };
}

/**
 * Cruza o carrinho do cliente com os precos lidos do banco.
 *
 * Pilar Zero-Trust: do cliente vem SÓ id e quantidade. Nome e preço saem da
 * linha do banco — nunca do payload.
 *
 * @throws quando um id do carrinho não existe no banco. Falhar é o certo:
 * seguir com o item faltando cobraria menos do que o carrinho mostrava.
 */
export function buildVerifiedItems(
    cart: CartLine[],
    dbProducts: DbProductPrice[]
): VerifiedItem[] {
    const porId = new Map(dbProducts.map((p) => [String(p.id), p]));

    return cart.map((linha) => {
        const produto = porId.get(String(linha.id));
        if (!produto) throw new Error(`Product ${linha.id} not found in database`);
        return {
            id: produto.id,
            name: produto.name,
            price: effectiveUnitPrice(produto.price, produto.promotionalPrice),
            quantity: linha.quantity,
        };
    });
}

/** Arredonda para centavos (evita 89.99000000000001 chegando ao gateway). */
export function toCents(valor: number): number {
    return Math.round(valor * 100) / 100;
}

/** Subtotal a partir dos preços do banco — nunca de valor vindo do cliente. */
export function computeSubtotal(items: VerifiedItem[]): number {
    return toCents(items.reduce((soma, i) => soma + i.price * i.quantity, 0));
}

/** Revalida o cupom NO SERVIDOR contra o subtotal real. */
export function resolveDiscount(
    couponCode: string | undefined,
    subtotal: number
): { discountAmount: number; appliedCoupon: string | null } {
    if (!couponCode) return { discountAmount: 0, appliedCoupon: null };

    const resultado = validateCoupon(couponCode, subtotal);
    if (!resultado.valid) return { discountAmount: 0, appliedCoupon: null };

    return {
        discountAmount: toCents(subtotal * resultado.discount),
        appliedCoupon: couponCode.toUpperCase().trim(),
    };
}

/** Total a cobrar. Nunca negativo, mesmo com desconto maior que o subtotal. */
export function computeTotal(subtotal: number, discountAmount: number): number {
    return Math.max(0, toCents(subtotal - discountAmount));
}
