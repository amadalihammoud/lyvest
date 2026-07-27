/**
 * Lógica pura do passo de pagamento — sem React, sem rede, sem Clerk.
 *
 * `handleSubmit` em CheckoutPayment.tsx acumulou 24 de complexidade misturando
 * quatro coisas: decidir o fluxo, montar o payload, interpretar a resposta do
 * gateway e mexer em estado de componente. As três primeiras são funções de
 * dados — só a última precisa de React. Separadas, viram teste barato; juntas,
 * exigiriam montar o componente inteiro com mock de Clerk e de rede para
 * verificar se um nome é dividido em nome e sobrenome corretamente.
 *
 * Nada aqui importa @clerk/nextjs: o tipo do usuário é estrutural de propósito,
 * para o módulo continuar testável sem mock.
 */

/** O mínimo que precisamos do usuário logado — evita depender do tipo do Clerk. */
export type CustomerIdentity =
    | { fullName?: string | null; primaryEmailAddress?: { emailAddress?: string | null } | null }
    | null
    | undefined;

export interface PaymentCustomer {
    firstName: string;
    lastName: string;
    email: string;
}

export interface SessionCartItem {
    id: string | number;
    qty: number;
    variantId?: string;
}

/**
 * Nome e e-mail para o gateway.
 *
 * Precedência: o que o cliente digitou no cartão vence o nome da conta — quem
 * paga pode não ser o titular da conta, e o gateway confere contra o cartão.
 *
 * Recebe o objeto `user` inteiro, não `user?.fullName`, de propósito: se o
 * optional chaining ficasse no chamador, os ramos voltariam para handleSubmit e
 * a extração perderia a maior parte do ganho.
 */
export function buildPaymentCustomer(cardName: string, user: CustomerIdentity): PaymentCustomer {
    const nomeCompleto = cardName || user?.fullName || 'Cliente';
    const partes = nomeCompleto.split(' ');

    return {
        firstName: partes[0],
        // Sobrenome vazio é aceitável; o gateway não exige. Inventar um seria pior.
        lastName: (cardName || user?.fullName || '').split(' ').slice(1).join(' '),
        email: user?.primaryEmailAddress?.emailAddress || 'checkout@lyvest.com.br',
    };
}

/**
 * Itens no formato que a rota espera.
 *
 * Manda SÓ id, quantidade e variante — nunca preço nem nome. O servidor relê
 * tudo do banco (Zero-Trust, ver src/server/pricing.ts); qualquer preço enviado
 * daqui seria ignorado, e enviá-lo só criaria a ilusão de que o cliente decide
 * quanto paga.
 */
export function buildSessionItems(cartItems: SessionCartItem[]) {
    return cartItems.map((item) => ({
        id: item.id,
        quantity: item.qty,
        // Obrigatório para produto com grade (migração 0006): a baixa de estoque
        // acontece na variante, e create_order recusa o item sem ele.
        variantId: item.variantId,
    }));
}

/**
 * O que fazer com a sessão devolvida pelo gateway.
 *
 * União discriminada em vez de if/else-if no componente: o chamador decide com
 * um teste só, e o caso inválido é impossível de esquecer porque vira exceção
 * aqui dentro — não um `else` silencioso lá fora.
 */
export type SessionOutcome = { kind: 'redirect'; url: string } | { kind: 'direct-success' };

export function resolveSessionOutcome(
    session: { checkoutUrl?: string; status?: string } | null | undefined
): SessionOutcome {
    if (session?.checkoutUrl) return { kind: 'redirect', url: session.checkoutUrl };
    if (session?.status === 'success') return { kind: 'direct-success' };
    throw new Error('URL de pagamento não gerada pelo gateway');
}

/**
 * Mensagem do limite de tentativas.
 *
 * Arredonda para cima: dizer "aguarde 0 minutos" com 30 segundos restantes faria
 * o cliente tentar de novo e bater na mesma parede.
 */
export function buildRateLimitMessage(traduzida: string | undefined, resetInMs: number): string {
    const minutos = Math.ceil(resetInMs / 60000);
    return traduzida || `Muitas tentativas. Aguarde ${minutos} minuto(s).`;
}
