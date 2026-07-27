'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import UserDashboard from '@/components/dashboard/UserDashboard';
// import { useAuth, User } from '@/context/AuthContext'; // Removed
import { useModal } from '@/store/useModalStore';
import { Order } from '@/types/dashboard';
import { logger } from '@/utils/logger';

type DbOrderRow = {
    id: string;
    created_at: string;
    status: string;
    total_amount: number | string;
    payment_method: string | null;
    tracking_code: string | null;
    shipping_address: unknown;
    items: unknown;
};

// Mapeia uma linha de `orders` do banco para o tipo Order do dashboard.
function mapDbOrder(row: DbOrderRow): Order {
    const rawItems = Array.isArray(row.items) ? row.items : [];
    const items = rawItems.map((raw) => {
        const it = (raw ?? {}) as Record<string, unknown>;
        return {
            id: (it.id as string | number | undefined),
            name: typeof it.name === 'string' ? it.name : 'Produto',
            qty: Number(it.quantity ?? it.qty ?? 1),
            price: Number(it.price ?? 0),
            image: typeof it.image === 'string' ? it.image : undefined,
        };
    });

    return {
        id: row.id,
        date: row.created_at,
        total: Number(row.total_amount),
        status: row.status,
        trackingCode: row.tracking_code ?? undefined,
        paymentMethod: row.payment_method
            ? { type: row.payment_method as 'credit' | 'pix' | 'boleto', installments: 1 }
            : undefined,
        items,
    };
}

// Define Interface locally or import from a new types file if AuthContext is deleted
interface User {
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
    user_metadata?: {
        full_name?: string;
        phone?: string;
        cpf?: string;
        birth_date?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/**
 * Falha ao carregar pedidos precisa ser distinguível de "você não tem pedidos".
 * Sem este aviso, um erro de rede faria o cliente concluir que a compra sumiu.
 *
 * Fica fora de UserDashboard de propósito: aquele componente é compartilhado
 * pelas abas Overview e Orders, e acrescentar props de estado de carregamento
 * ali obrigaria a mexer em toda a cadeia por um banner.
 */
function OrdersLoadError({ show }: { show: boolean }) {
    if (!show) return null;
    return (
        <div
            role="alert"
            className="mx-auto mb-4 max-w-5xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
            Não conseguimos carregar seus pedidos agora. Atualize a página em instantes — nenhuma
            compra sua foi perdida.
        </div>
    );
}

export default function DashboardPageClient() {
    const router = useRouter();
    // const { user, profile, signOut } = useAuth(); // Removed
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();

    const { openDrawer, setTrackingCode } = useModal();

    // Pedidos reais via /api/my-orders (escopo por usuário aplicado no servidor).
    //
    // Começa VAZIO, não com mock. Antes iniciava com mockOrders e, quando
    // /api/my-orders falhava, o `return` no erro deixava os pedidos fictícios na
    // tela PERMANENTEMENTE — um cliente real via pedidos que não existem e podia
    // abrir chamado pedindo rastreio de um código inventado.
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState(false);

    useEffect(() => {
        if (!user) return;
        let active = true;

        (async () => {
            try {
                const res = await fetch('/api/my-orders');
                if (!active) return;
                if (!res.ok) {
                    logger.error('Erro ao carregar pedidos:', String(res.status));
                    setOrdersError(true);
                    return;
                }
                const body = (await res.json()) as { orders?: DbOrderRow[] };
                if (!active) return;
                setOrders((body.orders ?? []).map(mapDbOrder));
            } catch (err) {
                if (active) {
                    logger.error('Erro ao carregar pedidos:', err);
                    setOrdersError(true);
                }
            } finally {
                if (active) setOrdersLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [user]);

    const handleTrackOrder = (code: string) => {
        setTrackingCode(code);
        openDrawer('tracking');
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    if (!isLoaded || !user) {
        return <div className="p-8 text-center">Carregando...</div>; // Or a Skeleton
    }

    // Criar objeto de usuário compatível com a interface User do Dashboard
    // Clerk user mapping
    const dashboardUser: User = {
        id: user.id,
        name: user.fullName || user.firstName || 'Usuário',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
        user_metadata: {
            full_name: user.fullName || '',
            phone: (user.unsafeMetadata?.phone as string) || '', // Clerk stores custom data in metadata
            cpf: (user.unsafeMetadata?.cpf as string) || '',
            birth_date: (user.unsafeMetadata?.birth_date as string) || ''
        }
    };

    return (
        <>
            <OrdersLoadError show={ordersError && !ordersLoading} />
            <UserDashboard
                user={dashboardUser}
                orders={orders}
                onTrackOrder={handleTrackOrder}
                onLogout={handleLogout}
            />
        </>
    );
}
