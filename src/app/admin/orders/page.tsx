import { supabase } from '@/lib/supabase';
import { Package, Search, Filter, Eye, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Gerenciar Pedidos - Ly Vest',
};

// Map status to UI
const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'pending': { label: 'Aguardando', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="w-3 h-3" /> },
    'processing': { label: 'Em Separação', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Package className="w-3 h-3" /> },
    'shipped': { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: <Truck className="w-3 h-3" /> },
    'delivered': { label: 'Entregue', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle className="w-3 h-3" /> },
    'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-3 h-3" /> }
};

export default async function OrdersPage() {
    // Busca Padrão
    // Em produção real com RLS ativado, isso precisará do SUPABASE_SERVICE_ROLE_KEY.
    // Como estamos no MVP Server Side e a rota já é protegida pelo Clerk Admin, podemos usar o cliente existente.
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    const safeOrders = orders || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gerenciamento de Pedidos</h1>
                    <p className="text-slate-500 text-sm mt-1">Acompanhe, atualize e despache suas vendas.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou ID..."
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-lyvest-500 focus:ring-1 focus:ring-lyvest-500"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        <Filter className="w-4 h-4" /> Filtros
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
                                <th className="p-4 pl-6">Pedido</th>
                                <th className="p-4">Data</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center pr-6">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {safeOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500">
                                        Nenhum pedido encontrado.
                                    </td>
                                </tr>
                            ) : (
                                safeOrders.map((order) => {
                                    const statusArgs = statusMap[order.status || 'pending'] || statusMap['pending'];

                                    // Hack seguro para tipar o JSON parsing (no MVP o JSON armazena recipient)
                                    // A estrutura depende de como salvarmos o checkout real.
                                    const addressJSON = order.shipping_address as Record<string, any>;
                                    const customerName = addressJSON?.recipient || 'Cliente Anônimo';

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4 pl-6 font-mono text-xs text-slate-500">
                                                #{order.id.split('-')[0].toUpperCase()}
                                            </td>
                                            <td className="p-4 text-slate-600">
                                                {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="p-4 font-medium text-slate-800">
                                                {customerName}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusArgs.color}`}>
                                                    {statusArgs.icon}
                                                    {statusArgs.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-800">
                                                R$ {order.total_amount.toFixed(2).replace('.', ',')}
                                            </td>
                                            <td className="p-4 text-center pr-6">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-lyvest-600 hover:bg-lyvest-50 rounded-lg transition-colors"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
