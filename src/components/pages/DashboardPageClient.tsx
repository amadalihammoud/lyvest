'use client';

import { useRouter } from 'next/navigation';
import UserDashboard from '@/components/dashboard/UserDashboard';

import { mockOrders } from '@/data/mockOrders';
import { useI18n } from '@/context/I18nContext';
// import { useAuth, User } from '@/context/AuthContext'; // Removed
import { useUser, useClerk } from '@clerk/nextjs';
import { useModal } from '@/context/ModalContext';
import { Order } from '@/types/dashboard';

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
        [key: string]: any;
    };
    [key: string]: any;
}

export default function DashboardPageClient() {
    const router = useRouter();
    const { t } = useI18n();
    // const { user, profile, signOut } = useAuth(); // Removed
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();

    const { openDrawer, setTrackingCode } = useModal();

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
