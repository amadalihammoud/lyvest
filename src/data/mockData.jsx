import React from 'react';
import {
    Scissors, // Calcinha/Corte
    Heart,    // Sutiã/Amor
    Star,     // Todos
    Layers,   // Cueca/Camadas
    Footprints, // Meias
    Gift,       // Kits
    Baby,       // Maternidade (Future)
    Shirt       // Pijamas (Future)
} from 'lucide-react';

// --- DADOS DOS PRODUTOS ---
export const productsData = [
    {
        id: 1,
        name: "Kit 3 Calcinhas Algodão Soft",
        category: "Calcinhas",
        price: 49.90,
        rating: 5,
        reviews: 156,
        image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Kit+Calcinhas",
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
        image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Sutiã+Renda",
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
        category: "Cuecas",
        price: 29.90,
        rating: 5,
        reviews: 210,
        image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Cueca+Boxer",
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
        image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Kit+Meias",
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
        image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Sutiã+Push-Up",
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
        image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Calcinha+Renda",
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
        image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Cueca+Slip",
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
        image: "https://placehold.co/600x600/f3e8ff/8A05BE?text=Meia+Sapatilha",
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
    }
];

// --- FILTROS VISUAIS ---
export const quickFilters = [
    { name: "Todos", translationKey: 'products.categories.all', icon: <Star className="w-5 h-5" />, color: "bg-slate-100 text-slate-600" },
    { name: "Calcinhas", translationKey: 'products.categories.panties', fullCategory: "Calcinhas", icon: <Scissors className="w-5 h-5" />, color: "bg-pink-100 text-pink-600" },
    { name: "Sutiãs", translationKey: 'products.categories.bras', icon: <Heart className="w-5 h-5" />, color: "bg-purple-100 text-purple-600" },
    { name: "Cuecas", translationKey: 'products.categories.boxers', icon: <Layers className="w-5 h-5" />, color: "bg-blue-100 text-blue-600" },
    { name: "Meias", translationKey: 'products.categories.socks', icon: <Footprints className="w-5 h-5" />, color: "bg-teal-100 text-teal-600" },
    { name: "Kits", translationKey: 'products.categories.kits', icon: <Gift className="w-5 h-5" />, color: "bg-orange-100 text-orange-600" },
];

export const testimonials = [
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
export const mainMenu = [
    { label: "Início", translationKey: 'nav.home', action: "reset" },
    { label: "Calcinhas", translationKey: 'products.categories.panties', action: "filter", category: "Calcinhas" },
    { label: "Sutiãs", translationKey: 'products.categories.bras', action: "filter", category: "Sutiãs" },
    { label: "Cuecas", translationKey: 'products.categories.boxers', action: "filter", category: "Cuecas" },
    { label: "Meias", translationKey: 'products.categories.socks', action: "filter", category: "Meias" },
    { label: "Kits", translationKey: 'products.categories.kits', action: "filter", category: "Kits" }
];

// --- DADOS DO USUÁRIO MOCK ---
export const mockUser = {
    name: "Amada",
    email: "amada@lyvest.com",
    avatar: "https://ui-avatars.com/api/?name=Amada&background=fbcfe8&color=db2777&bold=true"
};

// --- DADOS DE PEDIDOS MOCK ---
export const mockOrders = [
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
    }
];
