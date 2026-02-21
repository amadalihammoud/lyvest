
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-12 max-w-7xl mx-auto">
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

                    {/* Social, Payment & Security - Precision Mirrored Column */}
                    <div className="flex flex-col items-center w-full">
                        {/* Peak Header (SIGA-NOS) - Matched exactly with others */}
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.15em] mb-6 text-center">{t('footer.followUs')}</h3>

                        {/* Content Area - Fixed height on desktop to mirror neighbor columns (5 lines * 24px + 4 gaps * 12px = 168px) */}
                        <div className="flex flex-col items-center justify-between w-full md:h-[168px]">
                            {/* Social Icons - Occupying Rows 1 & 2 space */}
                            <div className="flex items-center justify-center gap-6 h-[60px]">
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="Instagram">
                                    <Image src="/assets/icons/instagram-logo.webp" alt="Instagram" width={64} height={64} className="w-8 h-8 object-contain" />
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="Facebook">
                                    <Image src="/assets/icons/facebook-logo.webp" alt="Facebook" width={64} height={64} className="w-8 h-8 object-contain" />
                                </a>
                                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="X">
                                    <Image src="/assets/icons/x-logo.webp" alt="X" width={48} height={48} className="w-6 h-6 object-contain" />
                                </a>
                            </div>

                            {/* Base Headers - Centered at Row 3 Level ('Endereço') */}
                            <div className="flex items-center justify-center gap-12 w-full h-6 mt-2">
                                <h3 className="text-[13px] md:text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-none text-center whitespace-nowrap">{t('footer.paymentMethods')}</h3>
                                <h3 className="text-[13px] md:text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-none text-center whitespace-nowrap">{t('footer.security')}</h3>
                            </div>

                            {/* Base Icons - Bottom edge aligned with Row 5 Level ('Telefone') */}
                            <div className="flex items-center justify-center gap-5 md:gap-8 flex-nowrap overflow-visible h-12 md:h-14">
                                {/* Flags Group */}
                                <div className="flex items-center gap-5 md:gap-6">
                                    <Image src="/assets/icons/visa-logo.webp" alt="Visa" width={100} height={40} className="h-6 md:h-7 w-auto object-contain" />
                                    <Image src="/assets/icons/mastercard-logo.webp" alt="Mastercard" width={100} height={60} className="h-8 md:h-9 w-auto object-contain" />
                                    <Image src="/assets/icons/pix-logo.webp" alt="Pix" width={100} height={40} className="h-6 md:h-7 w-auto object-contain" />
                                </div>

                                {/* Divider */}
                                <div className="h-8 w-[1px] bg-slate-100 mx-2 md:mx-4"></div>

                                {/* Security Group */}
                                <div className="flex items-center justify-center h-12 md:h-14">
                                    <Image src="/assets/icons/logo-seguranca.webp" alt="Let's Encrypt" width={180} height={64} className="h-10 md:h-11 w-auto object-contain" />
                                </div>
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








