
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

                {/* Grid flat único 3 colunas — cols 1+2 auto-placement intercalado, col 3 posicionamento explícito */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-3 max-w-5xl mx-auto mb-12 items-start">

                    {/* ── Cols 1+2: 12 filhos intercalados (auto-placement preenche col1 e col2) ── */}

                    {/* Row 1 — cabeçalhos */}
                    <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] pb-3 text-center md:text-left order-1 md:order-none md:col-start-1">
                        {t('footer.help')}
                    </h3>
                    <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] pb-3 text-center md:text-left order-7 md:order-none md:col-start-2">
                        {t('footer.legal')}
                    </h3>

                    {/* Row 2 */}
                    <div className="text-base text-slate-600 text-center md:text-left order-2 md:order-none md:col-start-1">
                        <button onClick={() => setActiveModal('about')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 w-full text-center md:text-left p-0">
                            {t('footer.about')}
                        </button>
                    </div>
                    <div className="text-sm text-slate-600 text-center md:text-left order-8 md:order-none md:col-start-2">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.razaoSocial')}:</strong>{' '}
                        <span>Ly Vest Moda Feminina LTDA</span>
                    </div>

                    {/* Row 3 */}
                    <div className="text-base text-slate-600 text-center md:text-left order-3 md:order-none md:col-start-1">
                        <button onClick={() => setActiveModal('shipping')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 w-full text-center md:text-left p-0">
                            {t('footer.shipping')}
                        </button>
                    </div>
                    <div className="text-sm text-slate-600 text-center md:text-left order-9 md:order-none md:col-start-2">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.cnpj')}:</strong>{' '}
                        <span>29.015.357/0001-25</span>
                    </div>

                    {/* Row 4 */}
                    <div className="text-base text-slate-600 text-center md:text-left order-4 md:order-none md:col-start-1">
                        <button onClick={() => setActiveModal('returns')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 w-full text-center md:text-left p-0">
                            {t('footer.returns')}
                        </button>
                    </div>
                    <div className="text-sm text-slate-600 text-center md:text-left order-10 md:order-none md:col-start-2">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.address')}:</strong>{' '}
                        <span>Av. Ana Costa, 433 - Santos - SP</span>
                    </div>

                    {/* Row 5 */}
                    <div className="text-base text-slate-600 text-center md:text-left order-5 md:order-none md:col-start-1">
                        <button onClick={() => setActiveModal('faq')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 w-full text-center md:text-left p-0">
                            {t('footer.faq')}
                        </button>
                    </div>
                    <div className="text-sm text-slate-600 text-center md:text-left order-11 md:order-none md:col-start-2">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.email')}:</strong>{' '}
                        <span>contato@lyvest.com.br</span>
                    </div>

                    {/* Row 6 */}
                    <div className="text-base text-slate-600 text-center md:text-left order-6 md:order-none md:col-start-1">
                        <button onClick={() => setActiveModal('privacy')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 w-full text-center md:text-left p-0">
                            {t('footer.privacy')}
                        </button>
                    </div>
                    <div className="text-sm text-slate-600 text-center md:text-left order-12 md:order-none md:col-start-2">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.phone')}:</strong>{' '}
                        <span>(13) 9 9624-6969</span>
                    </div>

                    {/* ── Col 3: posicionamento explícito ── */}

                    {/* Vértice — SIGA-NOS: col 3, rows 1-3 */}
                    <div className="flex flex-col items-center gap-4 order-13 md:order-none md:col-start-3 md:row-start-1 md:row-span-3">
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] pb-3 text-center">
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

                    {/* Base — FORMAS DE PAGAMENTO + SEGURANÇA: col 3, row 4 — alinha com Trocas/Endereço */}
                    <div className="flex items-start justify-between w-full order-14 md:order-none md:col-start-3 md:row-start-4">

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
