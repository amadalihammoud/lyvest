import {
    Scissors,
    Heart,
    Star,
    Layers,
    Footprints,
    Gift,
} from 'lucide-react';
import { ReactElement } from 'react';

// --- INTERFACES ---
export interface ProductColor {
    name: string;
    hex: string;
}

export interface ProductSpecs {
    [key: string]: string;
}

export interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    rating: number;
    reviews: number;
    image: string;
    description: string;
    badge: string | null;
    ean: string;
    sizes: string[];
    colors: ProductColor[];
    specs: ProductSpecs;
}

export interface QuickFilter {
    name: string;
    translationKey: string;
    fullCategory?: string;
    icon: ReactElement;
    color: string;
}

export interface Testimonial {
    id: number;
    name: string;
    role: string;
    text: string;
    avatar: string;
}

export interface MenuItem {
    label: string;
    translationKey: string;
    action: string;
    category?: string;
}

export interface MockUser {
    name: string;
    email: string;
    avatar: string;
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

export interface OrderItem {
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

// --- DADOS DOS PRODUTOS ---
export const productsData: Product[] = [
    {
        id: 1,
        name: "Kit 3 Calcinhas Algodão Soft",
        category: "Calcinhas",
        price: 49.90,
        rating: 5,
        reviews: 156,
        image: "/images/products/kit-calcinhas-algodao.png",
        description: "Conforto absoluto para o dia a dia. Tecido respirável e toque macio.",
        badge: "Mais Vendido",
        ean: "7891234561001",
        sizes: ["P", "M", "G", "GG"],
        colors: [
            { name: "Preto", hex: "#000000" },
            { name: "Branco", hex: "#FFFFFF" },
            { name: "Nude", hex: "#F5D0C5" }
        ],
        specs: {
            "Material": "96% Algodão, 4% Elastano",
            "Cores": "Preto, Branco, Nude",
            "Modelagem": "Biquíni",
            "Forro": "100% Algodão"
        }
    },
    {
        id: 2,
        name: "Sutiã Renda Comfort Sem Bojo",
        category: "Sutiãs",
        price: 59.90,
        rating: 5,
        reviews: 98,
        image: "/images/products/sutia-renda-comfort.png",
        description: "Beleza e conforto juntos. Sutiã em renda floral sem aro e sem bojo.",
        badge: "Novo",
        ean: "7891234561002",
        sizes: ["P", "M", "G"],
        colors: [
            { name: "Vinho", hex: "#800020" },
            { name: "Preto", hex: "#000000" }
        ],
        specs: {
            "Material": "Renda Premium",
            "Alças": "Reguláveis",
            "Fecho": "Colchete duplo",
            "Sem Aro": "Sim"
        }
    },
    {
        id: 3,
        name: "Cueca Boxer Feminina Modal",
        category: "Calcinhas",
        price: 29.90,
        rating: 5,
        reviews: 210,
        image: "/images/products/boxer-feminina-modal.png",
        description: "Liberdade de movimento. Ideal para usar com vestidos ou para dormir.",
        badge: null,
        ean: "7891234561003",
        sizes: ["P", "M", "G", "GG", "XG"],
        colors: [
            { name: "Cinza", hex: "#808080" },
            { name: "Preto", hex: "#000000" },
            { name: "Rosa", hex: "#FFC0CB" }
        ],
        specs: {
            "Material": "Modal com Elastano",
            "Cós": "Elástico suave",
            "Cobertura": "Total",
            "Toque": "Geladinho"
        }
    },
    {
        id: 4,
        name: "Kit 5 Pares de Meias Invisíveis",
        category: "Meias",
        price: 35.00,
        rating: 4,
        reviews: 45,
        image: "/images/products/kit-meias-invisiveis.png",
        description: "Não aparecem no tênis! Com silicone no calcanhar para não sair do lugar.",
        badge: null,
        ean: "7891234561004",
        sizes: ["Único"],
        colors: [
            { name: "Branco", hex: "#FFFFFF" },
            { name: "Mescla", hex: "#A9A9A9" }
        ],
        specs: {
            "Quantidade": "Kit com 5 pares",
            "Cano": "Invisível",
            "Material": "Algodão Penteado",
            "Tamanho": "34 ao 39"
        }
    },
    {
        id: 5,
        name: "Sutiã Push-Up Básico",
        category: "Sutiã",
        price: 69.90,
        rating: 5,
        reviews: 330,
        image: "/images/products/sutia-pushup-nude.png",
        description: "Realça o colo com naturalidade. Perfeito para decotes.",
        badge: "Promoção",
        ean: "7891234561005",
        sizes: ["40", "42", "44", "46"],
        colors: [
            { name: "Nude", hex: "#F5D0C5" },
            { name: "Preto", hex: "#000000" }
        ],
        specs: {
            "Bojo": "Com bolha (Push-up)",
            "Aro": "Sim",
            "Tecido": "Microfibra lisa",
            "Cores": "Nude, Preto"
        }
    },
    {
        id: 6,
        name: "Calcinha Fio Dental Renda",
        category: "Calcinhas",
        price: 19.90,
        rating: 4,
        reviews: 67,
        image: "/images/products/calcinha-fio-dental.png",
        description: "Sensualidade e delicadeza. Laterais estreitas e renda macia que não marca.",
        badge: null,
        ean: "7891234561006",
        sizes: ["P", "M", "G"],
        colors: [
            { name: "Vermelho", hex: "#FF0000" },
            { name: "Preto", hex: "#000000" },
            { name: "Branco", hex: "#FFFFFF" }
        ],
        specs: {
            "Material": "Renda Elástica",
            "Forro": "100% Algodão",
            "Modelagem": "Fio Dental",
            "Detalhe": "Laço de cetim"
        }
    },
    {
        id: 7,
        name: "Cueca Slip Algodão Dia a Dia",
        category: "Cuecas",
        price: 25.00,
        rating: 5,
        reviews: 112,
        image: "/images/products/cueca-slip-masculina.png",
        description: "O modelo clássico reinventado com corte moderno e elástico confortável.",
        badge: null,
        ean: "7891234561007",
        sizes: ["P", "M", "G", "GG"],
        colors: [
            { name: "Mescla", hex: "#A9A9A9" },
            { name: "Branco", hex: "#FFFFFF" },
            { name: "Azul Marinho", hex: "#000080" }
        ],
        specs: {
            "Material": "Algodão Sustentável",
            "Modelo": "Slip / Brief",
            "Cintura": "Média",
            "Cores": "Mescla, Branco, Azul"
        }
    },
    {
        id: 8,
        name: "Meia Sapatilha Antiderrapante",
        category: "Meias",
        price: 22.00,
        rating: 4,
        reviews: 98,
        image: "/images/products/meia-sapatilha-antiderrapante.png",
        description: "Perfeita para Pilates, Yoga ou andar descalça em casa com segurança.",
        badge: "Últimas Unidades",
        ean: "7891234561008",
        sizes: ["34-39"],
        colors: [
            { name: "Preto", hex: "#000000" },
            { name: "Rosa", hex: "#FFC0CB" }
        ],
        specs: {
            "Solado": "Aplicação emborrachada",
            "Estilo": "Boneca / Sapatilha",
            "Tecido": "Algodão macio",
            "Tamanho": "Único (34-39)"
        }
    },
    {
        id: 9,
        name: "Pijama Feminino Manga Longa Floral",
        category: "Pijamas",
        price: 89.90,
        rating: 5,
        reviews: 72,
        image: "/images/products/pijama-feminino-floral.png",
        description: "Conjunto completo com calça e blusa em viscose macia. Estampa floral delicada.",
        badge: "Novo",
        ean: "7891234561009",
        sizes: ["P", "M", "G", "GG"],
        colors: [
            { name: "Rose", hex: "#FFC0CB" },
            { name: "Azul Claro", hex: "#ADD8E6" }
        ],
        specs: {
            "Material": "Viscose Premium",
            "Manga": "Longa",
            "Calça": "Comprida com elástico",
            "Estampa": "Floral aquarelada"
        }
    },
    {
        id: 10,
        name: "Conjunto Pijama Masculino Listrado",
        category: "Pijamas",
        price: 79.90,
        rating: 4,
        reviews: 38,
        image: "/images/products/pijama-masculino-listrado.png",
        description: "Conforto absoluto para noites de sono de qualidade. Tecido respirável.",
        badge: null,
        ean: "7891234561010",
        sizes: ["M", "G", "GG", "XG"],
        colors: [
            { name: "Azul Marinho", hex: "#000080" },
            { name: "Cinza", hex: "#808080" }
        ],
        specs: {
            "Material": "Algodão Pima",
            "Manga": "Curta",
            "Short": "Com bolsos laterais",
            "Listras": "Horizontais clássicas"
        }
    },
    {
        id: 11,
        name: "Roupão Felpudo Unissex Spa",
        category: "Pijamas",
        price: 149.90,
        rating: 5,
        reviews: 91,
        image: "/images/products/roupao-felpudo-branco.png",
        description: "Luxo e conforto para momentos de relaxamento. Felpa 100% algodão.",
        badge: "Premium",
        ean: "7891234561011",
        sizes: ["Único"],
        colors: [
            { name: "Branco", hex: "#FFFFFF" },
            { name: "Bege", hex: "#F5F5DC" }
        ],
        specs: {
            "Material": "Felpudo 450g/m²",
            "Bolsos": "2 laterais",
            "Comprimento": "Médio (até joelho)",
            "Cinto": "Ajustável com passante"
        }
    }
];

// --- FILTROS VISUAIS ---
export const quickFilters: QuickFilter[] = [
    { name: "Todos", translationKey: 'products.categories.all', icon: <Star className="w-5 h-5" />, color: "bg-slate-100 text-slate-600" },
    { name: "Calcinhas", translationKey: 'products.categories.panties', fullCategory: "Calcinhas", icon: <Scissors className="w-5 h-5" />, color: "bg-pink-100 text-pink-600" },
    { name: "Sutiãs", translationKey: 'products.categories.bras', icon: <Heart className="w-5 h-5" />, color: "bg-purple-100 text-purple-600" },
    { name: "Cuecas", translationKey: 'products.categories.boxers', icon: <Layers className="w-5 h-5" />, color: "bg-blue-100 text-blue-600" },
    { name: "Meias", translationKey: 'products.categories.socks', icon: <Footprints className="w-5 h-5" />, color: "bg-teal-100 text-teal-600" },
    { name: "Kits", translationKey: 'products.categories.kits', icon: <Gift className="w-5 h-5" />, color: "bg-orange-100 text-orange-600" },
];

export const testimonials: Testimonial[] = [
    {
        id: 1,
        name: "Carla M.",
        role: "Advogada",
        text: "As calcinhas de algodão são maravilhosas, super confortáveis para passar o dia todo trabalhando. Recomendo!",
        avatar: "CM"
    },
    {
        id: 2,
        name: "Fernanda S.",
        role: "Arquiteta",
        text: "Adorei o sutiã sem bojo, veste super bem e a renda é muito macia. A entrega foi rápida e o cheirinho é ótimo.",
        avatar: "FS"
    },
    {
        id: 3,
        name: "Juliana R.",
        role: "Empresária",
        text: "Comprei o kit de cuecas boxer e amei a liberdade de movimento. Ótimo para dormir também!",
        avatar: "JR"
    }
];

// --- MENU PRINCIPAL (Mapeado para Categorias) ---
export const mainMenu: MenuItem[] = [
    { label: "Início", translationKey: 'nav.home', action: "reset" },
    { label: "Calcinhas", translationKey: 'products.categories.panties', action: "filter", category: "Calcinhas" },
    { label: "Sutiãs", translationKey: 'products.categories.bras', action: "filter", category: "Sutiãs" },
    { label: "Cuecas", translationKey: 'products.categories.boxers', action: "filter", category: "Cuecas" },
    { label: "Meias", translationKey: 'products.categories.socks', action: "filter", category: "Meias" },
    { label: "Kits", translationKey: 'products.categories.kits', action: "filter", category: "Kits" }
];

// --- DADOS DO USUÁRIO MOCK ---
export const mockUser: MockUser = {
    name: "Amada",
    email: "amada@lyvest.com",
    avatar: "https://ui-avatars.com/api/?name=Amada&background=fbcfe8&color=db2777&bold=true"
};

// --- DADOS DE PEDIDOS MOCK ---
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
            { name: "Kit 3 Calcinhas Algodão Soft", qty: 1, price: 49.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Kit+Calcinhas" },
            { name: "Sutiã Renda Comfort Sem Bojo", qty: 1, price: 59.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Sutiã+Renda" }
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
            { name: "Sutiã Push-Up Básico", qty: 1, price: 69.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Sutla+Push-Up" },
            { name: "Meia Sapatilha Antiderrapante", qty: 1, price: 22.00, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Meia+Sapatilha" }
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
            { name: "Kit 5 Pares de Meias Invisíveis", qty: 2, price: 35.00, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Kit+Meias" },
            { name: "Cueca Boxer Feminina Modal", qty: 3, price: 29.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Cueca+Boxer" },
            { name: "Calcinha Fio Dental Renda", qty: 2, price: 19.90, image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Calcinha+Renda" }
        ],
        history: [
            { status: "approved", date: "27/01/2026 22:15", label: "Pagamento Aprovado" },
            { status: "processing", date: "27/01/2026 22:10", label: "Aguardando Confirmação" }
        ]
    }
];
