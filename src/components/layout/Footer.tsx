
'use client';
import Image from 'next/image';

import { useModal } from '../../store/useModalStore';
import { useI18n } from '../../hooks/useI18n';

export default function Footer() {
    const { t } = useI18n();
    const { openModal } = useModal();

    const setActiveModal = (modalName: string) => openModal(modalName as any);

    return (
        <footer id="footer" className="bg-white pt-16 pb-8 border-t border-slate-100" role="contentinfo">
            <div className="container mx-auto px-4">

                {/* Main 3-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto mb-12">

                    {/* Coluna 1 — Ajuda */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] mb-6 text-center md:text-left">
                            {t('footer.help')}
                        </h3>
                        <ul className="flex flex-col gap-3 text-base text-slate-600">
                            <li className="text-center md:text-left">
                                <button onClick={() => setActiveModal('about')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">
                                    {t('footer.about')}
                                </button>
                            </li>
                            <li className="text-center md:text-left">
                                <button onClick={() => setActiveModal('shipping')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">
                                    {t('footer.shipping')}
                                </button>
                            </li>
                            <li className="text-center md:text-left">
                                <button onClick={() => setActiveModal('returns')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">
                                    {t('footer.returns')}
                                </button>
                            </li>
                            <li className="text-center md:text-left">
                                <button onClick={() => setActiveModal('faq')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">
                                    {t('footer.faq')}
                                </button>
                            </li>
                            <li className="text-center md:text-left">
                                <button onClick={() => setActiveModal('privacy')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left w-full p-0">
                                    {t('footer.privacy')}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Coluna 2 — Informações Legais */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] mb-6 text-center md:text-left">
                            {t('footer.legal')}
                        </h3>
                        <ul className="flex flex-col gap-3 text-sm text-slate-600">
                            <li className="text-center md:text-left">
                                <strong className="text-slate-700 font-semibold">{t('footer.company.razaoSocial')}:</strong>{' '}
                                <span>Ly Vest Moda Feminina LTDA</span>
                            </li>
                            <li className="text-center md:text-left">
                                <strong className="text-slate-700 font-semibold">{t('footer.company.cnpj')}:</strong>{' '}
                                <span>29.015.357/0001-25</span>
                            </li>
                            <li className="text-center md:text-left">
                                <strong className="text-slate-700 font-semibold">{t('footer.company.address')}:</strong>{' '}
                                <span>Av. Ana Costa, 433 - Santos - SP</span>
                            </li>
                            <li className="text-center md:text-left">
                                <strong className="text-slate-700 font-semibold">{t('footer.company.email')}:</strong>{' '}
                                <span>contato@lyvest.com.br</span>
                            </li>
                            <li className="text-center md:text-left">
                                <strong className="text-slate-700 font-semibold">{t('footer.company.phone')}:</strong>{' '}
                                <span>(13) 9 9624-6969</span>
                            </li>
                        </ul>
                    </div>

                    {/* Coluna 3 — Pirâmide: Siga-nos (vértice) + Pagamento & Segurança (base) */}
                    <div className="flex flex-col items-center gap-8">

                        {/* Vértice — Siga-nos (centralizado) */}
                        <div className="flex flex-col items-center gap-4">
                            <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] text-center">
                                {t('footer.followUs')}
                            </h3>
                            <div className="flex items-center justify-center gap-6">
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-200" aria-label="Instagram">
                                    <Image src="/assets/icons/instagram-logo.webp" alt="Instagram" width={80} height={80} className="w-[37px] h-[37px] object-contain" />
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-200" aria-label="Facebook">
                                    <Image src="/assets/icons/facebook-logo.webp" alt="Facebook" width={80} height={80} className="w-[57px] h-[57px] object-contain" />
                                </a>
                                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-200" aria-label="X">
                                    <Image src="/assets/icons/x-logo.webp" alt="X" width={80} height={80} className="w-[46px] h-[46px] object-contain" />
                                </a>
                            </div>
                        </div>

                        {/* Base — Formas de Pagamento (esq.) + Segurança (dir.) */}
                        <div className="flex items-start justify-between w-full">

                            {/* Formas de Pagamento */}
                            <div className="flex flex-col items-center gap-2">
                                <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-[0.1em] text-center leading-tight">
                                    {t('footer.paymentMethods')}
                                </h3>
                                <div className="flex items-center justify-center gap-1">
                                    <Image src="/assets/icons/visa-logo.webp" alt="Visa" width={90} height={28} className="h-[18px] w-auto object-contain" />
                                    <Image src="/assets/icons/mastercard-logo.webp" alt="Mastercard" width={90} height={70} className="h-[28px] w-auto object-contain" />
                                    <Image src="/assets/icons/pix-logo.webp" alt="Pix" width={150} height={80} className="h-[22px] w-auto object-contain" />
                                </div>
                            </div>

                            {/* Segurança */}
                            <div className="flex flex-col items-center gap-2">
                                <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-[0.1em] text-center leading-tight">
                                    {t('footer.security')}
                                </h3>
                                <div className="flex items-center justify-center">
                                    <Image src="/assets/icons/logo-seguranca.webp" alt="Let's Encrypt" width={180} height={50} className="h-[40px] w-auto object-contain" />
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Copyright */}
                <div className="border-t border-slate-100 pt-6 text-center">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-slate-500 text-sm mb-2">
                        <button onClick={() => setActiveModal('terms')} className="hover:text-lyvest-500 transition-colors">
                            {t('footer.terms')}
                        </button>
                    </div>
                    <p className="text-slate-500 text-sm">
                        {t('footer.copyright')}
                    </p>
                </div>

            </div>
        </footer>
    );
}
