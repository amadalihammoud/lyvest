'use client';

import Image from 'next/image';
import { useUser, useClerk } from '@clerk/nextjs';

interface HeaderAuthProps {
    onOpen: () => void;
    navigateToDashboard: () => void;
    loginLabel: string;
}

/**
 * Lazy-loaded auth UI for the Header.
 * This component is the ONLY place that imports useUser/useClerk,
 * keeping the entire Clerk SDK (~200KB) off the critical rendering path.
 * It loads after idle, showing a "Login" button as fallback until ready.
 */
export default function HeaderAuth({ onOpen, navigateToDashboard, loginLabel }: HeaderAuthProps) {
    const { user, isSignedIn } = useUser();
    const { signOut } = useClerk();

    const currentUser = user ? {
        name: user.fullName || user.firstName,
        imageUrl: user.imageUrl,
    } : null;

    if (isSignedIn && currentUser) {
        return (
            <button
                onClick={navigateToDashboard}
                className="hidden lg:flex items-center gap-2 pl-1 pr-3 py-1 bg-white hover:bg-slate-50 rounded-full border border-slate-200 transition-all shadow-sm group"
            >
                <Image
                    src={currentUser.imageUrl}
                    alt={currentUser.name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full object-cover relative z-10 bg-white"
                />
                <span className="text-sm font-bold text-slate-700 group-hover:text-lyvest-500 transition-colors">
                    {currentUser.name}
                </span>
            </button>
        );
    }

    return (
        <div className="hidden lg:block">
            <button
                onClick={onOpen}
                className="inline-block bg-lyvest-500 hover:bg-lyvest-600 text-white font-bold py-2 px-6 rounded-full transition-colors shadow-md active:scale-95 text-center cursor-pointer"
            >
                {loginLabel}
            </button>
        </div>
    );
}
