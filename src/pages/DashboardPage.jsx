// src/pages/DashboardPage.jsx
import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import UserDashboard from '../components/UserDashboard';
import SEO from '../components/SEO';
import { mockOrders } from '../data/mockData';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { t } = useI18n();
    const { user, profile, signOut } = useAuth();
    const { setActiveDrawer, setTrackingCode } = useOutletContext();

    const handleTrackOrder = (code) => {
        setTrackingCode(code);
        setActiveDrawer('tracking');
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    // Criar objeto de usuário para UserDashboard
    const dashboardUser = {
        id: user?.id || 'mock-id',
        name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário',
        email: user?.email || 'usuario@email.com',
        avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'U')}&background=FF1493&color=fff&bold=true`,
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
                user={dashboardUser}
                orders={mockOrders}
                onTrackOrder={handleTrackOrder}
                onLogout={handleLogout}
            />
        </>
    );
}







