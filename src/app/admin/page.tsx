import { count, ne, sum } from 'drizzle-orm';

import { orders, products } from '@/db/schema';
import { db, isDbConfigured } from '@/server/dbClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    if (!isDbConfigured()) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
                Erro: DATABASE_URL não configurada no servidor.
            </div>
        );
    }

    // Estatísticas básicas (agregação no banco, não em memória)
    const [ordersAgg] = await db.select({ value: count() }).from(orders);
    const [productsAgg] = await db.select({ value: count() }).from(products);
    const [revenueAgg] = await db
        .select({ value: sum(orders.totalAmount) })
        .from(orders)
        .where(ne(orders.status, 'cancelled'));

    const ordersCount = ordersAgg?.value ?? 0;
    const productsCount = productsAgg?.value ?? 0;
    const totalRevenue = Number(revenueAgg?.value ?? 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Total de Pedidos</h3>
                    <p className="text-3xl font-bold text-slate-800">{ordersCount || 0}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Total de Produtos</h3>
                    <p className="text-3xl font-bold text-slate-800">{productsCount || 0}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Receita Total</h3>
                    <p className="text-3xl font-bold text-lyvest-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                    </p>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Bem-vindo ao Painel Administrativo</h2>
                <p className="text-slate-600">
                    Use o menu lateral para gerenciar pedidos, produtos e configurações da loja LyVest.
                    Novos recursos de gestão financeira e de estoque estão em desenvolvimento.
                </p>
            </div>
        </div>
    );
}
