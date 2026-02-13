'use client';

import { useLoginModal } from '@/store/useLoginModal';
import { SignIn } from '@clerk/nextjs';
import { X, Check, Gift, Truck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginModal() {
    const { isOpen, onClose } = useLoginModal();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
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
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors md:top-4 md:right-4 top-2 right-2"
                            >
                                <X size={24} />
                            </button>

                            {/* Mobile Layout Content */}
                            <div className="md:hidden w-full h-full flex flex-col">
                                {/* Header Mobile */}
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-[#800020] font-bold text-lg">Identificação</h2>
                                    {/* Close button is absolute in parent, but we can hide it and put one here for mobile flow ownership if needed, 
                                            but keeping the absolute one is fine. Let's adjust top spacing. */}
                                </div>

                                <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                                    <div className="mb-6">
                                        <h1 className="text-3xl text-slate-800 mb-2">
                                            Olá, <span className="font-cookie text-5xl text-[#800020]">Bella.</span>
                                        </h1>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Entre para acessar seu carrinho e nossa curadoria exclusiva de peças íntimas.
                                        </p>
                                    </div>

                                    <SignIn
                                        appearance={{
                                            elements: {
                                                rootBox: "w-full",
                                                card: "shadow-none p-0 w-full",
                                                header: "hidden",
                                                footer: "hidden",
                                                formButtonPrimary: "bg-[#800020] hover:bg-[#600018] text-white rounded-xl py-3 text-base font-bold shadow-md shadow-rose-900/10 w-full normal-case mb-4",
                                                formFieldInput: "rounded-xl border-slate-200 focus:border-[#800020] focus:ring-[#800020]/20 bg-slate-50 py-3.5 px-4 text-base mb-1",
                                                formFieldLabel: "text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1",
                                                socialButtonsBlockButton: "rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm py-3 transition-colors h-12",
                                                socialButtonsBlockButtonText: "font-semibold",
                                                dividerLine: "bg-slate-100 h-px",
                                                dividerText: "text-slate-400 bg-white px-3 text-[10px] uppercase tracking-widest font-medium",
                                                formFieldRow: "mb-3"
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

                                    {/* Mobile: Benefits Section (Why LyVest?) */}
                                    <div className="mt-8 bg-rose-50/60 rounded-2xl p-6 border border-rose-100/50">
                                        <h3 className="text-[#800020] font-serif text-lg font-bold mb-4">Why LyVest?</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <Heart size={16} className="text-[#800020] fill-[#800020]" />
                                                <span>Embalagem Discreta e Perfumada</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <Heart size={16} className="text-[#800020] fill-[#800020]" />
                                                <span>Primeira Troca Grátis</span>
                                            </div>
                                            {/* <div className="flex items-center gap-3 text-sm text-slate-600">
                                                    <Heart size={16} className="text-[#800020] fill-[#800020]" />
                                                    <span>Curadoria Exclusiva</span>
                                                </div> */}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Content (Hidden on Mobile) */}
                            <div className="hidden md:flex flex-col items-center justify-center min-h-full w-full max-w-sm mx-auto">
                                <div className="text-center md:text-left mb-6 w-full">
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
