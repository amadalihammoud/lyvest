/**
 * Montagem do body POST /pedidos/vendas (Bling API v3) — pura, testável.
 *
 * Contato: nome + tipo pessoa; documento opcional (CPF/CNPJ só dígitos).
 * Itens: preferem produto.id (blingId da variante ou do produto pai).
 * numeroLoja: id do pedido local (idempotência humana no Bling).
 */

export interface OrderItemForBling {
    name: string;
    quantity: number;
    /** Preço unitário cobrado (já snapshot no pedido). */
    price: number;
    sku?: string | null;
    /** ID do produto/variação no Bling (quando conhecido). */
    blingProductId?: number | null;
}

export interface OrderShippingForBling {
    price?: number;
    recipient?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface BuildBlingOrderInput {
    orderId: string;
    /** ISO date ou Date — vira YYYY-MM-DD. */
    createdAt?: string | Date | null;
    customerName: string;
    customerDocument?: string | null;
    customerEmail?: string | null;
    items: OrderItemForBling[];
    shipping?: OrderShippingForBling | null;
    totalAmount?: number;
    paymentMethod?: string | null;
    /** ID da loja no Bling (opcional, env BLING_LOJA_ID). */
    lojaId?: number | null;
}

export function onlyDigits(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '');
}

export function toBlingDate(value?: string | Date | null): string {
    const d = value instanceof Date ? value : value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 10);
}

export function buildBlingOrderPayload(input: BuildBlingOrderInput): Record<string, unknown> {
    const doc = onlyDigits(input.customerDocument);
    const contato: Record<string, unknown> = {
        nome: (input.customerName || 'Cliente LyVest').slice(0, 120),
        tipoPessoa: doc.length === 14 ? 'J' : 'F',
    };
    if (doc.length === 11 || doc.length === 14) {
        contato.numeroDocumento = doc;
    }
    if (input.customerEmail) {
        contato.email = String(input.customerEmail).slice(0, 100);
    }

    const itens = input.items
        .filter((i) => i.quantity > 0 && Number.isFinite(i.price))
        .map((i) => {
            const item: Record<string, unknown> = {
                descricao: (i.name || 'Produto').slice(0, 120),
                quantidade: i.quantity,
                valor: Number(i.price),
                unidade: 'UN',
            };
            if (i.sku) item.codigo = String(i.sku).slice(0, 60);
            if (i.blingProductId && Number.isInteger(i.blingProductId) && i.blingProductId > 0) {
                item.produto = { id: i.blingProductId };
            }
            return item;
        });

    const body: Record<string, unknown> = {
        data: toBlingDate(input.createdAt),
        numeroLoja: String(input.orderId),
        contato,
        itens,
        observacoes: `Pedido LyVest ${input.orderId}`,
        observacoesInternas: [
            input.paymentMethod ? `Pagamento: ${input.paymentMethod}` : null,
            input.customerEmail ? `E-mail: ${input.customerEmail}` : null,
        ]
            .filter(Boolean)
            .join(' | '),
    };

    if (input.lojaId && Number.isInteger(input.lojaId) && input.lojaId > 0) {
        body.loja = { id: input.lojaId };
    }

    const frete = Number(input.shipping?.price ?? 0);
    if (Number.isFinite(frete) && frete > 0) {
        body.transporte = {
            fretePorConta: 1, // 1 = conta do destinatário / cobrado (comum em e-commerce)
            frete,
        };
    }

    return body;
}
