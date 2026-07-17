'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Settings, LogOut } from 'lucide-react';
import { useAuth, UserButton } from '@clerk/nextjs';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isLoaded, userId } = useAuth();

    // Basic admin check (em um cenário real, você verificaria role no JWT/Supabase)
    if (isLoaded && !userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">Acesso Restrito</h1>
                    <p className="text-slate-600 mb-6">Você precisa estar logado como administrador.</p>
                    <Link href="/" className="px-6 py-2 bg-lyvest-500 text-white rounded-md">Voltar para a Loja</Link>
                </div>
            </div>
        );
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
        { name: 'Produtos', href: '/admin/produtos', icon: Package },
        { name: 'Configurações', href: '/admin/config', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <span className="text-xl font-bold text-lyvest-600">LyVest Admin</span>
                </div>
                
                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                                    isActive 
                                    ? 'bg-lyvest-50 text-lyvest-600' 
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-lyvest-500' : 'text-slate-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                
                <div className="p-4 border-t border-slate-200">
                    <Link href="/" className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md">
                        <LogOut className="w-5 h-5 mr-3 text-slate-400" />
                        Sair do Admin
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
                    <h2 className="text-lg font-medium text-slate-800">
                        {navigation.find(n => pathname === n.href)?.name || 'Admin'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>
                
                <main className="flex-1 overflow-auto p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
