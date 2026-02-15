'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthModal } from '@/store/useAuthModal';
import { SignIn, SignUp, useSignIn, useSignUp } from '@clerk/nextjs';
import { X, Heart } from 'lucide-react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';

export default function AuthModal() {
    const { isOpen, view, onClose, setView } = useAuthModal();
    const [headerHeight, setHeaderHeight] = useState(0);

    const { isLoaded: isSignInLoaded, signIn } = useSignIn();
    const { isLoaded: isSignUpLoaded, signUp } = useSignUp();

    const isLogin = view === 'sign-in';

    const handleSocialAuth = (strategy: any, isFunctional: boolean = true) => {
        if (!isFunctional) {
            console.log('Social auth currently disabled:', strategy);
            return;
        }

        if (isLogin) {
            if (!isSignInLoaded) return;
            signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: '/dashboard',
                redirectUrlComplete: '/dashboard',
            });
        } else {
            if (!isSignUpLoaded) return;
            signUp.authenticateWithRedirect({
                strategy,
                redirectUrl: '/dashboard',
                redirectUrlComplete: '/dashboard',
            });
        }
    };

    // Intercept Clerk footer links
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Intercept "Sign up" link in Login view
            if (isLogin) {
                const link = target.closest('a[href*="sign-up"]');
                if (link) {
                    e.preventDefault();
                    e.stopPropagation();
                    setView('sign-up');
                }
            }
            // Intercept "Sign in" link in Register view
            else {
                const link = target.closest('a[href*="sign-in"]');
                if (link) {
                    e.preventDefault();
                    e.stopPropagation();
                    setView('sign-in');
                }
            }
        };

        document.addEventListener('click', handleClick, true);

        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    }, [isOpen, isLogin, setView]);

    useEffect(() => {
        const updateHeight = () => {
            const header = document.querySelector('header');
            if (header) {
                setHeaderHeight(header.getBoundingClientRect().bottom);
            }
        };

        updateHeight();
        window.addEventListener('scroll', updateHeight);
        window.addEventListener('resize', updateHeight);

        return () => {
            window.removeEventListener('scroll', updateHeight);
            window.removeEventListener('resize', updateHeight);
        };
    }, []);

    if (!isOpen) return null;

    return (
        <LazyMotion features={domAnimation}>
            <AnimatePresence>
                {isOpen && (
                    <div
                        className="fixed inset-x-0 z-40 md:z-[100] flex justify-start md:items-center md:justify-center transition-[top] duration-75 ease-out top-[var(--header-height)] md:top-0 h-[calc(100dvh-var(--header-height))] md:h-screen"
                        style={{ '--header-height': `${headerHeight}px` } as React.CSSProperties}
                    >
                        {/* Backdrop */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* MOBILE DRAWER */}
                        <m.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full h-full bg-white shadow-2xl flex flex-col md:hidden"
                        >
                            <div className="flex-1 flex flex-col overflow-y-auto bg-white relative h-full">
                                <button
                                    onClick={onClose}
                                    className="absolute top-3 right-3 z-50 p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-[#800020] transition-colors"
                                >
                                    <X size={18} />
                                </button>

                                <div className="p-5 pt-8 pb-4 flex-col flex min-h-full">
                                    <div className="mb-6 px-1 text-center">
                                        <h1 className="text-3xl font-bold text-[#800020] font-serif mb-2 tracking-wide">
                                            {isLogin ? 'Identifique-se' : 'Crie sua conta'}
                                        </h1>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {isLogin ? 'Para acessar os seus pedidos' : 'E aproveite nossos descontos exclusivos'}
                                        </p>
                                    </div>

                                    <SocialAuthButtons onSocialAuth={handleSocialAuth} />

                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-100"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-slate-400 tracking-widest text-[10px]">
                                                {isLogin ? 'ou continue com e-mail' : 'ou cadastre-se com e-mail'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col px-1">
                                        <AnimatePresence mode='wait'>
                                            {isLogin ? (
                                                <m.div
                                                    key="sign-in"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <SignIn
                                                        appearance={clerkAppearance}
                                                        redirectUrl="/dashboard"
                                                        signUpUrl="/sign-up"
                                                    />
                                                </m.div>
                                            ) : (
                                                <m.div
                                                    key="sign-up"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <SignUp
                                                        appearance={clerkAppearance}
                                                        redirectUrl="/dashboard"
                                                        signInUrl="/sign-in"
                                                    />
                                                </m.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="mt-auto pt-2 border-t border-rose-50 flex items-center justify-between gap-2">
                                            <Benefits />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </m.div>

                        {/* DESKTOP MODAL */}
                        <m.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="hidden md:flex relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex-col md:flex-row h-[700px] max-h-[90vh]"
                        >
                            {/* Left Side (Image) */}
                            <div className="hidden md:flex flex-col justify-between w-1/2 bg-[url('/login-featured.webp')] bg-cover bg-center relative">
                            </div>

                            {/* Right Side (Form) */}
                            <div className="w-full md:w-1/2 bg-white flex flex-col relative overflow-hidden">
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 z-50 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>

                                <div className="p-12 flex flex-col items-center justify-center h-full overflow-y-auto custom-scrollbar">
                                    <div className="w-full max-w-sm my-auto">
                                        <div className="text-center mb-6">
                                            <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">
                                                {isLogin ? 'Identifique-se' : 'Crie sua conta'}
                                            </h2>
                                            <p className="text-slate-500">
                                                {isLogin ? 'Para acessar os seus pedidos' : 'E aproveite nossos descontos exclusivos'}
                                            </p>
                                        </div>

                                        <SocialAuthButtons onSocialAuth={handleSocialAuth} />

                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-100"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-white px-2 text-slate-400 tracking-widest text-[10px]">
                                                    {isLogin ? 'ou continue com e-mail' : 'ou cadastre-se com e-mail'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="min-h-[300px] relative">
                                            <AnimatePresence mode='wait'>
                                                {isLogin ? (
                                                    <m.div
                                                        key="sign-in"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="w-full"
                                                    >
                                                        <SignIn
                                                            appearance={clerkAppearance}
                                                            redirectUrl="/dashboard"
                                                            signUpUrl="/sign-up"
                                                        />
                                                    </m.div>
                                                ) : (
                                                    <m.div
                                                        key="sign-up"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="w-full"
                                                    >
                                                        <SignUp
                                                            appearance={clerkAppearance}
                                                            redirectUrl="/dashboard"
                                                            signInUrl="/sign-in"
                                                        />
                                                    </m.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </LazyMotion>
    );
}

const clerkAppearance = {
    elements: {
        rootBox: "w-full",
        card: "shadow-none p-0 w-full bg-transparent overflow-visible",
        headerTitle: "hidden",
        headerSubtitle: "hidden",
        header: "hidden",
        footer: "block mt-4",
        footerText: "text-slate-500 text-xs",
        formButtonPrimary: "bg-[#800020] hover:bg-[#600018] text-white rounded-xl py-3 text-base font-bold shadow-lg shadow-rose-900/20 w-full normal-case transition-transform active:scale-95 mt-2",
        formFieldInput: "rounded-xl border-slate-200 focus:border-[#800020] bg-slate-50 py-3 px-4 text-base",
        formFieldLabel: "text-slate-700 font-medium ml-1",
        socialButtonsJSONObject: "hidden",
        socialButtonsBlockButton: "hidden",
        socialButtons: "hidden",
        dividerRow: "hidden",
        dividerText: "text-slate-400 bg-white px-2 uppercase text-xs tracking-widest",
        footerActionLink: "text-[#800020] font-bold hover:underline",
        identityPreviewText: "text-slate-600 font-medium text-xs",
        identityPreviewEditButton: "text-[#800020] hover:text-[#600018]",
        formFieldAction: "text-[#800020] hover:text-[#600018] text-xs font-medium"
    },
    layout: {
        socialButtonsPlacement: 'top' as const,
        socialButtonsVariant: 'iconButton' as const,
    }
};

function Benefits() {
    return (
        <>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                <Heart size={10} className="text-[#800020] fill-[#800020]" />
                <span>Emb. Discreta</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                <Heart size={10} className="text-[#800020] fill-[#800020]" />
                <span>Troca Grátis</span>
            </div>
        </>
    );
}

function SocialAuthButtons({ onSocialAuth }: { onSocialAuth: (strategy: any, isFunctional?: boolean) => void }) {
    return (
        <div className="flex justify-center gap-4 mb-6">
            <SocialButton
                icon="google"
                onClick={() => onSocialAuth('oauth_google')}
            />
            <SocialButton
                icon="facebook"
                onClick={() => onSocialAuth('oauth_facebook', false)}
            />
            <SocialButton
                icon="apple"
                onClick={() => onSocialAuth('oauth_apple', false)}
            />
            <SocialButton
                icon="microsoft"
                onClick={() => onSocialAuth('oauth_microsoft', false)}
            />
        </div>
    );
}

function SocialButton({ icon, onClick }: { icon: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#800020]/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
        >
            {icon === 'google' && (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
            )}
            {icon === 'facebook' && (
                <svg className="w-6 h-6 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.606-2.797 2.895v1.076h3.941s-.543 3.667-.557 3.667h-3.384v7.98h-5.017z" />
                </svg>
            )}
            {icon === 'apple' && (
                <svg className="w-5 h-5 text-slate-900 fill-current" viewBox="0 0 384 512">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
            )}
            {icon === 'microsoft' && (
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path fill="#F25022" d="M1 1h10v10H1z" />
                    <path fill="#00A4EF" d="M1 1h10v10H12z" />
                    <path fill="#7FBA00" d="M1 12h10v10H12z" />
                    <path fill="#FFB900" d="M12 12h10v10H12z" />
                </svg>
            )}
        </button>
    );
}
