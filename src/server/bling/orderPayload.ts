/**
 * Montagem do body POST /pedidos/vendas (Bling API v3) — pura, testável.
 *
 * Contato: nome + tipo pessoa; documento opcional (CPF/CNPJ só dígitos).
 * Itens: preferem produto.id (blingId da variante ou do produto pai).
 * Transporte: frete + endereço de entrega quando disponível.
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

function buildTransporte(shipping?: OrderShippingForBling | null): Record<string, unknown> | null {
    if (!shipping) return null;

    const frete = Number(shipping.price ?? 0);
    const cep = onlyDigits(shipping.zipCode);
    const hasAddress = Boolean(
        shipping.street || shipping.city || shipping.state || cep.length === 8
    );

    if (!(Number.isFinite(frete) && frete > 0) && !hasAddress) {
        return null;
    }

    const transporte: Record<string, unknown> = {
        fretePorConta: 1,
    };

    if (Number.isFinite(frete) && frete >= 0) {
        transporte.frete = frete;
    }

    if (hasAddress) {
        const endereco: Record<string, unknown> = {};
        if (shipping.street) endereco.endereco = String(shipping.street).slice(0, 100);
        if (shipping.number) endereco.numero = String(shipping.number).slice(0, 20);
        if (shipping.complement) endereco.complemento = String(shipping.complement).slice(0, 100);
        if (shipping.neighborhood) endereco.bairro = String(shipping.neighborhood).slice(0, 60);
        if (shipping.city) endereco.municipio = String(shipping.city).slice(0, 60);
        if (shipping.state) endereco.uf = String(shipping.state).slice(0, 2).toUpperCase();
        if (cep.length === 8) endereco.cep = cep;
        if (Object.keys(endereco).length > 0) {
            transporte.contato = {
                nome: (shipping.recipient || 'Destinatário').slice(0, 120),
                endereco,
            };
        }
    }

    return transporte;
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

    const transporte = buildTransporte(input.shipping);
    if (transporte) {
        body.transporte = transporte;
    }

    return body;
}
