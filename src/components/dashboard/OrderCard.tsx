import { Package, MapPin, ChevronDown, ChevronUp, Copy, CreditCard, Truck, CheckCircle, Clock, FileText, Gift, ShoppingBag, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import ReviewModal from './ReviewModal';
import { useCart } from '../../hooks/useCart';
import { useI18n } from '../../hooks/useI18n';
import { Order, OrderItem } from '../../types/dashboard';



interface OrderCardProps {
    order: Order;
    onTrackOrder: (code: string) => void;
}

export default function OrderCard({ order, onTrackOrder }: OrderCardProps) {
    const { t, formatCurrency } = useI18n();
    const { addToCart } = useCart();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);

    // Review Modal State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedItemToReview, setSelectedItemToReview] = useState<OrderItem | null>(null);

    const handleBuyAgain = () => {
        order.items.forEach(item => {
            // Se tiver ID melhor, senão usa ID temporário baseado no nome (fallback)
            const itemId = item.id || `temp-${item.name.toLowerCase().replace(/\s+/g, '-')}`;

            addToCart({
                id: itemId,
                name: item.name,
                price: item.price,
                qty: 1, // Adiciona 1 de cada, usuário pode ajustar no carrinho
                image: item.image || '',
                category: 'Recompra'
            });
        });

        // Feedback simples
        const btn = document.activeElement as HTMLButtonElement;
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="flex items-center gap-2">✓ Adicionado!</span>';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        }
    };

    const handleReview = (item?: OrderItem) => {
        if (item) {
            setSelectedItemToReview(item);
            setIsReviewModalOpen(true);
        } else if (order.items.length === 1) {
            // Se só tem 1 item, abre direto para ele
            setSelectedItemToReview(order.items[0]);
            setIsReviewModalOpen(true);
        } else {
            // Se tem vários, expande para mostrar os itens e pede para selecionar
            setIsExpanded(true);
            setTimeout(() => {
                const itemsSection = document.getElementById(`order-items-${order.id}`);
                itemsSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    };

    // Calculate progress based on status
    const getProgress = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('entregue') || s.includes('delivered')) return 100;
        if (s.includes('trânsito') || s.includes('shipping') || s.includes('transit')) return 66;
        if (s.includes('aprovado') || s.includes('processing')) return 33;
        return 0;
    };

    const progress = getProgress(order.status);
    const isDelivered = progress === 100;

    // Get payment method display info
    const getPaymentInfo = () => {
        const pm = order.paymentMethod;
        if (!pm) return { icon: CreditCard, label: 'Cartão', detail: '', color: 'text-blue-600' };

        switch (pm.type) {
            case 'pix':
                return {
                    icon: Gift,
                    label: 'PIX',
                    detail: 'Pagamento instantâneo',
                    color: 'text-emerald-600'
                };
            case 'boleto':
                return {
                    icon: FileText,
                    label: 'Boleto Bancário',
                    detail: 'Compensado',
                    color: 'text-slate-600'
                };
            default:
                return {
                    icon: CreditCard,
                    label: `${pm.brand || 'Cartão'} ****${pm.lastDigits || ''}`,
                    detail: pm.installments > 1 ? `${pm.installments}x sem juros` : 'À vista',
                    color: 'text-blue-600'
                };
        }
    };

    const paymentInfo = getPaymentInfo();
    const PaymentIcon = paymentInfo.icon;

    // Get status icon for history timeline
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return CheckCircle;
            case 'transit': case 'shipping': return Truck;
            default: return Clock;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Review Modal */}
            {selectedItemToReview && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    productName={selectedItemToReview.name}
                    productId={selectedItemToReview.id}
                    orderId={order.id}
                    productImage={selectedItemToReview.image}
                />
            )}

            {/* Header / Summary */}
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-lg font-bold text-slate-800">#{order.id}</span>
                            <span className="text-sm text-slate-400">• {order.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="font-bold text-lyvest-500 text-xl">{formatCurrency(order.total)}</p>

                            {/* Status Badge */}
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${isDelivered
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                {isDelivered ? 'Entregue' : (progress >= 50 ? 'Em Trânsito' : 'Processando')}
                            </span>
                        </div>
                    </div>

                    {order.trackingCode && (
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <span className="text-xs text-slate-500 font-mono">{order.trackingCode}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(order.trackingCode!)}
                                className="text-slate-400 hover:text-lyvest-500 transition-colors"
                                title={t('common.copy') || "Copiar"}
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Thumbnails Preview (Collapsed View) */}
                {!isExpanded && (
                    <div className="flex items-center gap-2 mb-6">
                        {order.items.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Package className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {order.items.length > 4 && (
                            <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                +{order.items.length - 4}
                            </div>
                        )}
                    </div>
                )}

                {/* Expanded Progress Bar */}
                {isExpanded && (
                    <div className="mb-8 animate-fade-in">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                            <span className={progress >= 0 ? 'text-lyvest-500' : ''}>Processando</span>
                            <span className={progress >= 50 ? 'text-lyvest-500' : ''}>Em Trânsito</span>
                            <span className={progress >= 100 ? 'text-lyvest-500' : ''}>Entregue</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-lyvest-500 to-lyvest-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => order.trackingCode && onTrackOrder(order.trackingCode)}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-lyvest-500 text-white font-bold rounded-xl hover:bg-lyvest-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#F5E6E8]"
                    >
                        <MapPin className="w-4 h-4" />
                        {t('dashboard.trackOrder') || "Rastrear Pedido"}
                    </button>

                    <button
                        onClick={handleBuyAgain}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-100"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Comprar Novamente
                    </button>

                    {isDelivered && (
                        <button
                            onClick={() => handleReview()}
                            className="flex-1 sm:flex-none px-6 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                        >
                            <Star className="w-4 h-4" />
                            {order.items.length > 1 ? 'Avaliar Itens' : 'Avaliar'}
                        </button>
                    )}

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex-1 sm:flex-none px-6 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {isExpanded ? "Menos Detalhes" : "Ver Detalhes"}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Expandable Details Section */}
            {isExpanded && (
                <div className="border-t border-slate-100 animate-fade-in">

                    {/* Grid: Payment + Address */}
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

                        {/* Payment Method */}
                        <div className="p-6 bg-slate-50">
                            <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-lyvest-500" />
                                Forma de Pagamento
                            </h4>
                            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${paymentInfo.color} bg-opacity-10`} style={{ backgroundColor: 'currentColor', opacity: 0.1 }}>
                                    <PaymentIcon className={`w-5 h-5 ${paymentInfo.color}`} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{paymentInfo.label}</p>
                                    <p className="text-sm text-slate-500">{paymentInfo.detail}</p>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="p-6 bg-slate-50">
                            <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-lyvest-500" />
                                Endereço de Entrega
                            </h4>
                            {order.shippingAddress && (
                                <div className="bg-white p-4 rounded-xl border border-slate-100">
                                    <p className="font-bold text-slate-800">{order.shippingAddress.recipient}</p>
                                    <p className="text-sm text-slate-600">{order.shippingAddress.street}</p>
                                    <p className="text-sm text-slate-600">{order.shippingAddress.neighborhood}</p>
                                    <p className="text-sm text-slate-600">
                                        {order.shippingAddress.city}/{order.shippingAddress.state} • CEP {order.shippingAddress.zipCode}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-6 bg-white border-t border-slate-100">
                        <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                            💰 Resumo Financeiro
                        </h4>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal ({order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'})</span>
                                    <span className="font-medium text-slate-800">{formatCurrency(order.subtotal || order.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Frete</span>
                                    <span className={`font-medium ${order.shippingCost === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                        {order.shippingCost === 0 ? 'Grátis ✓' : order.shippingCost && formatCurrency(order.shippingCost)}
                                    </span>
                                </div>
                                {(order.discount || 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Desconto</span>
                                        <span className="font-medium text-emerald-600">-{formatCurrency(order.discount!)}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-200 pt-2 mt-2">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-slate-800">Total</span>
                                        <span className="font-bold text-lyvest-500 text-lg">{formatCurrency(order.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div id={`order-items-${order.id}`} className="p-6 bg-slate-50 border-t border-slate-100">
                        <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                            <Package className="w-4 h-4 text-lyvest-500" />
                            Itens do Pedido
                        </h4>
                        <div className="space-y-3">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 group">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-6 h-6 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-center sm:text-left">
                                        <p className="font-bold text-slate-800 line-clamp-1">{item.name}</p>
                                        <p className="text-sm text-slate-500">Quantidade: {item.qty}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-center sm:items-end gap-2">
                                        <div>
                                            <p className="font-bold text-lyvest-500">{formatCurrency(item.price * item.qty)}</p>
                                            {item.qty > 1 && (
                                                <p className="text-xs text-slate-500">{formatCurrency(item.price)}/un</p>
                                            )}
                                        </div>

                                        {/* Individual Item Review Button */}
                                        {isDelivered && (
                                            <button
                                                onClick={() => handleReview(item)}
                                                className="text-xs font-bold text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            >
                                                <Star className="w-3 h-3 fill-amber-500" />
                                                Avaliar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order History Timeline */}
                    {order.history && order.history.length > 0 && (
                        <div className="p-6 bg-white border-t border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                                📋 Histórico do Pedido
                            </h4>
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

                                <div className="space-y-4">
                                    {[...order.history].reverse().map((event, idx) => {
                                        const StatusIcon = getStatusIcon(event.status);
                                        const isLast = idx === 0;
                                        return (
                                            <div key={idx} className="flex items-start gap-4 relative">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${isLast ? 'bg-lyvest-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <p className={`font-bold ${isLast ? 'text-slate-800' : 'text-slate-600'}`}>
                                                        {event.label}
                                                    </p>
                                                    <p className="text-sm text-slate-400">{event.date}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Download Invoice Button */}
                    {order.invoiceUrl && (
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <a
                                href={order.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <FileText className="w-5 h-5" />
                                Baixar Nota Fiscal (NF-e)
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
