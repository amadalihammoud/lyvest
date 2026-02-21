'use client';

import { useState, useEffect } from 'react';
import { useAuthModal } from '@/store/useAuthModal';
import { SignIn, SignUp, useSignIn, useSignUp } from '@clerk/nextjs';
import { X } from 'lucide-react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';

export default function AuthModal() {
    const { isOpen, view, onClose, setView } = useAuthModal();
    const [headerHeight, setHeaderHeight] = useState(0);

    const { isLoaded: isSignInLoaded } = useSignIn();
    const { isLoaded: isSignUpLoaded } = useSignUp();

    const isLogin = view === 'sign-in';

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
                                    className="absolute top-4 right-4 z-50 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex-1 flex items-center justify-center p-4">
                                    {isLogin ? (
                                        <SignIn
                                            appearance={{
                                                elements: {
                                                    rootBox: "w-full flex justify-center",
                                                    card: "shadow-none w-full max-w-sm"
                                                }
                                            }}
                                            redirectUrl="/dashboard"
                                            signUpUrl="/sign-up"
                                        />
                                    ) : (
                                        <SignUp
                                            appearance={{
                                                elements: {
                                                    rootBox: "w-full flex justify-center",
                                                    card: "shadow-none w-full max-w-sm"
                                                }
                                            }}
                                            redirectUrl="/dashboard"
                                            signInUrl="/sign-in"
                                        />
                                    )}
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
                            <div className="hidden md:flex flex-col justify-between w-1/2 bg-[url('/assets/images/login-featured.webp')] bg-cover bg-center relative">
                            </div>

                            {/* Right Side (Form) */}
                            <div className="w-full md:w-1/2 bg-white flex flex-col relative overflow-hidden">
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 z-50 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>

                                <div className="p-8 flex items-center justify-center h-full w-full overflow-y-auto custom-scrollbar">
                                    {isLogin ? (
                                        <SignIn
                                            appearance={{
                                                elements: {
                                                    rootBox: "w-full flex justify-center",
                                                    card: "shadow-none w-full"
                                                }
                                            }}
                                            redirectUrl="/dashboard"
                                            signUpUrl="/sign-up"
                                        />
                                    ) : (
                                        <SignUp
                                            appearance={{
                                                elements: {
                                                    rootBox: "w-full flex justify-center",
                                                    card: "shadow-none w-full"
                                                }
                                            }}
                                            redirectUrl="/dashboard"
                                            signInUrl="/sign-in"
                                        />
                                    )}
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </LazyMotion>
    );
}
