

import { useNavigate, useOutletContext } from 'react-router-dom';
import UserDashboard from '../components/dashboard/UserDashboard';
import SEO from '../components/features/SEOComponent';
import { mockOrders } from '../data/mockData';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../context/AuthContext';

interface GlobalContextType {
    setActiveDrawer: (drawerId: string) => void;
    setTrackingCode: (code: string) => void;
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const { t } = useI18n();
    const { user, profile, signOut } = useAuth();
    const { setActiveDrawer, setTrackingCode } = useOutletContext<GlobalContextType>();

    const handleTrackOrder = (code: string) => {
        setTrackingCode(code);
        setActiveDrawer('tracking');
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    // Criar objeto de usuÃ¡rio para UserDashboard
    const dashboardUser = {
        id: user?.id || 'mock-id',
        name: profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'U') || 'UsuÃ¡rio',
        email: user?.email || 'usuario@email.com',
        avatar: (profile?.avatar_url || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'U')}&background=FF1493&color=fff&bold=true`) as string,
        phone: profile?.phone || '',
        cpf: profile?.cpf || '',
        birthDate: profile?.birth_date || '',
    };

    return (
        <>
            <SEO
                title={t('dashboard.title')}
                description={t('dashboard.description')}
            />
            <UserDashboard
                user={dashboardUser as any} // Cast to any to avoid strict type mismatch with User interface
                orders={mockOrders as any} // Cast to any to avoid strict enum mismatch with PaymentMethod
                onTrackOrder={handleTrackOrder}
                onLogout={handleLogout}
            />
        </>
    );
}








