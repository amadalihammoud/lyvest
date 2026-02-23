import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Settings,
    LogOut
} from 'lucide-react';
import { SignOutButton, ClerkProvider } from '@clerk/nextjs';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // 1. Lightweight auth check (doesn't trigger deep cookie hydration errors on Edge)
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    // 2. Fetch full user data safely ONLY after confirming auth exists
    const user = await currentUser();
    const adminEmail = process.env.ADMIN_USER_EMAIL?.trim().toLowerCase();

    // Type-safe verification of the master admin email
    const isAuthorized = user?.emailAddresses?.some(e => e.emailAddress.toLowerCase() === adminEmail);

    if (!user || !isAuthorized) {
        redirect('/'); // Kick intruders back to the storefront
    }

    return (
        <ClerkProvider>
            <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
                {/* Sidebar (Desktop) / Topbar (Mobile) */}
                <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-screen flex flex-col shadow-xl z-20">
                    <div className="p-6 text-center md:text-left border-b border-slate-800">
                        <h1 className="text-xl font-bold tracking-widest text-white uppercase font-serif">Ly Vest</h1>
                        <span className="text-xs text-lyvest-400 font-semibold tracking-widest mt-1 block">Backoffice</span>
                    </div>

                    <nav className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-visible py-4 md:py-8 gap-2 px-4 md:px-0 scrollbar-hide">
                        <Link href="/admin" className="flex items-center gap-3 px-4 md:px-6 py-3 rounded-lg md:rounded-none bg-lyvest-500/10 text-lyvest-400 md:border-r-4 border-lyvest-500 hover:bg-slate-800 hover:text-white transition-all whitespace-nowrap">
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="font-medium text-sm">Dashboard</span>
                        </Link>
                        <Link href="/admin/orders" className="flex items-center gap-3 px-4 md:px-6 py-3 rounded-lg md:rounded-none hover:bg-slate-800 hover:text-white transition-all whitespace-nowrap">
                            <Package className="w-5 h-5" />
                            <span className="font-medium text-sm">Pedidos</span>
                        </Link>
                        <button disabled className="flex items-center gap-3 px-4 md:px-6 py-3 rounded-lg md:rounded-none text-slate-600 cursor-not-allowed whitespace-nowrap text-left">
                            <ShoppingBag className="w-5 h-5" />
                            <span className="font-medium text-sm">Produtos (Em breve)</span>
                        </button>
                        <button disabled className="flex items-center gap-3 px-4 md:px-6 py-3 rounded-lg md:rounded-none text-slate-600 cursor-not-allowed whitespace-nowrap text-left">
                            <Settings className="w-5 h-5" />
                            <span className="font-medium text-sm">Ajustes da Loja</span>
                        </button>
                    </nav>

                    <div className="p-4 md:p-6 mt-auto border-t border-slate-800 hidden md:block">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white overflow-hidden">
                                <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="truncate">
                                <p className="text-sm font-bold text-white truncate">{user.fullName || 'Admin'}</p>
                                <p className="text-xs text-slate-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                            </div>
                        </div>

                        <SignOutButton signOutOptions={{ redirectUrl: '/' }}>
                            <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg transition-colors text-sm font-medium">
                                <LogOut className="w-4 h-4" /> Sair do Painel
                            </button>
                        </SignOutButton>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto">
                    <header className="bg-white px-8 py-4 border-b border-slate-200 hidden md:flex justify-between items-center sticky top-0 z-10">
                        <h2 className="text-xl font-bold text-slate-800">Visão Geral</h2>
                        <div className="text-sm text-slate-500 font-medium">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </header>
                    <div className="p-4 md:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </ClerkProvider>
    );
}
