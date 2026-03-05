
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

                {/* 3 colunas igualmente espaçadas */}
                <div className="flex flex-col md:flex-row gap-10 max-w-5xl mx-auto mb-12">

                    {/* Coluna 1 — AJUDA */}
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] pb-3">
                            {t('footer.help')}
                        </h3>
                        <div className="flex flex-col gap-2 text-base text-slate-600">
                            <button onClick={() => setActiveModal('about')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left p-0">
                                {t('footer.about')}
                            </button>
                            <button onClick={() => setActiveModal('shipping')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left p-0">
                                {t('footer.shipping')}
                            </button>
                            <button onClick={() => setActiveModal('returns')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left p-0">
                                {t('footer.returns')}
                            </button>
                            <button onClick={() => setActiveModal('faq')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left p-0">
                                {t('footer.faq')}
                            </button>
                            <button onClick={() => setActiveModal('privacy')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 text-center md:text-left p-0">
                                {t('footer.privacy')}
                            </button>
                        </div>
                    </div>

                    {/* Coluna 2 — INFORMAÇÕES LEGAIS */}
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] pb-3">
                            {t('footer.legal')}
                        </h3>
                        <div className="flex flex-col gap-2 text-sm text-slate-600">
                            <div>
                                <strong className="text-slate-700 font-semibold">{t('footer.company.razaoSocial')}:</strong>{' '}
                                <span>Ly Vest Moda Feminina LTDA</span>
                            </div>
                            <div>
                                <strong className="text-slate-700 font-semibold">{t('footer.company.cnpj')}:</strong>{' '}
                                <span>29.015.357/0001-25</span>
                            </div>
                            <div>
                                <strong className="text-slate-700 font-semibold">{t('footer.company.address')}:</strong>{' '}
                                <span>Av. Ana Costa, 433 - Santos - SP</span>
                            </div>
                            <div>
                                <strong className="text-slate-700 font-semibold">{t('footer.company.email')}:</strong>{' '}
                                <span>contato@lyvest.com.br</span>
                            </div>
                            <div>
                                <strong className="text-slate-700 font-semibold">{t('footer.company.phone')}:</strong>{' '}
                                <span>(13) 9 9624-6969</span>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 3 — SIGA-NOS + SEGURANÇA + PAGAMENTO */}
                    <div className="flex-1 text-center md:text-left">
                        {/* Siga-nos */}
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] pb-3">
                            {t('footer.followUs')}
                        </h3>
                        <div className="flex items-center justify-center md:justify-start gap-[30px] mb-6">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-200" aria-label="Instagram">
                                <div className="w-[27px] h-[27px] flex items-center justify-center">
                                    <Image src="/assets/icons/instagram-logo.webp" alt="Instagram" width={54} height={54} className="max-w-full max-h-full object-contain" />
                                </div>
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-200" aria-label="Facebook">
                                <div className="w-[27px] h-[27px] flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/assets/icons/facebook-logo.svg" alt="Facebook" className="max-w-full max-h-full object-contain" />
                                </div>
                            </a>
                            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-200" aria-label="X">
                                <div className="w-[27px] h-[27px] flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/assets/icons/x-logo.svg" alt="X" className="max-w-full max-h-full object-contain" />
                                </div>
                            </a>
                        </div>

                        {/* Segurança */}
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] pb-2">
                            {t('footer.security')}
                        </h3>
                        <div className="flex justify-center md:justify-start mb-6">
                            <Image src="/assets/icons/logo-seguranca.webp" alt="Let's Encrypt" width={160} height={44} className="object-contain" />
                        </div>

                        {/* Pagamento */}
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] pb-2">
                            {t('footer.paymentMethods')}
                        </h3>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <div className="w-[50px] h-[38px] flex items-center justify-center">
                                <Image src="/assets/icons/visa-logo.webp" alt="Visa" width={90} height={28} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="w-[55px] h-[42px] flex items-center justify-center">
                                <Image src="/assets/icons/mastercard-logo.webp" alt="Mastercard" width={90} height={70} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="w-[55px] h-[42px] flex items-center justify-center">
                                <Image src="/assets/icons/pix-logo.webp" alt="Pix" width={150} height={80} className="max-w-full max-h-full object-contain" />
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
