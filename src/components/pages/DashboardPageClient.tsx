'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import UserDashboard from '@/components/dashboard/UserDashboard';
import { mockOrders } from '@/data/mockOrders';
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

export default function DashboardPageClient() {
    const router = useRouter();
    // const { user, profile, signOut } = useAuth(); // Removed
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();

    const { openDrawer, setTrackingCode } = useModal();

    // Pedidos reais via /api/my-orders (escopo por usuário aplicado no servidor).
    // Fallback para mock enquanto carrega ou em erro (dev/demo).
    const [orders, setOrders] = useState<Order[]>(mockOrders as unknown as Order[]);

    useEffect(() => {
        if (!user) return;
        let active = true;

        (async () => {
            try {
                const res = await fetch('/api/my-orders');
                if (!active) return;
                if (!res.ok) {
                    logger.error('Erro ao carregar pedidos:', String(res.status));
                    return;
                }
                const body = (await res.json()) as { orders?: DbOrderRow[] };
                if (!active) return;
                setOrders((body.orders ?? []).map(mapDbOrder));
            } catch (err) {
                if (active) logger.error('Erro ao carregar pedidos:', err);
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
        <UserDashboard
            user={dashboardUser}
            orders={orders}
            onTrackOrder={handleTrackOrder}
            onLogout={handleLogout}
        />
    );
}
