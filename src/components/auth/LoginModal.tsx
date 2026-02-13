'use client';

import { useState, useEffect } from 'react';

import { useLoginModal } from '@/store/useLoginModal';
import { SignIn } from '@clerk/nextjs';
import { X, Check, Gift, Truck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginModal() {
    const { isOpen, onClose } = useLoginModal();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed inset-0 z-[100] flex ${isMobile ? 'justify-start items-stretch' : 'items-center justify-center'} p-4 sm:p-6`}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Content Container */}
                    {isMobile ? (
                        /* MOBILE DRAWER (Hamburger Style) */
                        <motion.div
                            key="mobile-drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-[85%] max-w-[320px] h-full bg-white shadow-2xl flex flex-col"
                        >
                            <div className="flex-1 flex flex-col overflow-y-auto bg-white relative h-full">
                                {/* Close Button Top Right */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 z-50 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-[#800020] transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="p-6 pt-10 flex-col flex h-full">
                                    {/* Header Mobile */}
                                    <div className="mb-8">
                                        <h2 className="text-[#800020] font-bold text-sm tracking-widest uppercase mb-6 border-b border-rose-100 pb-2">Identificação</h2>

                                        <h1 className="text-3xl text-slate-800 leading-none">
                                            Olá, <br />
                                            <span className="font-cookie text-6xl text-[#800020] block mt-1">Bella.</span>
                                        </h1>
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                            Entre para acessar seu carrinho e nossa curadoria exclusiva.
                                        </p>

                                        <SignIn
                                            appearance={{
                                                elements: {
                                                    rootBox: "w-full",
                                                    card: "shadow-none p-0 w-full",
                                                    header: "hidden",
                                                    footer: "hidden",
                                                    formButtonPrimary: "bg-[#800020] hover:bg-[#600018] text-white rounded-xl py-3 text-base font-bold shadow-md shadow-rose-900/10 w-full normal-case mb-4",
                                                    formFieldInput: "rounded-xl border-slate-200 focus:border-[#800020] focus:ring-[#800020]/20 bg-slate-50 py-3 px-4 text-base mb-1",
                                                    formFieldLabel: "text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 mt-2 ml-1",
                                                    socialButtonsBlockButton: "rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm py-3 transition-colors h-12",
                                                    socialButtonsBlockButtonText: "font-semibold",
                                                    dividerLine: "bg-slate-100 h-px",
                                                    dividerText: "text-slate-400 bg-white px-3 text-[10px] uppercase tracking-widest font-medium",
                                                    formFieldRow: "mb-2"
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

                                        {/* Benefits Section */}
                                        <div className="mt-8 bg-rose-50/50 rounded-2xl p-5 border border-rose-100/50">
                                            <h3 className="text-[#800020] font-serif text-lg font-bold mb-3">Why LyVest?</h3>
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                                                    <Heart size={14} className="text-[#800020] fill-[#800020]" />
                                                    <span>Embalagem Discreta</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                                                    <Heart size={14} className="text-[#800020] fill-[#800020]" />
                                                    <span>Troca Grátis</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* DESKTOP MODAL (Split View) */
                        <motion.div
                            key="desktop-modal"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
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
                                                    header: "hidden",
                                                    footer: "hidden",
                                                    formButtonPrimary: "bg-[#800020] hover:bg-[#600018] text-white rounded-xl py-3 text-base font-bold shadow-lg shadow-rose-900/20 w-full normal-case",
                                                    formFieldInput: "rounded-xl border-slate-200 focus:border-[#800020] bg-slate-50 py-3 px-4 text-base",
                                                    formFieldLabel: "text-slate-700 font-medium ml-1",
                                                    socialButtonsBlockButton: "rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm py-2.5",
                                                    dividerLine: "bg-slate-100",
                                                    dividerText: "text-slate-400 bg-white px-2 uppercase text-xs tracking-widest",
                                                    footerActionLink: "text-[#800020] font-bold hover:underline"
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
                    )}
                </div>
            )}
        </AnimatePresence>
    );
}
