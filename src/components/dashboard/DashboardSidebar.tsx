import { Package, Heart, LogOut, User, MapPin, LayoutDashboard } from 'lucide-react';
import React from 'react';

import { useI18n } from '../../hooks/useI18n';

// Explicit Settings Icon Component
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

type TabId = 'overview' | 'orders' | 'favorites' | 'coupons' | 'profile' | 'addresses' | 'settings';

interface DashboardSidebarProps {
    activeTab: TabId | string;
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
}

export default function DashboardSidebar({ activeTab, setActiveTab, onLogout }: DashboardSidebarProps) {
    const { t } = useI18n();

    const menuItems = [
        { id: 'overview', icon: LayoutDashboard, label: t('nav.home') || 'Início' },
        { id: 'orders', icon: Package, label: t('dashboard.orders') },
        { id: 'favorites', icon: Heart, label: t('dashboard.favorites') },
        // New Coupons Menu Item
        { id: 'coupons', icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z" /><path d="M6 15h1.5a2.5 2.5 0 0 1 0 5H6" /><path d="M18 15h-1.5a2.5 2.5 0 0 0 0 5H18" /></svg>, label: t('dashboard.coupons.menu') || 'Meus Cupons' },
        { id: 'profile', icon: User, label: t('dashboard.profile.menu') },
        { id: 'addresses', icon: MapPin, label: t('dashboard.addresses.menu') },
        { id: 'settings', icon: SettingsIcon, label: t('dashboard.settings.menu') },
    ];

    return (
        <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden sticky top-24">
                <nav className="flex flex-row lg:flex-col p-3 lg:p-5 gap-2 overflow-x-auto lg:overflow-visible">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`group flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-300 w-full text-left relative overflow-hidden
                                ${activeTab === item.id
                                    ? 'bg-gradient-to-r from-rose-50 to-white text-[#800020] font-bold shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {/* Active Indicator Line */}
                            {activeTab === item.id && (
                                <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#800020] rounded-r-full" />
                            )}

                            <item.icon
                                className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 
                                    ${activeTab === item.id ? 'text-[#800020]' : 'text-slate-400 group-hover:text-[#800020]'}`}
                            />
                            <span className="relative z-10">{item.label}</span>
                        </button>
                    ))}

                    <div className="h-px bg-slate-100 my-2 hidden lg:block mx-2"></div>

                    <button
                        onClick={onLogout}
                        className="hidden lg:flex items-center gap-3 px-5 py-3.5 rounded-full text-slate-500 hover:bg-lyvest-100/30 hover:text-red-600 transition-all w-full text-left"
                    >
                        <LogOut className="w-5 h-5" />
                        {t('nav.logout')}
                    </button>
                </nav>
            </div>

            {/* Mobile Logout (Separate to not clutter horizontal scroll) */}
            <div className="lg:hidden mt-4">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-full font-medium hover:bg-lyvest-100/30 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                >
                    <LogOut className="w-5 h-5" />
                    {t('nav.logout')}
                </button>
            </div>
        </aside>
    );
}
