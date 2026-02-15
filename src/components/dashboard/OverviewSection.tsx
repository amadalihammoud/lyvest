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
            <div className="bg-gradient-to-br from-[#800020] to-[#A00030] rounded-[2rem] p-8 md:p-10 text-white shadow-xl shadow-rose-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>

                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">
                        Olá, {getFirstName(user.name)}!
                    </h2>
                    <p className="text-rose-100 text-lg md:text-xl font-light leading-relaxed">
                        Que alegria ter você por aqui. <br className="hidden md:block" />
                        Como podemos ajudar você hoje?
                    </p>
                </div>
            </div>

            {/* Featured Order Card (if exists) */}
            {featuredOrder && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Truck className="w-5 h-5 text-lyvest-500" />
                            {activeOrder ? 'Acompanhe seu Pedido' : 'Último Pedido'}
                        </h3>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className="text-sm font-medium text-lyvest-500 hover:text-lyvest-700 hover:underline"
                        >
                            Ver todos
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-800">Pedido #{featuredOrder.id}</span>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(featuredOrder.status)}`}>
                                        {featuredOrder.status}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm">
                                    {featuredOrder.date} • {featuredOrder.items.length} {featuredOrder.items.length === 1 ? 'item' : 'itens'}
                                </p>
                                <p className="font-bold text-lg text-slate-800 pt-1">
                                    {formatCurrency(featuredOrder.total)}
                                </p>
                            </div>

                            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                                {featuredOrder.trackingCode && (
                                    <button
                                        onClick={() => onTrackOrder(featuredOrder.trackingCode!)}
                                        className="flex-1 md:flex-none px-6 py-2.5 bg-lyvest-500 text-white font-bold rounded-xl hover:bg-lyvest-600 transition-all shadow-lg shadow-rose-200 active:scale-95"
                                    >
                                        Rastrear Agora
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all active:scale-95"
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
                <h3 className="font-bold text-slate-800 text-lg mb-4 px-2">Acesso Rápido</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

// Helper component for uniform buttons
function QuickAction({ icon: Icon, label, subLabel, onClick, color }: any) {
    const colorStyles: any = {
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
        rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
        purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    };

    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group text-center h-full"
        >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${colorStyles[color]}`}>
                <Icon className="w-7 h-7" />
            </div>
            <span className="font-bold text-slate-800 mb-1">{label}</span>
            <span className="text-xs text-slate-400 font-medium">{subLabel}</span>
        </button>
    );
}

export default memo(OverviewSection);
