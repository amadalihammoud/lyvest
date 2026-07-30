/**
 * Frete autoritativo — pura + I/O mínimo.
 *
 * O cliente manda só a opção escolhida (id) e o CEP. Preço e frete grátis
 * saem do provider com itens precificados no servidor — nunca do body.
 */

import { getFreeShippingThreshold } from './financialConfig';
import { getShippingProvider, type ShippingQuote } from './providers/shipping';

export interface ClientShippingChoice {
    id?: unknown;
    price?: unknown;
    zipCode?: unknown;
    cep?: unknown;
    [key: string]: unknown;
}

export interface AuthoritativeShipping {
    /** Objeto a gravar em orders.shipping_address (price já é o do servidor). */
    record: Record<string, unknown>;
    /** Valor cobrado (sempre >= 0). */
    price: number;
}

/**
 * Resolve o frete a partir da escolha do cliente + preços reais dos itens.
 *
 * @param clientShipping  payload opcional do checkout (id da opção, CEP, …)
 * @param itemsForQuote   itens com price do banco (já verificados)
 * @returns price 0 e record mínimo quando não há escolha / CEP inválido
 */
export async function resolveAuthoritativeShipping(
    clientShipping: ClientShippingChoice | null | undefined,
    itemsForQuote: Array<{ id: string | number; quantity: number; price: number }>
): Promise<AuthoritativeShipping> {
    if (!clientShipping || typeof clientShipping !== 'object') {
        return { record: {}, price: 0 };
    }

    const zipRaw = String(clientShipping.zipCode ?? clientShipping.cep ?? '').replace(/\D/g, '');
    const optionId = clientShipping.id != null ? String(clientShipping.id) : '';

    // Sem CEP ou sem opção: não inventa frete — total sem frete (cliente ainda pode estar no passo endereço).
    if (zipRaw.length !== 8 || !optionId) {
        const { price: _ignored, ...rest } = clientShipping;
        return {
            record: { ...rest, price: 0 },
            price: 0,
        };
    }

    const provider = getShippingProvider();
    const quotes: ShippingQuote[] = await provider.calculate({
        zipCode: zipRaw,
        items: itemsForQuote,
    });

    const chosen = quotes.find((q) => q.id === optionId);
    if (!chosen) {
        // Opção desconhecida: rejeita preço do cliente, zera frete e marca inválido.
        // create-session deve tratar price inválido se quiser falhar fechado.
        return {
            record: {
                ...clientShipping,
                zipCode: zipRaw,
                price: 0,
                _invalidOption: true,
            },
            price: 0,
        };
    }

    const price = Number.isFinite(chosen.price) && chosen.price >= 0 ? chosen.price : 0;

    return {
        record: {
            ...clientShipping,
            id: chosen.id,
            carrier: chosen.carrier,
            service: chosen.service,
            zipCode: zipRaw,
            price,
            originalPrice: chosen.originalPrice,
            deliveryDays: chosen.deliveryDays,
            deliveryRange: chosen.deliveryRange,
            isFree: chosen.isFree,
        },
        price,
    };
}

/** Reexport para testes / callers que só precisam do threshold. */
export { getFreeShippingThreshold };
