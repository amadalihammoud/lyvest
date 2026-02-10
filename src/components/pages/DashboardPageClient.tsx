'use client';

import { useRouter } from 'next/navigation';
import UserDashboard from '@/components/dashboard/UserDashboard';

import { mockOrders } from '@/data/mockData';
import { useI18n } from '@/context/I18nContext';
import { useAuth, User } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import { Order } from '@/types/dashboard';

export default function DashboardPageClient() {
    const router = useRouter();
    const { t } = useI18n();
    const { user, profile, signOut } = useAuth();
    const { openDrawer, setTrackingCode } = useModal();

    const handleTrackOrder = (code: string) => {
        setTrackingCode(code);
        openDrawer('tracking');
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    // Criar objeto de usuário compatível com a interface User do AuthContext
    const dashboardUser: User = {
        id: user?.id || 'mock-id',
        name: profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'U') || 'Usuário',
        email: user?.email || 'usuario@email.com',
        avatar: (profile?.avatar_url || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'U')}&background=FF1493&color=fff&bold=true`) as string,
        user_metadata: {
            ...user?.user_metadata,
            full_name: profile?.full_name || undefined,
            phone: profile?.phone || undefined,
            cpf: profile?.cpf || undefined,
            birth_date: profile?.birth_date || undefined
        }
    };

    // Cast mockOrders to the expected Order type from types/dashboard
    // Compatibility is handled by the structure matching sufficient properties
    const orders = mockOrders as unknown as Order[];

    return (
        <UserDashboard
            user={dashboardUser}
            orders={orders}
            onTrackOrder={handleTrackOrder}
            onLogout={handleLogout}
        />
    );
}
