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
