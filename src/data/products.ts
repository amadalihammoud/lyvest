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

export const productsData: Product[] = [
    {
        id: 1,
        name: "Kit 3 Calcinhas Algodão Soft",
        category: "Calcinhas",
        price: 49.90,
        rating: 5,
        reviews: 156,
        image: "/images/products/kit-calcinhas-algodao.png?v=2",
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
        image: "/images/products/sutia-renda-comfort.png?v=2",
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
        image: "/images/products/boxer-feminina-modal.png?v=2",
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
        image: "/images/products/kit-meias-invisiveis.png?v=2",
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
        image: "/images/products/sutia-pushup-nude.png?v=2",
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
        image: "/images/products/calcinha-fio-dental.png?v=2",
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
        image: "/images/products/cueca-slip-masculina.png?v=2",
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
        image: "/images/products/meia-sapatilha-antiderrapante.png?v=2",
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
        image: "/images/products/pijama-feminino-floral.png?v=2",
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
        image: "/images/products/pijama-masculino-listrado.png?v=2",
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
        image: "/images/products/roupao-felpudo-branco.png?v=2",
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
