/**
 * Montagem do payload do Link de Pagamento do Asaas — pura, sem I/O.
 *
 * Extraída de AsaasPaymentProvider.createSession (src/server/providers/payment.ts).
 * É a parte que decide QUANTO se cobra e SE o redirect de retorno vai — as duas
 * coisas do provider que mais merecem teste, e justamente as que estavam
 * enterradas num método de complexidade 25 junto com fetch, retry e log.
 */

export interface AsaasItem {
    id: string | number;
    name?: string;
    price: number;
    quantity: number;
}

export interface BuildAsaasLinkInput {
    items: AsaasItem[];
    /** Total autoritativo calculado no servidor (já com desconto). Sempre preferido. */
    amount?: number;
    /** orders.id — volta no webhook como payment.externalReference. */
    orderId?: string;
    /** Origem do request; usada para o redirect de retorno. */
    appUrl?: string;
}

export interface AsaasLinkBody {
    name: string;
    description?: string;
    value: number;
    billingType: string;
    chargeType: string;
    dueDateLimitDays: number;
    maxInstallmentCount: number;
    externalReference?: string;
    notificationEnabled: boolean;
    callback?: { successUrl: string; autoRedirect: boolean };
    [key: string]: unknown;
}

export interface AsaasErrorLike {
    code?: string;
    description?: string;
}

/**
 * O Asaas só aceita `callback` quando a conta tem um site cadastrado
 * (Minha Conta > Informações); sem isso devolve 400 invalid_object.
 *
 * O redirect de retorno é acessório — vale recriar o link sem ele em vez de
 * perder a venda. Este predicado decide se é esse o caso.
 */
export function isCallbackRejection(errors?: AsaasErrorLike[] | null): boolean {
    const desc = (errors ?? []).map((e) => e.description ?? '').join(' ');
    return /dom[ií]nio|callback/i.test(desc);
}

/**
 * Erros de validação do gateway prontos para log.
 *
 * Código e descrição do Asaas não contêm dado de cliente, então entram no
 * RÓTULO da mensagem — que o logger de produção preserva (ele suprime o detail).
 * Sem isso, uma falha de cobrança em produção vira uma linha sem diagnóstico.
 */
export function formatGatewayErrors(errors?: AsaasErrorLike[] | null): string {
    return (errors ?? [])
        .map((e) => `${e.code ?? '?'}: ${e.description ?? ''}`)
        .join('; ')
        .slice(0, 300);
}

/** Total a cobrar. O `amount` do servidor tem precedência sobre a soma dos itens. */
export function resolveChargeValue(items: AsaasItem[], amount?: number): number {
    const total =
        typeof amount === 'number'
            ? amount
            : items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // Centavos: evita mandar 89.99000000000001 ao gateway.
    return Math.round(total * 100) / 100;
}

/** Resumo legível na fatura. Limitado a 5 itens e 255 chars (limite do Asaas). */
export function buildOrderSummary(items: AsaasItem[]): string {
    return items
        .slice(0, 5)
        .map((i) => `${i.quantity}x ${i.name ?? i.id}`)
        .join(', ')
        .slice(0, 255);
}

export function buildAsaasPaymentLinkBody({
    items,
    amount,
    orderId,
    appUrl,
}: BuildAsaasLinkInput): AsaasLinkBody {
    const summary = buildOrderSummary(items);

    const body: AsaasLinkBody = {
        name: orderId
            ? `Pedido LyVest ${String(orderId).slice(0, 8).toUpperCase()}`
            : 'Pedido LyVest',
        description: summary || undefined,
        value: resolveChargeValue(items, amount),
        billingType: 'UNDEFINED', // pagador escolhe: Pix, cartão ou boleto
        chargeType: 'DETACHED',
        dueDateLimitDays: 3,
        maxInstallmentCount: 6, // política da loja: até 6x
        externalReference: orderId,
        notificationEnabled: false,
    };

    // O Asaas rejeita callback http/localhost. Exigir https aqui evita derrubar
    // a cobrança inteira por causa de um redirect que é acessório — em preview
    // ou dev o link é criado sem retorno automático, e a venda acontece igual.
    if (appUrl && appUrl.startsWith('https://')) {
        body.callback = {
            successUrl: `${appUrl}/checkout?status=success${orderId ? `&order=${orderId}` : ''}`,
            autoRedirect: true,
        };
    }

    return body;
}
