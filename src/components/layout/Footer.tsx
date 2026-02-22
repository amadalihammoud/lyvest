
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
                        <div className="flex flex-col items-center justify-between w-full md:h-[200px]">
                            {/* Social Icons - Occupying Rows 1 & 2 space */}
                            <div className="flex items-center justify-center gap-6 h-[72px]">
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="Instagram">
                                    {/* Instagram has a full colorful square so w-11 fills the space perfectly */}
                                    <Image src="/assets/icons/instagram-logo.webp" alt="Instagram" width={80} height={80} className="w-11 h-11 object-contain" />
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="Facebook">
                                    {/* Facebook 'f' letterform has lots of white canvas — scaled up to visually match Instagram */}
                                    <Image src="/assets/icons/facebook-logo.webp" alt="Facebook" width={80} height={80} className="w-[52px] h-[52px] object-contain" />
                                </a>
                                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="X">
                                    {/* X letterform also has white canvas — scaled up to visually match Instagram */}
                                    <Image src="/assets/icons/x-logo.webp" alt="X" width={80} height={80} className="w-[46px] h-[46px] object-contain" />
                                </a>
                            </div>

                            {/* Base Headers - Centered at Row 3 Level ('Endereço') */}
                            <div className="flex items-center justify-center gap-12 w-full h-6 mt-2">
                                <h3 className="text-[13px] md:text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-none text-center whitespace-nowrap">{t('footer.paymentMethods')}</h3>
                                <h3 className="text-[13px] md:text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-none text-center whitespace-nowrap">{t('footer.security')}</h3>
                            </div>

                            {/* Icons row — all side by side, same center alignment */}
                            <div className="flex items-center justify-center gap-4 md:gap-6 flex-nowrap mt-3">
                                {/* Visa */}
                                <Image src="/assets/icons/visa-logo.webp" alt="Visa" width={100} height={40} className="h-9 md:h-10 w-auto object-contain" />
                                {/* Mastercard */}
                                <Image src="/assets/icons/mastercard-logo.webp" alt="Mastercard" width={100} height={40} className="h-9 md:h-10 w-auto object-contain" />
                                {/* Pix */}
                                <Image src="/assets/icons/pix-logo.webp" alt="Pix" width={160} height={40} className="h-9 md:h-10 w-auto object-contain" />

                                {/* Divider */}
                                <div className="h-10 w-[1px] bg-slate-200 mx-2 md:mx-6 shrink-0"></div>

                                {/* Security */}
                                <Image src="/assets/icons/logo-seguranca.webp" alt="Let's Encrypt" width={200} height={60} className="h-11 md:h-12 w-auto object-contain" />
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








