import { desc } from 'drizzle-orm';

import { orders as ordersTable } from '@/db/schema';
import { db, isDbConfigured } from '@/server/dbClient';

export const dynamic = 'force-dynamic';

export default async function AdminPedidosPage() {
    if (!isDbConfigured()) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
                Erro: DATABASE_URL não configurada no servidor.
            </div>
        );
    }

    // Buscar pedidos mais recentes (apenas para exibição inicial no admin)
    let orders: Array<{
        id: string;
        created_at: Date | null;
        status: string | null;
        total_amount: string;
        payment_method: string;
    }>;
    try {
        orders = await db
            .select({
                id: ordersTable.id,
                created_at: ordersTable.createdAt,
                status: ordersTable.status,
                total_amount: ordersTable.totalAmount,
                payment_method: ordersTable.paymentMethod,
            })
            .from(ordersTable)
            .orderBy(desc(ordersTable.createdAt))
            .limit(50);
    } catch (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
                Erro ao carregar pedidos: {error instanceof Error ? error.message : 'desconhecido'}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-800">Gerenciamento de Pedidos</h1>
            
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ID do Pedido</th>
                                <th className="px-6 py-4 font-semibold">Data</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Total</th>
                                <th className="px-6 py-4 font-semibold">Pagamento</th>
                                <th className="px-6 py-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders && orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            #{order.id.slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase
                                                ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.total_amount))}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 capitalize">
                                            {order.payment_method}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-lyvest-600 hover:text-lyvest-800 font-medium text-sm">
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Nenhum pedido encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
