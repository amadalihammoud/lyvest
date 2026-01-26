import React from 'react';
import { useModal } from '../../hooks/useModal';
import { useI18n } from '../../hooks/useI18n';
import { legalContent } from '../../data/legalData';
import { Mail, Instagram } from 'lucide-react';

export default function ContactModal() {
    const { closeModal } = useModal();
    const { t } = useI18n();

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center gap-4 flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('modals.contact.title')}</h2>
                    <p className="text-slate-500 text-sm">{t('modals.contact.subtitle')}</p>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row w-full max-w-4xl">

                    {/* Left: Info Hero */}
                    <div className="bg-purple-500 p-8 md:p-12 text-white flex flex-col justify-center items-center md:items-start text-center md:text-left w-full md:w-2/5">
                        <h3 className="text-2xl font-bold mb-4">{t('modals.contact.helpTitle')}</h3>
                        <p className="text-purple-100 mb-8 leading-relaxed">
                            {legalContent.companyInfo.attendance}
                        </p>
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Mail className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Right: Contact Details */}
                    <div className="p-8 md:p-12 w-full md:w-3/5 flex flex-col justify-center space-y-6">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('modals.contact.emailLabel')}</span>
                            <a href={`mailto:${legalContent.companyInfo.email}`} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-purple-50 transition-colors group cursor-pointer border border-transparent hover:border-purple-100">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-500 group-hover:scale-110 transition-transform">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-slate-700 group-hover:text-purple-700">{legalContent.companyInfo.email}</span>
                            </a>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('modals.contact.socialLabel')}</span>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-lyvest-100/30 transition-colors group cursor-pointer border border-transparent hover:border-lyvest-100">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-lyvest-500 group-hover:scale-110 transition-transform">
                                    <Instagram className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-slate-700 group-hover:text-lyvest-600">@lyvest</span>
                            </a>
                        </div>

                        <div className="pt-6 mt-auto">
                            <button onClick={closeModal} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-200">
                                {t('aria.close')}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}







