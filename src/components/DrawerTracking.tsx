import React from 'react';
import { PackageSearch, X, CheckCircle } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';

import { useFocusTrap } from '../hooks/useFocusTrap';
import { mockOrders } from '../data/mockData';

interface TrackingHistory {
    status: string;
    date: string;
    label?: string;
    location?: string;
}

interface TrackingResult {
    status: string;
    date: string;
    location?: string;
    history?: TrackingHistory[];
}

interface DrawerTrackingProps {
    isOpen: boolean;
    onClose: () => void;
    trackingCode: string;
    setTrackingCode: (code: string) => void;
    trackingResult: TrackingResult | null;
    setTrackingResult: (result: TrackingResult | null) => void;
}

export default function DrawerTracking({ isOpen, onClose, trackingCode, setTrackingCode, trackingResult, setTrackingResult }: DrawerTrackingProps) {
    const { t, isRTL } = useI18n();

    const containerRef = React.useRef(null);
    useFocusTrap(isOpen);

    if (!isOpen) return null;

    const handleTrackingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingCode) return;
        // Simulação de rastreio
        // Simulação de rastreio inteligente
        const foundOrder = (window as any).mockOrders?.find((o: any) => o.trackingCode === trackingCode) ||
            (mockOrders && mockOrders.find((o: any) => o.trackingCode === trackingCode));

        if (foundOrder) {
            setTrackingResult({
                status: foundOrder.status,
                history: foundOrder.history || [],
                date: foundOrder.date
            });
        } else {
            // Fallback genérico se não encontrar
            setTrackingResult({
                status: t('tracking.status.inTransit'),
                location: "São Paulo, SP",
                date: "12/05/2026",
                history: [
                    { status: "transit", date: "12/05/2026 14:00", label: "Objeto em trânsito - Por favor aguarde", location: "São Paulo / SP" },
                    { status: "posted", date: "10/05/2026 09:30", label: "Objeto postado", location: "Curitiba / PR" }
                ]
            });
        }
    };

    return (
        <div ref={containerRef} className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="tracking-title">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            {/* Content */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                <div className="p-6 flex items-center justify-between bg-lyvest-500">
                    <h2 id="tracking-title" className="text-xl font-bold text-white flex items-center gap-2">
                        <PackageSearch className="w-5 h-5 text-white" /> {t('tracking.title')}
                    </h2>
                    <button onClick={onClose} className="p-3 hover:bg-white/20 rounded-full transition-colors text-white touch-target close-btn-mobile" aria-label={t('common.close')}>
                        <X className="w-7 h-7" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        <div className="bg-lyvest-100/30 p-6 rounded-2xl mb-6">
                            <h3 className="font-bold text-lyvest-500 mb-2">{t('tracking.title')}</h3>
                            <p className="text-sm text-slate-600">{t('tracking.placeholder')}</p>
                        </div>

                        {!trackingResult ? (
                            <form onSubmit={handleTrackingSubmit} className="space-y-4" noValidate>
                                <div className="relative">
                                    <PackageSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-[#E8C4C8]`} />
                                    <input
                                        type="text"
                                        value={trackingCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
                                            setTrackingCode(val);
                                        }}
                                        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border border-lyvest-100 focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all uppercase`}
                                        placeholder="Ex: TN123456BR"
                                        required
                                        maxLength={20}
                                    />
                                </div>
                                <button type="submit" className="w-full py-3 bg-gradient-to-r from-lyvest-500 to-lyvest-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                                    {t('tracking.button')}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 animate-fade-in shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="mt-1 bg-green-100 p-2 rounded-full">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{trackingResult.status}</h4>
                                        <p className="text-sm text-slate-500">Código: {trackingCode}</p>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-6 relative ml-2 before:absolute before:left-[7px] before:top-2 before:h-full before:w-[2px] before:bg-slate-100">
                                    {trackingResult.history ? (
                                        trackingResult.history.map((step, idx) => (
                                            <div key={idx} className="relative pl-8 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white ring-2 ring-[#F5E6E8] bg-lyvest-500"></div>
                                                <p className="font-bold text-slate-700 text-sm">{step.label}</p>
                                                <p className="text-xs text-slate-500">{step.date}</p>
                                                {step.location && <p className="text-xs text-slate-400 mt-0.5">{step.location}</p>}
                                            </div>
                                        ))
                                    ) : (
                                        // Fallback old view
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white ring-2 ring-[#F5E6E8] bg-green-500"></div>
                                            <p className="font-bold text-slate-700 text-sm">{trackingResult.status}</p>
                                            <p className="text-xs text-slate-500">{trackingResult.date || 'Hoje'}</p>
                                            {trackingResult.location && <p className="text-xs text-slate-400 mt-0.5">{trackingResult.location}</p>}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => { setTrackingResult(null); setTrackingCode(""); }}
                                    className="mt-8 w-full py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                                >
                                    {t('tracking.notFound') || 'Pesquisar Outro Código'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}







