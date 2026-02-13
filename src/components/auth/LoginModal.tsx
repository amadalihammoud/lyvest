'use client';

import { useState, useEffect } from 'react';
import { useLoginModal } from '@/store/useLoginModal';
import { SignIn } from '@clerk/nextjs';
import { X, Check, Gift, Truck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginModal() {
    const { isOpen, onClose } = useLoginModal();

    const [headerHeight, setHeaderHeight] = useState(0);

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
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-x-0 z-40 md:z-[100] flex justify-start md:items-center md:justify-center transition-[top] duration-75 ease-out top-[var(--header-height)] md:top-0 h-[calc(100vh-var(--header-height))] md:h-screen"
                    style={{ '--header-height': `${headerHeight}px` } as React.CSSProperties}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* MOBILE DRAWER (Hamburger Style) - Visible ONLY on Mobile */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-[95%] max-w-[420px] h-full bg-white shadow-2xl flex flex-col md:hidden"
                    >
                        {/* MOBILE DRAWER CONTENT */}
                        <div className="flex-1 flex flex-col overflow-y-auto bg-white relative h-full">
                            {/* Close Button Top Right - Smaller padding */}
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 z-50 p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-[#800020] transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="p-4 pt-6 pb-2 flex-col flex min-h-full">
                                {/* Header Mobile - Ultra Compact */}
                                <div className="mb-1">
                                    <h1 className="text-xl text-slate-800 leading-none">
                                        Olá, <br />
                                        <span className="font-cookie text-4xl text-[#800020] block -mt-1">Bella.</span>
                                    </h1>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
                                        Acesse para ver a curadoria.
                                    </p>

                                    <SignIn
                                        appearance={{
                                            elements: {
                                                rootBox: "w-full",
                                                card: "shadow-none p-0 w-full bg-transparent overflow-visible",
                                                headerTitle: "hidden",
                                                headerSubtitle: "hidden",
                                                header: "hidden",
                                                footer: "hidden",
                                                formButtonPrimary: "bg-[#800020] hover:bg-[#600018] text-white rounded-lg py-2 text-xs font-bold shadow-sm shadow-rose-900/10 w-full normal-case mb-2 transition-transform active:scale-95 h-9",
                                                formFieldInput: "rounded-lg border-slate-200 focus:border-[#800020] focus:ring-[#800020]/20 bg-slate-50 py-2 px-3 text-xs mb-1 h-9",
                                                formFieldLabel: "text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5 mt-0.5 ml-1",
                                                socialButtonsBlockButton: "rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-[10px] py-2 transition-colors h-9 flex items-center justify-center gap-2",
                                                socialButtonsBlockButtonText: "font-semibold text-slate-600",
                                                dividerLine: "bg-slate-100 h-px w-full my-2",
                                                dividerText: "text-slate-400 bg-white px-2 text-[9px] uppercase tracking-widest font-medium relative z-10",
                                                footerActionLink: "text-[#800020] font-bold hover:underline",
                                                identityPreviewText: "text-slate-600 font-medium text-xs",
                                                identityPreviewEditButton: "text-[#800020] hover:text-[#600018]",
                                                formFieldAction: "text-[#800020] hover:text-[#600018] text-[9px] font-medium"
                                            },
                                            layout: {
                                                socialButtonsPlacement: 'bottom',
                                                socialButtonsVariant: 'blockButton',
                                                showOptionalFields: false
                                            }
                                        }}
                                        redirectUrl="/dashboard"
                                        signUpUrl="/sign-up"
                                    />

                                    {/* Benefits Section - Ultra Compact */}
                                    <div className="mt-auto pt-2 border-t border-rose-50 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                                            <Heart size={10} className="text-[#800020] fill-[#800020]" />
                                            <span>Emb. Discreta</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                                            <Heart size={10} className="text-[#800020] fill-[#800020]" />
                                            <span>Troca Grátis</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* DESKTOP MODAL (Existing Split View) - Hidden on Mobile */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="hidden md:flex relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex-col md:flex-row max-h-[90vh]"
                    >
                        {/* Desktop: Left Side (Image) */}
                        <div className="hidden md:flex flex-col justify-between w-1/2 bg-[url('/hero-banner.png')] bg-cover bg-center text-white p-12 relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="relative z-10">
                                <h3 className="text-3xl font-cookie mb-2">Lingerie LyVest</h3>
                            </div>

                            <div className="relative z-10 space-y-4">
                                <h2 className="text-4xl font-bold font-lato leading-tight">
                                    Sinta-se única.
                                </h2>
                                <p className="text-lg text-rose-100 font-light max-w-sm">
                                    Entre para o clube LyVest e ganhe <span className="font-bold text-white">10% OFF</span> na sua primeira compra.
                                </p>
                            </div>
                        </div>

                        {/* Right Side (Form) */}
                        <div className="w-full md:w-1/2 bg-white flex flex-col relative overflow-y-auto">
                            {/* Close Button Desktop */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 z-50 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="p-12 flex flex-col items-center justify-center min-h-full">
                                <div className="w-full max-w-sm">
                                    <div className="text-center md:text-left mb-6">
                                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-4 text-lyvest-700">
                                            <Gift size={24} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800">Bem-vinda</h2>
                                        <p className="text-slate-500 mt-1">Acesse sua conta para continuar</p>
                                    </div>

                                    <SignIn
                                        appearance={{
                                            elements: {
                                                rootBox: "w-full",
                                                card: "shadow-none p-0 w-full",
                                                headerTitle: "hidden",
                                                headerSubtitle: "hidden",
                                                formButtonPrimary: "bg-[#800020] hover:bg-[#600018] text-white rounded-xl py-3 text-base font-bold shadow-lg shadow-rose-900/20 w-full normal-case transition-transform active:scale-95",
                                                formFieldInput: "rounded-xl border-slate-200 focus:border-[#800020] bg-slate-50 py-3 px-4 text-base",
                                                formFieldLabel: "text-slate-700 font-medium ml-1",
                                                socialButtonsBlockButton: "rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm py-2.5",
                                                dividerLine: "bg-slate-100",
                                                dividerText: "text-slate-400 bg-white px-2 uppercase text-xs tracking-widest",
                                                footerActionLink: "text-[#800020] font-bold hover:underline",
                                                identityPreviewText: "text-slate-600",
                                                formFieldAction: "text-[#800020] hover:underline hover:text-[#600018]"
                                            },
                                            layout: {
                                                socialButtonsPlacement: 'top',
                                                socialButtonsVariant: 'blockButton'
                                            }
                                        }}
                                        redirectUrl="/dashboard"
                                        signUpUrl="/sign-up"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
