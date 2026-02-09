
'use client';

import { useRouter } from 'next/navigation';
import UserDashboard from '@/components/dashboard/UserDashboard';

import { mockOrders } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';

export default function DashboardPageClient() {
    const router = useRouter();

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

    // Criar objeto de usuário para UserDashboard
    const dashboardUser = {
        id: user?.id || 'mock-id',
        name: profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'U') || 'Usuário',
        email: user?.email || 'usuario@email.com',
        avatar: (profile?.avatar_url || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'U')}&background=FF1493&color=fff&bold=true`) as string,
        phone: profile?.phone || '',
        cpf: profile?.cpf || '',
        birthDate: profile?.birth_date || '',
    };

    // Cast dashboardUser to any to comply with UserDashboard props if types differ slightly
    // ideally types should be unified
    return (
        <>

            <UserDashboard
                user={dashboardUser as any}
                orders={mockOrders as any}
                onTrackOrder={handleTrackOrder}
                onLogout={handleLogout}
            />
        </>
    );
}
