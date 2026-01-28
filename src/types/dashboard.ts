export interface OrderItem {
    name: string;
    qty: number;
    price: number;
    image?: string;
}

export interface OrderHistoryEvent {
    label: string;
    date: string;
    status: 'delivered' | 'transit' | 'shipping' | 'processing' | string;
}

export interface PaymentMethod {
    type: 'credit' | 'pix' | 'boleto';
    brand?: string;
    lastDigits?: string;
    installments: number;
}

export interface ShippingAddress {
    recipient: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface UserAddress {
    id?: string;
    user_id?: string;
    recipient: string;
    zip_code: string;
    state: string;
    city: string;
    neighborhood: string;
    street: string;
    number: string;
    complement?: string;
    is_default: boolean;
    created_at?: string;
}

export interface Order {
    id: string | number;
    date: string;
    total: number;
    subtotal?: number;
    shippingCost?: number;
    discount?: number;
    status: string;
    trackingCode?: string;
    paymentMethod?: PaymentMethod;
    shippingAddress?: ShippingAddress;
    items: OrderItem[];
    history?: OrderHistoryEvent[];
    invoiceUrl?: string;
}
