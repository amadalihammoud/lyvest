import { memo } from 'react';
import { Package, Truck, CheckCircle, Clock, ChevronRight } from 'lucide-react';
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
    const { formatCurrency } = useI18n();

    // Get the most recent active order (not delivered/cancelled) or just the latest one
    const latestOrder = orders.length > 0 ? orders[0] : null;
    const activeOrder = orders.find(o =>
        !o.status.toLowerCase().includes('entregue') &&
        !o.status.toLowerCase().includes('cancelado')
    );

    // Use active order for highlight, otherwise fallback to latest order for history
    const featuredOrder = activeOrder || latestOrder;

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('entregue')) return 'text-emerald-600 bg-emerald-50';
        if (s.includes('cancelado')) return 'text-red-600 bg-red-50';
        return 'text-[#800020] bg-rose-50';
    };

    const getFirstName = (fullName?: string) => {
        return fullName?.split(' ')[0] || '';
    };

    return (
        <div className="space-y-10 animate-fade-in max-w-4xl">
            {/* Minimalist Welcome */}
            <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-light text-slate-800 tracking-tight">
                    Olá, <span className="font-medium">{getFirstName(user.name)}</span>
                </h2>
                <p className="text-slate-500 text-lg font-light">
                    Bem-vindo ao seu espaço exclusivo.
                </p>
            </div>

            {/* Featured Order - Clean & Elegant */}
            {featuredOrder ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            {activeOrder ? 'Pedido em Andamento' : 'Último Pedido'}
                        </h3>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className="text-sm font-medium text-[#800020] hover:text-[#600018] transition-colors flex items-center gap-1 group"
                        >
                            Ver histórico
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <span className="font-serif text-2xl text-slate-800">#{featuredOrder.id}</span>
                                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1.5 ${getStatusColor(featuredOrder.status)}`}>
                                        {featuredOrder.status.toLowerCase().includes('entregue') && <CheckCircle className="w-3 h-3" />}
                                        {featuredOrder.status.toLowerCase().includes('trânsito') && <Clock className="w-3 h-3" />}
                                        {featuredOrder.status}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-slate-500 text-sm">
                                        Realizado em <span className="text-slate-700 font-medium">{featuredOrder.date}</span>
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                        Total: <span className="text-slate-900 font-medium">{formatCurrency(featuredOrder.total)}</span>
                                        <span className="mx-2 text-slate-300">|</span>
                                        {featuredOrder.items.length} {featuredOrder.items.length === 1 ? 'item' : 'itens'}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                                {featuredOrder.trackingCode && (
                                    <button
                                        onClick={() => onTrackOrder(featuredOrder.trackingCode!)}
                                        className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Truck className="w-4 h-4" />
                                        Rastrear
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                                >
                                    Detalhes
                                </button>
                            </div>
                        </div>

                        {/* Minimalist Progress Indicator (Visual Aid) */}
                        {!featuredOrder.status.toLowerCase().includes('cancelado') && (
                            <div className="mt-8 pt-6 border-t border-slate-50">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                                    <span className={getStatusStep(featuredOrder.status) >= 1 ? 'text-[#800020]' : ''}>Recebido</span>
                                    <span className={getStatusStep(featuredOrder.status) >= 2 ? 'text-[#800020]' : ''}>Processando</span>
                                    <span className={getStatusStep(featuredOrder.status) >= 3 ? 'text-[#800020]' : ''}>Envio</span>
                                    <span className={getStatusStep(featuredOrder.status) >= 4 ? 'text-[#800020]' : ''}>Entregue</span>
                                </div>
                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#800020] transition-all duration-1000 ease-out"
                                        style={{ width: `${getStatusStep(featuredOrder.status) * 25}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-slate-800 font-medium mb-1">Nenhum pedido recente</h3>
                    <p className="text-slate-400 text-sm mb-6">Você ainda não fez nenhuma compra conosco.</p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-[#800020] text-white text-sm font-medium rounded-lg hover:bg-[#600018] transition-colors"
                    >
                        Começar a comprar
                    </Link>
                </div>
            )}
        </div>
    );
}

// Helper to calculate progress Step (0-4)
function getStatusStep(status: string): number {
    const s = status.toLowerCase();
    if (s.includes('cancelado')) return 0;
    if (s.includes('entregue')) return 4;
    if (s.includes('transito') || s.includes('trânsito') || s.includes('envio') || s.includes('enviado')) return 3;
    if (s.includes('pagamento') || s.includes('processando') || s.includes('aprovado')) return 2;
    return 1; // Default: Recebido/Pendente
}

export default memo(OverviewSection);
