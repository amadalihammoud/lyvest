import { memo } from 'react';
import { Package, Heart, User, ArrowRight, Truck, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { Order } from '../../types/dashboard';
import { User as UserType } from './UserDashboard';
import Link from 'next/link';

interface OverviewSectionProps {
    user: UserType;
    orders?: Order[];
    setActiveTab: (tab: string) => void;
    onTrackOrder: (code: string) => void;
}

function OverviewSection({ user, orders = [], setActiveTab, onTrackOrder }: OverviewSectionProps) {
    const { t, formatCurrency } = useI18n();

    // Get the most recent active order (not delivered/cancelled) or just the latest one
    const latestOrder = orders.length > 0 ? orders[0] : null;
    const activeOrder = orders.find(o =>
        !o.status.toLowerCase().includes('entregue') &&
        !o.status.toLowerCase().includes('cancelado')
    );

    // Use active order for highlight, otherwise fallback to latest order for history
    const featuredOrder = activeOrder || latestOrder;

    // Quick Stats
    const totalOrders = orders.length;
    // We don't have favorites count in props yet, so we'll just link to them

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('entregue')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (s.includes('cancelado')) return 'text-red-600 bg-red-50 border-red-100';
        return 'text-blue-600 bg-blue-50 border-blue-100';
    };

    const getFirstName = (fullName?: string) => {
        return fullName?.split(' ')[0] || '';
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="group relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-rose-900/20 transition-all hover:shadow-rose-900/30">
                {/* Dynamic Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#800020] via-[#900028] to-[#600018]"></div>

                {/* Noise Texture for Premium Feel */}
                <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

                {/* Abstract Shapes */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full -ml-16 -mb-16 blur-2xl mixture-blend-overlay"></div>

                <div className="relative z-10 max-w-3xl">
                    <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6 text-white tracking-tight drop-shadow-sm">
                        Olá, <span className="text-rose-100">{getFirstName(user.name)}</span>!
                    </h2>
                    <p className="text-rose-50 text-lg md:text-xl font-medium leading-relaxed max-w-2xl opacity-90">
                        Que alegria ter você por aqui. <br className="hidden md:block" />
                        Explore suas novidades e acompanhe seus pedidos com facilidade.
                    </p>
                </div>
            </div>

            {/* Featured Order Card (if exists) */}
            {featuredOrder && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Truck className="w-5 h-5 text-[#800020]" />
                            {activeOrder ? 'Acompanhe seu Pedido' : 'Último Pedido'}
                        </h3>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className="text-sm font-bold text-[#800020] hover:text-[#600018] hover:underline decoration-2 underline-offset-4 transition-all"
                        >
                            Ver todos
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100/50 hover:shadow-xl hover:shadow-slate-200/50 hover:border-rose-100 transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-bold text-slate-800 text-lg">Pedido #{featuredOrder.id}</span>
                                    <span className={`text-xs px-3 py-1 rounded-full font-bold border uppercase tracking-wide flex items-center gap-1.5 ${getStatusColor(featuredOrder.status)}`}>
                                        {featuredOrder.status.toLowerCase().includes('entregue') && <CheckCircle className="w-3 h-3" />}
                                        {featuredOrder.status.toLowerCase().includes('trânsito') && <Clock className="w-3 h-3" />}
                                        {featuredOrder.status}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm font-medium">
                                    {featuredOrder.date} • <span className="text-slate-700">{featuredOrder.items.length} {featuredOrder.items.length === 1 ? 'item' : 'itens'}</span>
                                </p>
                                <p className="font-bold text-2xl text-slate-900 pt-1 tracking-tight">
                                    {formatCurrency(featuredOrder.total)}
                                </p>
                            </div>

                            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                                {featuredOrder.trackingCode && (
                                    <button
                                        onClick={() => onTrackOrder(featuredOrder.trackingCode!)}
                                        className="flex-1 md:flex-none px-8 py-3 bg-[#800020] text-white font-bold rounded-xl hover:bg-[#600018] transition-all shadow-lg shadow-rose-900/20 hover:shadow-rose-900/30 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Truck className="w-4 h-4" />
                                        Rastrear Agora
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className="flex-1 md:flex-none px-8 py-3 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                                >
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions Grid */}
            <div>
                <h3 className="font-bold text-slate-800 text-lg mb-6 px-2">Acesso Rápido</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <QuickAction
                        icon={Package}
                        label="Meus Pedidos"
                        subLabel={`${totalOrders} pedidos`}
                        onClick={() => setActiveTab('orders')}
                        color="blue"
                    />
                    <QuickAction
                        icon={Heart}
                        label="Favoritos"
                        subLabel="Sua lista de desejos"
                        onClick={() => setActiveTab('favorites')}
                        color="rose"
                    />
                    <QuickAction
                        icon={User}
                        label="Meu Perfil"
                        subLabel="Dados e endereços"
                        onClick={() => setActiveTab('profile')}
                        color="purple"
                    />
                    <QuickAction
                        icon={ShoppingBag}
                        label="Loja"
                        subLabel="Continuar comprando"
                        onClick={() => window.location.href = '/'}
                        color="emerald"
                    />
                </div>
            </div>
        </div>
    );
}

// Helper component for uniform buttons with Premium Glass/Hover effect
function QuickAction({ icon: Icon, label, subLabel, onClick, color }: any) {
    const colorStyles: any = {
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white ring-blue-100',
        rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white ring-rose-100',
        purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-500 group-hover:text-white ring-purple-100',
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white ring-emerald-100',
    };

    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center justify-center p-6 md:p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 transform hover:-translate-y-1.5 h-full relative overflow-hidden"
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 shadow-sm group-hover:shadow-md ${colorStyles[color]}`}>
                <Icon className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="font-bold text-slate-800 text-lg mb-1.5 group-hover:text-[#800020] transition-colors">{label}</span>
            <span className="text-sm text-slate-500 font-medium group-hover:text-slate-600">{subLabel}</span>

            {/* Subtle shiny overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform -translate-x-full group-hover:translate-x-full"></div>
        </button>
    );
}

export default memo(OverviewSection);
