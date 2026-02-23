import { Package, TrendingUp, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

export const metadata = {
    title: 'Admin Dashboard - Ly Vest',
};

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 md:hidden">Resumo da Loja</h1>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <DashboardCard
                    title="Vendas do Mês"
                    value="R$ 0,00"
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    trend="+0%"
                    color="bg-emerald-100"
                />
                <DashboardCard
                    title="Pedidos Pendentes"
                    value="0"
                    icon={<Package className="w-6 h-6 text-amber-600" />}
                    color="bg-amber-100"
                />
                <DashboardCard
                    title="Taxa de Conversão"
                    value="0%"
                    icon={<TrendingUp className="w-6 h-6 text-indigo-600" />}
                    color="bg-indigo-100"
                />
                <DashboardCard
                    title="Novos Clientes"
                    value="0"
                    icon={<Users className="w-6 h-6 text-fuchsia-600" />}
                    color="bg-fuchsia-100"
                />
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Últimos Pedidos</h2>
                    <Link href="/admin/orders" className="text-lyvest-500 font-medium text-sm hover:text-lyvest-600 transition-colors">
                        Ver todos os pedidos &rarr;
                    </Link>
                </div>

                <div className="p-12 flex flex-col items-center justify-center text-center bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                        <Package className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-700 font-bold mb-1">Nenhum pedido ainda</h3>
                    <p className="text-slate-500 text-sm max-w-sm">
                        Assim que o sistema de pagamento for integrado, seus novos pedidos aparecerão aqui automaticamente.
                    </p>
                </div>
            </div>
        </div>
    );
}

interface DashboardCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    trend?: string;
    color: string;
}

function DashboardCard({ title, value, icon, trend, color }: DashboardCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
                    {trend && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
