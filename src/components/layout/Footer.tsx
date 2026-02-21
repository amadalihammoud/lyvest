
'use client';
import { useI18n } from '../../hooks/useI18n';
import Image from 'next/image';

import { useModal } from '../../context/ModalContext';

export default function Footer() {
    const { t } = useI18n();
    const { openModal } = useModal();

    // Helper to open modal
    const setActiveModal = (modalName: string) => openModal(modalName as any);

    return (
        <footer id="footer" className="bg-white pt-16 pb-8 border-t border-slate-100" role="contentinfo">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-12 max-w-6xl mx-auto">
                    {/* Ajuda */}
                    <div className="flex flex-col h-full items-center md:items-start">
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] mb-6 text-center md:text-left">{t('footer.help')}</h3>
                        <div className="flex-1 w-full max-w-md mx-auto md:mx-0">
                            <ul className="flex flex-col gap-3 text-base text-slate-600 w-full">
                                <li className="text-center md:text-left"><button onClick={() => setActiveModal('about')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">{t('footer.about')}</button></li>
                                <li className="text-center md:text-left"><button onClick={() => setActiveModal('shipping')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">{t('footer.shipping')}</button></li>
                                <li className="text-center md:text-left"><button onClick={() => setActiveModal('returns')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">{t('footer.returns')}</button></li>
                                <li className="text-center md:text-left"><button onClick={() => setActiveModal('faq')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">{t('footer.faq')}</button></li>
                                <li className="text-center md:text-left"><button onClick={() => setActiveModal('privacy')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">{t('footer.privacy')}</button></li>
                            </ul>
                        </div>
                    </div>

                    {/* Legal */}
                    <div className="flex flex-col h-full items-center md:items-start">
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] mb-6 text-center md:text-left">{t('footer.legal')}</h3>
                        <div className="flex-1 w-full max-w-md mx-auto md:mx-0">
                            <ul className="flex flex-col gap-3 text-sm md:text-base text-slate-600">
                                <li className="text-center md:text-left">
                                    <strong className="text-slate-700 font-semibold">{t('footer.company.razaoSocial')}:</strong> <span>Ly Vest Moda Feminina LTDA</span>
                                </li>
                                <li className="text-center md:text-left">
                                    <strong className="text-slate-700 font-semibold">{t('footer.company.cnpj')}:</strong> <span>29.015.357/0001-25</span>
                                </li>
                                <li className="text-center md:text-left">
                                    <strong className="text-slate-700 font-semibold">{t('footer.company.address')}:</strong> <span>Av. Ana Costa, 433 - Santos - SP</span>
                                </li>
                                <li className="text-center md:text-left">
                                    <strong className="text-slate-700 font-semibold">{t('footer.company.email')}:</strong> <span>contato@lyvest.com.br</span>
                                </li>
                                <li className="text-center md:text-left">
                                    <strong className="text-slate-700 font-semibold">{t('footer.company.phone')}:</strong> <span>(13) 9 9624-6969</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Social, Payment & Security */}
                    <div className="flex flex-col h-full items-center md:items-start gap-10">
                        {/* Social Media */}
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.15em]">{t('footer.followUs')}</h3>
                            <div className="flex items-center gap-6">
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="Instagram">
                                    <Image src="/instagram-logo.webp" alt="Instagram" width={32} height={32} className="w-8 h-8 object-contain" />
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="Facebook">
                                    <Image src="/facebook-logo.webp" alt="Facebook" width={32} height={32} className="w-8 h-8 object-contain" />
                                </a>
                                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="X">
                                    <Image src="/x-logo.webp" alt="X" width={24} height={24} className="w-6 h-6 object-contain" />
                                </a>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.15em]">{t('footer.paymentMethods')}</h3>
                            <div className="flex items-center gap-3">
                                <div className="h-10 px-3 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-100">
                                    <Image src="/visa-logo.webp" alt="Visa" width={40} height={14} className="h-6 w-auto object-contain" />
                                </div>
                                <div className="h-10 px-2 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-100">
                                    <svg viewBox="0 0 131.39 86.9" className="h-6">
                                        <circle fill="#EB001B" cx="43.45" cy="43.45" r="43.45" />
                                        <circle fill="#F79E1B" cx="87.94" cy="43.45" r="43.45" />
                                        <path fill="#FF5F00" d="M65.7 11.2a43.35 43.35 0 0 0-16.2 32.3 43.35 43.35 0 0 0 16.2 32.3 43.35 43.35 0 0 0 16.2-32.3 43.35 43.35 0 0 0-16.2-32.3z" />
                                    </svg>
                                </div>
                                <div className="h-10 px-2 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-100">
                                    <Image src="/pix-logo.webp" alt="Pix" width={40} height={22} className="h-6 w-auto object-contain" />
                                </div>
                            </div>
                        </div>

                        {/* Security Seals */}
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.15em]">{t('footer.security')}</h3>
                            <div className="flex items-center gap-4 h-10">
                                <Image src="/lets-encrypt.webp" alt="Let's Encrypt" width={50} height={32} className="h-full w-auto object-contain" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-slate-100 pt-6 text-center">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-slate-500 text-sm mb-2">
                        <button onClick={() => setActiveModal('terms')} className="hover:text-lyvest-500 transition-colors">{t('footer.terms')}</button>
                    </div>
                    <p className="text-slate-500 text-sm">
                        {t('footer.copyright')}
                    </p>
                </div>
            </div>
        </footer>
    );
}








