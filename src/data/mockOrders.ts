export interface OrderItem {
    id?: string | number;
    name: string;
    qty: number;
    price: number;
    image: string;
}

export interface OrderHistory {
    status: string;
    date: string;
    label: string;
}

export interface PaymentMethod {
    type: string;
    brand?: string;
    lastDigits?: string;
    installments?: number;
}

export interface ShippingAddress {
    recipient: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface Order {
    id: string;
    date: string;
    paymentMethod: PaymentMethod;
    shippingAddress: ShippingAddress;
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;
    status: string;
    trackingCode: string | null;
    invoiceUrl: string | null;
    items: OrderItem[];
    history: OrderHistory[];
}

export const mockOrders: Order[] = [
    {
        id: "PED-9821",
        date: "10/01/2026",
        paymentMethod: {
            type: "credit_card",
            brand: "Visa",
            lastDigits: "1234",
            installments: 3
        },
        shippingAddress: {
            recipient: "Maria Silva",
            street: "Rua das Flores, 123",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode: "01234-567"
        },
        subtotal: 109.80,
        shippingCost: 0,
        discount: 0,
        total: 109.80,
        status: "Em Trânsito",
        trackingCode: "BR123456789",
        invoiceUrl: "#",
        items: [
            { id: 1, name: "Kit 3 Calcinhas Algodão Soft", qty: 1, price: 49.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Kit+Calcinhas" },
            { id: 2, name: "Sutiã Renda Comfort Sem Bojo", qty: 1, price: 59.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Sutiã+Renda" }
        ],
        history: [
            { status: "approved", date: "10/01/2026 10:30", label: "Pagamento Aprovado" },
            { status: "processing", date: "10/01/2026 11:00", label: "Pedido em Separação" },
            { status: "shipping", date: "11/01/2026 14:00", label: "Enviado para Transportadora" },
            { status: "transit", date: "12/01/2026 09:00", label: "Em trânsito para CTCE" }
        ]
    },
    {
        id: "PED-9540",
        date: "05/01/2026",
        paymentMethod: {
            type: "pix",
        },
        shippingAddress: {
            recipient: "Maria Silva",
            street: "Rua das Flores, 123",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode: "01234-567"
        },
        subtotal: 89.90,
        shippingCost: 15.00,
        discount: 0,
        total: 104.90,
        status: "Entregue",
        trackingCode: "BR987654321",
        invoiceUrl: "#",
        items: [
            { id: 5, name: "Sutiã Push-Up Básico", qty: 1, price: 69.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Sutla+Push-Up" },
            { id: 8, name: "Meia Sapatilha Antiderrapante", qty: 1, price: 22.00, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Meia+Sapatilha" }
        ],
        history: [
            { status: "delivered", date: "08/01/2026 15:30", label: "Pedido Entregue" },
            { status: "transit", date: "06/01/2026 09:00", label: "Saiu para Entrega" },
            { status: "shipping", date: "05/01/2026 14:00", label: "Enviado para Transportadora" },
            { status: "approved", date: "05/01/2026 10:30", label: "Pagamento Aprovado" }
        ]
    },
    {
        id: "PED-9901",
        date: "27/01/2026",
        paymentMethod: {
            type: "boleto",
        },
        shippingAddress: {
            recipient: "Maria Silva",
            street: "Rua das Flores, 123",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode: "01234-567"
        },
        subtotal: 199.90,
        shippingCost: 0,
        discount: 10.00,
        total: 189.90,
        status: "Aprovado",
        trackingCode: null,
        invoiceUrl: null,
        items: [
            { id: 4, name: "Kit 5 Pares de Meias Invisíveis", qty: 2, price: 35.00, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Kit+Meias" },
            { id: 3, name: "Cueca Boxer Feminina Modal", qty: 3, price: 29.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Cueca+Boxer" },
            { id: 6, name: "Calcinha Fio Dental Renda", qty: 2, price: 19.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Calcinha+Renda" }
        ],
        history: [
            { status: "approved", date: "27/01/2026 22:15", label: "Pagamento Aprovado" },
            { status: "processing", date: "27/01/2026 22:10", label: "Aguardando Confirmação" }
        ]
    }
];
