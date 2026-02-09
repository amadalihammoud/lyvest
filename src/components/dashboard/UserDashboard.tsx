import { useState, lazy, Suspense, memo } from 'react';
import { useI18n } from '../../hooks/useI18n';
import DashboardSidebar from './DashboardSidebar';
import { getUserAvatar } from '../../utils/userUtils';
import Breadcrumbs from '../ui/Breadcrumbs';
import { Order } from '../../types/dashboard';
import { User } from '../../context/AuthContext';

// Lazy load das seções para melhorar performance
const OrdersSection = lazy(() => import('./OrdersSection'));
const FavoritesSection = lazy(() => import('./FavoritesSection'));
const ProfileSection = lazy(() => import('./ProfileSection'));
const AddressSection = lazy(() => import('./AddressSection'));
const SettingsSection = lazy(() => import('./SettingsSection'));

// Loading skeleton para seções
const SectionLoader = memo(function SectionLoader() {
    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
        </div>
    );
});

// Componente de header memoizado
const DashboardHeader = memo(function DashboardHeader({ user, t }: { user: User; t: (key: string, params?: Record<string, string | number>) => string }) {
    return (
        <div className="flex items-center gap-4 mb-8">
            <img
                src={getUserAvatar(user)}
                alt={user.name}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = getUserAvatar({ name: user.name });
                }}
                className="w-16 h-16 rounded-full border-2 border-white shadow-md"
            />
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    {t('dashboard.welcome', { name: user.name || '' }) || `Olá, ${user.name}!`}
                </h1>
                <p className="text-slate-500 text-sm">{t('dashboard.subtitle')}</p>
            </div>
        </div>
    );
});

interface UserDashboardProps {
    user: User;
    orders: Order[];
    onTrackOrder: (code: string) => void;
    onLogout: () => void;
}

function UserDashboard({ user, orders, onTrackOrder, onLogout }: UserDashboardProps) {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('orders');

    // Renderizar apenas a seção ativa com lazy loading
    const renderActiveSection = () => {


        return (
            <Suspense fallback={<SectionLoader />}>
                {activeTab === 'orders' && <OrdersSection orders={orders} onTrackOrder={onTrackOrder} />}
                {activeTab === 'favorites' && <FavoritesSection />}
                {activeTab === 'profile' && <ProfileSection user={user} />}
                {activeTab === 'addresses' && <AddressSection />}
                {activeTab === 'settings' && <SettingsSection user={user} />}
            </Suspense>
        );
    };

    return (
        <div className="min-h-screen bg-stone-50 py-8 lg:py-12 animate-fade-in">
            <div className="container mx-auto px-4">
                <Breadcrumbs items={[{ label: t('nav.dashboard') || 'Minha Conta' }]} />

                <DashboardHeader user={user} t={t} />

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <DashboardSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onLogout={onLogout}
                    />

                    <main className="flex-1 w-full min-w-0">
                        <div className="space-y-6 animate-slide-up">
                            {renderActiveSection()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default memo(UserDashboard);
