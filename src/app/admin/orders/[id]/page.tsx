import { supabase } from '@/lib/supabase';
import { Package, Truck, User, MapPin, Calendar, CreditCard, ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const metadata = {
    title: 'Detalhes do Pedido - Ly Vest',
};

async function updateOrderStatus(formData: FormData) {
    'use server';
    const id = formData.get('order_id') as string;
    const status = formData.get('status') as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    const tracking_code = formData.get('tracking_code') as string;

    const { error } = await supabase
        .from('orders')
        .update({ status, tracking_code: tracking_code || null })
        .eq('id', id);

    if (error) {
        console.error('Falha ao atualizar pedido:', error);
    }

    // Força o Next.js a re-renderizar as telas com os novos dados do banco
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath('/admin/orders');
}

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !order) {
        return notFound();
    }

    const address = (order.shipping_address as Record<string, string>) || {};
    const items = (order.items as any[]) || [];

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header + Back */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link href="/admin/orders" className="text-lyvest-500 font-medium text-sm hover:underline inline-flex items-center gap-1 mb-2">
                        <ChevronLeft className="w-4 h-4" /> Voltar para Pedidos
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        Pedido <span className="text-slate-500 font-mono text-xl">#{order.id.split('-')[0].toUpperCase()}</span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal: Itens e Atualização de Status */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Painel de Gestão Operacional */}
                    <div className="bg-white rounded-xl shadow-sm border border-lyvest-100 p-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Truck className="w-5 h-5 text-lyvest-500" /> Gestão de Entrega
                        </h2>

                        <form action={updateOrderStatus} className="space-y-4">
                            <input type="hidden" name="order_id" value={order.id} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status do Pedido</label>
                                    <select
                                        name="status"
                                        defaultValue={order.status || 'pending'}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-lyvest-500 focus:ring-1 focus:ring-lyvest-500"
                                    >
                                        <option value="pending">Aguardando Pagamento</option>
                                        <option value="processing">Em Separação</option>
                                        <option value="shipped">Despachado (Enviado)</option>
                                        <option value="delivered">Entregue ao Cliente</option>
                                        <option value="cancelled">Cancelado</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cód. Rastreio (Correios)</label>
                                    <input
                                        type="text"
                                        name="tracking_code"
                                        defaultValue={order.tracking_code || ''}
                                        placeholder="Ex: BR123456789BR"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-lyvest-500 focus:ring-1 focus:ring-lyvest-500 font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-lyvest-500 text-white rounded-lg font-bold hover:bg-lyvest-600 transition-colors shadow-sm">
                                    <Save className="w-4 h-4" /> Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Itens do Pedido */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Package className="w-5 h-5 text-slate-400" /> Produtos Solicitados ({items.length})
                        </h2>

                        <div className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <p className="text-slate-500 text-sm py-4">Estrutura de itens vazia (pedido antigo ou mockado).</p>
                            ) : (
                                items.map((item, idx) => (
                                    <div key={idx} className="py-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            {item.image && (
                                                <div className="w-16 h-16 bg-slate-100 rounded-lg shrink-0 overflow-hidden">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-800">{item.name || 'Produto Não Identificado'}</p>
                                                <p className="text-sm text-slate-500">
                                                    {item.size ? `Tamanho: ${item.size}` : ''}
                                                    {item.color ? ` | Cor: ${item.color}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-slate-800">{item.quantity}x R$ {Number(item.price).toFixed(2).replace('.', ',')}</p>
                                            <p className="text-sm text-slate-500 font-bold">R$ {(item.quantity * item.price).toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna Lateral: Dados do Cliente e Resumo */}
                <div className="space-y-6">
                    {/* Resumo Financeiro */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <CreditCard className="w-4 h-4 text-slate-500" /> Resumo Pago
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span>R$ {order.total_amount.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Frete</span>
                                <span>R$ 0,00</span>
                            </div>
                            <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-lg text-slate-800">
                                <span>Total</span>
                                <span className="text-emerald-600">R$ {order.total_amount.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="pt-2">
                                <span className="inline-block bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded uppercase">
                                    {order.payment_method || 'PIX'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Endereço de Entrega */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <MapPin className="w-4 h-4 text-slate-500" /> Endereço de Entrega
                        </h3>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p className="font-bold text-slate-800">{address.recipient || 'Cliente Anônimo'}</p>
                            <p>{address.street}, {address.number} {address.complement && `- ${address.complement}`}</p>
                            <p>{address.neighborhood}</p>
                            <p>{address.city} - {address.state}</p>
                            <p className="font-mono mt-2 pt-2 border-t border-slate-100">CEP: {address.zip_code}</p>
                        </div>
                    </div>

                    {/* Dados da Compra */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Calendar className="w-4 h-4 text-slate-500" /> Metadados
                        </h3>
                        <div className="text-sm text-slate-600 space-y-2">
                            <p><span className="font-medium">Data:</span> {new Date(order.created_at).toLocaleString('pt-BR')}</p>
                            <p><span className="font-medium">User ID:</span> <span className="font-mono text-xs">{order.user_id?.substring(0, 12)}...</span></p>
                            <p><span className="font-medium">Order ID:</span> <span className="font-mono text-xs">{order.id?.substring(0, 8)}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
