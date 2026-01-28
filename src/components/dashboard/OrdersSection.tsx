import { memo } from 'react';
import { Package } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import OrderCard from './OrderCard';
import EmptyState from './EmptyState';
import { Order } from '../../types/dashboard';

interface OrdersSectionProps {
    orders?: Order[];
    onTrackOrder: (code: string) => void;
}

function OrdersSection({ orders = [], onTrackOrder }: OrdersSectionProps) {
    const { t } = useI18n();

    if (orders.length === 0) {
        return (
            <EmptyState
                icon={Package}
                title={t('dashboard.noOrders') || "Nenhum pedido encontrado"}
                message={t('dashboard.noOrdersMessage') || "Você ainda não fez nenhum pedido."}
                actionLabel={t('nav.home') || "Começar a Comprar"}
                actionLink="/"
            />
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {orders.map(order => (
                <OrderCard
                    key={order.id}
                    order={order}
                    onTrackOrder={onTrackOrder}
                />
            ))}
        </div>
    );
}

export default memo(OrdersSection);
