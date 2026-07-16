import { desc } from 'drizzle-orm';
import Image from 'next/image';

import { products as productsTable } from '@/db/schema';
import { db, isDbConfigured } from '@/server/dbClient';

export const dynamic = 'force-dynamic';

export default async function AdminProdutosPage() {
    if (!isDbConfigured()) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
                Erro: DATABASE_URL não configurada no servidor.
            </div>
        );
    }

    // Buscar produtos
    let products: Array<{
        id: string;
        name: string;
        slug: string;
        price: string;
        image_url: string | null;
        stock: number | null;
        sizes: string[] | null;
        active: boolean | null;
    }>;
    try {
        products = await db
            .select({
                id: productsTable.id,
                name: productsTable.name,
                slug: productsTable.slug,
                price: productsTable.price,
                image_url: productsTable.imageUrl,
                stock: productsTable.stock,
                sizes: productsTable.sizes,
                active: productsTable.active,
            })
            .from(productsTable)
            .orderBy(desc(productsTable.createdAt));
    } catch (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
                Erro ao carregar produtos: {error instanceof Error ? error.message : 'desconhecido'}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Gerenciamento de Produtos</h1>
                <button className="bg-lyvest-600 text-white px-4 py-2 rounded-md font-medium hover:bg-lyvest-700 transition-colors">
                    + Novo Produto
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Produto</th>
                                <th className="px-6 py-4 font-semibold">Preço</th>
                                <th className="px-6 py-4 font-semibold">Estoque</th>
                                <th className="px-6 py-4 font-semibold">Tamanhos</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products && products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {product.image_url && (
                                                    <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden relative flex-shrink-0">
                                                        <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="40px" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-800 line-clamp-1">{product.name}</p>
                                                    <p className="text-xs text-slate-500">Slug: {product.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(product.price))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${(product.stock ?? 0) > 10 ? 'text-green-600' : (product.stock ?? 0) > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                                {product.stock ?? 0} un
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {product.sizes && product.sizes.length > 0 ? (
                                                    product.sizes.map((s: string) => (
                                                        <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                                            {s}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">Único</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase
                                                ${product.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                                {product.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button className="text-lyvest-600 hover:text-lyvest-800 font-medium text-sm">
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Nenhum produto encontrado.
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
