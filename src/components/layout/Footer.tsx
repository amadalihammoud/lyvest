
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
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr] gap-x-12 gap-y-3 max-w-5xl mx-auto mb-12 items-center">

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

                    {/* ── Col 3, Row 1: títulos SIGA-NOS ←→ SEGURANÇA ── */}
                    <div className="flex items-start justify-between w-full self-start order-13 md:order-none md:col-start-3 md:row-start-1">
                        {/* wrapper 141px = largura do cluster social → texto centrado acima do ícone Facebook */}
                        <div className="md:w-[141px] md:text-center">
                            <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-tight">
                                {t('footer.followUs')}
                            </h3>
                        </div>
                        {/* wrapper 220px = largura do LE → texto centrado acima do logo Let's Encrypt */}
                        <div className="md:w-[220px] md:text-center">
                            <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-tight">
                                {t('footer.security')}
                            </h3>
                        </div>
                    </div>

                    {/* ── Col 3, Row 2: cluster social (esq.) + LE (dir.) — LE abs para não inflacionar o row track ── */}
                    <div className="relative flex items-center w-full order-14 md:order-none md:col-start-3 md:row-start-2">
                        {/* Cluster social — 27×27 (−20%), gap-[30px] */}
                        <div className="flex items-center gap-[30px]">
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
                        {/* Let's Encrypt — 220×61 (+80%) — abs no desktop para não afetar row track height */}
                        <div className="ml-auto w-[220px] h-[61px] flex items-center justify-center md:ml-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
                            <Image src="/assets/icons/logo-seguranca.webp" alt="Let's Encrypt" width={220} height={61} className="max-w-full max-h-full object-contain" />
                        </div>
                    </div>

                    {/* ── Col 3, Row 3: divisor sutil — self-center para alinhar com mid-text dos adjacentes ── */}
                    <div className="border-t border-slate-100 w-full self-center order-15 md:order-none md:col-start-3 md:row-start-3" />

                    {/* ── Col 3, Row 4: PAGAMENTO — alinhado com "Trocas e Devoluções" ── */}
                    <div className="flex justify-center order-16 md:order-none md:col-start-3 md:row-start-4">
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-tight">
                            {t('footer.paymentMethods')}
                        </h3>
                    </div>

                    {/* ── Col 3, Rows 5-6: ícones de pagamento centralizados (ponta ▽) ── */}
                    <div className="flex items-center justify-center gap-2 order-17 md:order-none md:col-start-3 md:row-start-5 md:row-span-2">
                        <div className="w-[62px] h-[47px] flex items-center justify-center">
                            <Image src="/assets/icons/visa-logo.webp" alt="Visa" width={90} height={28} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="w-[81px] h-[61px] flex items-center justify-center">
                            <Image src="/assets/icons/mastercard-logo.webp" alt="Mastercard" width={90} height={70} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="w-[81px] h-[61px] flex items-center justify-center">
                            <Image src="/assets/icons/pix-logo.webp" alt="Pix" width={150} height={80} className="max-w-full max-h-full object-contain" />
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
