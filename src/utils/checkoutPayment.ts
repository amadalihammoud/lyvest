/**
 * Lógica pura do passo de pagamento — sem React, sem rede, sem Clerk.
 */

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

export function buildPaymentCustomer(cardName: string, user: CustomerIdentity): PaymentCustomer {
    const nomeCompleto = cardName || user?.fullName || 'Cliente';
    const partes = nomeCompleto.split(' ');

    return {
        firstName: partes[0],
        lastName: (cardName || user?.fullName || '').split(' ').slice(1).join(' '),
        email: user?.primaryEmailAddress?.emailAddress || 'checkout@lyvest.com.br',
    };
}

export function buildSessionItems(cartItems: SessionCartItem[]) {
    return cartItems.map((item) => ({
        id: item.id,
        quantity: item.qty,
        variantId: item.variantId,
    }));
}

export type SessionOutcome =
    | { kind: 'redirect'; url: string }
    | { kind: 'pix'; qrCode: string; pixCopyPaste: string; orderId?: string; expiresAt?: string }
    | { kind: 'direct-success' };

export function resolveSessionOutcome(
    session:
        | {
              checkoutUrl?: string;
              status?: string;
              mode?: string;
              qrCode?: string;
              pixCopyPaste?: string;
              orderId?: string;
              expiresAt?: string;
          }
        | null
        | undefined
): SessionOutcome {
    if (session?.mode === 'pix_on_site' && session.qrCode && session.pixCopyPaste) {
        return {
            kind: 'pix',
            qrCode: session.qrCode,
            pixCopyPaste: session.pixCopyPaste,
            orderId: session.orderId,
            expiresAt: session.expiresAt,
        };
    }
    if (session?.checkoutUrl) return { kind: 'redirect', url: session.checkoutUrl };
    if (session?.status === 'success') return { kind: 'direct-success' };
    throw new Error('URL de pagamento não gerada pelo gateway');
}

export function buildRateLimitMessage(traduzida: string | undefined, resetInMs: number): string {
    const minutos = Math.ceil(resetInMs / 60000);
    return traduzida || `Muitas tentativas. Aguarde ${minutos} minuto(s).`;
}
