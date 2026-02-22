
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
                                    {/* Instagram has a full colorful square so width reduced by ~15% (44px -> 37px) */}
                                    <Image src="/assets/icons/instagram-logo.webp" alt="Instagram" width={80} height={80} className="w-[37px] h-[37px] object-contain" />
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="Facebook">
                                    {/* Facebook 'f' letterform has lots of white canvas — scaled up to visually match Instagram (+10%) */}
                                    <Image src="/assets/icons/facebook-logo.webp" alt="Facebook" width={80} height={80} className="w-[57px] h-[57px] object-contain" />
                                </a>
                                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform duration-200" aria-label="X">
                                    {/* X letterform also has white canvas — scaled up to visually match Instagram */}
                                    <Image src="/assets/icons/x-logo.webp" alt="X" width={80} height={80} className="w-[46px] h-[46px] object-contain" />
                                </a>
                            </div>

                            {/* Labels row — independently positioned to align with Trocas/Endereço level */}
                            <div className="grid grid-cols-[auto_1px_auto] gap-x-10 md:gap-x-16 mt-5 md:mt-6">
                                <h3 className="text-[13px] md:text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-none text-center whitespace-nowrap">{t('footer.paymentMethods')}</h3>
                                <span />
                                <h3 className="text-[13px] md:text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-none text-center whitespace-nowrap">{t('footer.security')}</h3>
                            </div>

                            {/* Icons row — same grid-cols pattern so columns align with labels above */}
                            <div className="grid grid-cols-[auto_1px_auto] gap-x-10 md:gap-x-16 mt-3 items-center">
                                {/* Payment icons — matched to reference proportions */}
                                <div className="flex items-center justify-center gap-3 md:gap-5">
                                    {/* Visa: tight-crop (400×152), bold wordmark → h-6/h-7 makes it dominant but compact */}
                                    <Image src="/assets/icons/visa-logo.webp" alt="Visa" width={90} height={28} className="h-6 md:h-7 w-auto object-contain" />
                                    {/* Mastercard: 200×200 square, circles fill 80% → needs h-[38px]/h-11 to appear same visual weight as Visa */}
                                    <Image src="/assets/icons/mastercard-logo.webp" alt="Mastercard" width={90} height={44} className="h-[38px] md:h-11 w-auto object-contain" />
                                    {/* Pix: tight-crop wide file, h-[38px]/h-11 shows diamond+text proportionally */}
                                    <Image src="/assets/icons/pix-logo.webp" alt="Pix" width={150} height={44} className="h-[38px] md:h-11 w-auto object-contain" />
                                </div>
                                {/* Vertical divider — spans full icon row */}
                                <div className="bg-slate-200 w-full self-stretch min-h-[44px]"></div>
                                {/* Let's Encrypt — reference shows it similar size to MC/Pix */}
                                <div className="flex items-center justify-center">
                                    <Image src="/assets/icons/logo-seguranca.webp" alt="Let's Encrypt" width={180} height={50} className="h-10 md:h-11 w-auto object-contain" />
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








