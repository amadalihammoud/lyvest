'use client';
import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

interface CookieBannerProps {
    onOpenPrivacy: () => void;
}

export default function CookieBanner({ onOpenPrivacy }: CookieBannerProps): React.ReactElement | null {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setTimeout(() => setIsVisible(true), 2000);
        }
    }, []);

    const handleAccept = (): void => {
        setIsClosing(true);
        setTimeout(() => {
            localStorage.setItem('cookie-consent', 'accepted');
            setIsVisible(false);
        }, 500);
    };

    const handleRefuse = (): void => {
        setIsClosing(true);
        setTimeout(() => {
            localStorage.setItem('cookie-consent', 'refused');
            setIsVisible(false);
        }, 500);
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-4 left-4 right-4 z-[100] flex justify-center ${isClosing ? 'animate-slide-down-exit' : 'animate-slide-up'}`}>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20 flex flex-col md:flex-row items-center gap-6 max-w-4xl w-full ring-1 ring-black/5">
                <div className="bg-lyvest-100 p-4 rounded-full flex-shrink-0 shadow-inner">
                    <Cookie className="w-8 h-8 text-lyvest-500 animate-pulse" />
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h4 className="font-bold text-slate-800 mb-2 text-lg">Cookies & Privacidade 🍪</h4>
                    <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                        Usamos cookies para melhorar sua experiência e analisar o tráfego.
                        Não vendemos seus dados. Veja nossa <button onClick={onOpenPrivacy} className="text-lyvest-500 font-bold hover:underline">Política de Privacidade</button>.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button
                        onClick={handleRefuse}
                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-all duration-200 hover:scale-105 active:scale-95 text-sm"
                    >
                        Recusar
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-6 py-3 rounded-xl bg-slate-900 text-white hover:bg-lyvest-500 font-bold transition-all duration-200 shadow-lg hover:shadow-[#800020]/30 hover:scale-105 active:scale-95 text-sm whitespace-nowrap"
                    >
                        Aceitar Todos
                    </button>
                </div>
            </div>
        </div>
    );
}
