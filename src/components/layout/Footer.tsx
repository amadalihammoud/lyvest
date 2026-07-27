
'use client';
import Image from 'next/image';

import { REDES_SOCIAIS, type RedeKey } from './socialIcons';
import { useI18n } from '../../hooks/useI18n';
import { useModal } from '../../store/useModalStore';

/**
 * Redes exibidas no rodapé, na ordem.
 *
 * ⚠️ AS URLs DE PERFIL AINDA NÃO SÃO REAIS.
 *
 * Apontam para a home de cada plataforma — herdado do código anterior, não uma
 * escolha. Um link que leva o cliente para fora do site e o deixa na página de
 * login do Instagram é pior que não ter link nenhum. Substituir por
 * `instagram.com/lyvest` e equivalentes assim que os perfis forem confirmados.
 *
 * Só linke canal ATIVO: perfil parado há meses comunica loja abandonada
 * exatamente no momento em que o cliente foi procurar sinal de confiança.
 *
 * O WhatsApp usa o telefone que este mesmo rodapé já publica logo abaixo.
 * ATENÇÃO: o botão flutuante (FloatingWhatsApp) usa OUTRO número,
 * `5513999999999`, que é claramente um placeholder — ou seja, hoje ele não
 * chega a lugar nenhum. Os dois precisam apontar para o mesmo lugar.
 */
const REDES = [
    { chave: 'instagram', url: 'https://instagram.com' },
    { chave: 'whatsapp', url: 'https://wa.me/5513996246969' },
    { chave: 'tiktok', url: 'https://tiktok.com' },
    { chave: 'pinterest', url: 'https://pinterest.com' },
    { chave: 'facebook', url: 'https://facebook.com' },
] as const satisfies ReadonlyArray<{ chave: RedeKey; url: string }>;

export default function Footer() {
    const { t } = useI18n();
    const { openModal } = useModal();

    const setActiveModal = (modalName: string) => openModal(modalName);

    return (
        <footer id="footer" className="bg-white pt-16 pb-8 border-t border-slate-100" role="contentinfo">
            <div className="container mx-auto px-4">

                {/*
                   Bloco de marca IRMÃO do grid, não uma quarta coluna dele.

                   O grid abaixo é afinado à mão (larguras de 141px e 220px para
                   centrar títulos sobre os ícones, Let's Encrypt absoluto para
                   não inflar a altura da linha). Enfiar uma coluna nova obrigaria
                   a deslocar todo `md:col-start-N` e refazer esse alinhamento.
                   Como flex-irmão, o grid fica intacto.
                */}
                <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-start gap-10 md:gap-12">

                    <div className="md:w-[300px] md:shrink-0 flex flex-col items-center md:items-start gap-5">
                        <Image
                            src="/assets/logos/lyvest-red-logo.webp"
                            alt="Ly Vest"
                            width={300}
                            height={90}
                            className="h-12 w-auto"
                        />

                        {/* Texto da própria metadata do site (app/layout.tsx), não
                            inventado aqui — para a marca dizer a mesma coisa na
                            aba do navegador, no Google e no rodapé. */}
                        <p className="text-base text-slate-600 leading-relaxed text-center md:text-left">
                            Moda íntima com conforto e sofisticação. Descubra nossa coleção
                            exclusiva de lingeries, pijamas e acessórios.
                        </p>

                        {/* Redes sociais. Vieram da coluna 3 (o antigo "SIGA-NOS")
                            em vez de duplicadas: dois conjuntos do mesmo link no
                            mesmo rodapé confundem quem navega por teclado e
                            repetem o mesmo destino para leitor de tela. */}
                        <nav className="flex items-center gap-5" aria-label="Redes sociais">
                            {REDES.map(({ chave, url }) => {
                                const { titulo, path } = REDES_SOCIAIS[chave];
                                return (
                                    <a
                                        key={chave}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={titulo}
                                        className="text-lyvest-500 hover:text-lyvest-600 hover:scale-110 transition-all duration-200"
                                    >
                                        {/*
                                           `fill="currentColor"` é o ponto todo: a cor
                                           vem da classe do link, não do arquivo. Foi o
                                           que permitiu sair do azul do Facebook e do
                                           gradiente do Instagram para o carmim da marca.
                                        */}
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
                                            <path d={path} />
                                        </svg>
                                    </a>
                                );
                            })}
                        </nav>
                    </div>

                {/* Grid flat único 3 colunas — cols 1+2 auto-placement intercalado, col 3 posicionamento explícito */}
                <div className="grid grid-cols-1 md:grid-cols-[auto_auto] gap-x-10 gap-y-3 flex-1 items-center">

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
                    <div className="text-sm text-slate-600 text-center md:text-left order-8 md:order-none md:col-start-2 whitespace-nowrap">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.razaoSocial')}:</strong>{' '}
                        <span>Ly Vest Moda Feminina LTDA</span>
                    </div>

                    {/* Row 3 */}
                    <div className="text-base text-slate-600 text-center md:text-left order-3 md:order-none md:col-start-1">
                        <button onClick={() => setActiveModal('shipping')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 w-full text-center md:text-left p-0">
                            {t('footer.shipping')}
                        </button>
                    </div>
                    <div className="text-sm text-slate-600 text-center md:text-left order-9 md:order-none md:col-start-2 whitespace-nowrap">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.cnpj')}:</strong>{' '}
                        <span>29.015.357/0001-25</span>
                    </div>

                    {/* Row 4 */}
                    <div className="text-base text-slate-600 text-center md:text-left order-4 md:order-none md:col-start-1">
                        <button onClick={() => setActiveModal('returns')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 w-full text-center md:text-left p-0">
                            {t('footer.returns')}
                        </button>
                    </div>
                    <div className="text-sm text-slate-600 text-center md:text-left order-10 md:order-none md:col-start-2 whitespace-nowrap">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.address')}:</strong>{' '}
                        <span>Av. Ana Costa, 433 - Santos - SP</span>
                    </div>

                    {/* Row 5 */}
                    <div className="text-base text-slate-600 text-center md:text-left order-5 md:order-none md:col-start-1">
                        <button onClick={() => setActiveModal('faq')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 w-full text-center md:text-left p-0">
                            {t('footer.faq')}
                        </button>
                    </div>
                    <div className="text-sm text-slate-600 text-center md:text-left order-11 md:order-none md:col-start-2 whitespace-nowrap">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.email')}:</strong>{' '}
                        <span>contato@lyvest.com.br</span>
                    </div>

                    {/* Row 6 */}
                    <div className="text-base text-slate-600 text-center md:text-left order-6 md:order-none md:col-start-1">
                        <button onClick={() => setActiveModal('privacy')} className="hover:text-lyvest-500 transition-colors hover:translate-x-1 duration-200 w-full text-center md:text-left p-0">
                            {t('footer.privacy')}
                        </button>
                    </div>
                    <div className="text-sm text-slate-600 text-center md:text-left order-12 md:order-none md:col-start-2 whitespace-nowrap">
                        <strong className="text-slate-700 font-semibold">{t('footer.company.phone')}:</strong>{' '}
                        <span>(13) 9 9624-6969</span>
                    </div>

                    </div>

                    {/*
                       ── Selos: SEGURANÇA + PAGAMENTO ──

                       Terceiro irmão flex, FORA do grid. Enquanto era a coluna 3
                       dele, cada elemento daqui dividia linha com um item de
                       AJUDA — e a altura da linha é a do elemento mais alto. O
                       logo do Let's Encrypt tem 61px contra ~24px de uma linha de
                       texto, então a linha inteira esticava e, com items-center,
                       "Quem somos" ganhava 18px extras de folga: 54px até o item
                       seguinte, contra 36px entre todos os outros.

                       O código antigo contornava isso posicionando o logo de
                       forma absoluta. Funcionava, mas mantinha o acoplamento: a
                       coluna da direita continuava capaz de deformar a da
                       esquerda, e qualquer selo novo reabriria o problema.

                       Fora do grid, as duas colunas não têm mais como se
                       influenciar — e junto foram embora os md:row-start-1..6,
                       md:col-start-3, md:row-span-2 e os order-[13..17].
                    */}
                    <div className="md:w-[240px] md:shrink-0 flex flex-col items-center gap-3">
                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-tight">
                            {t('footer.security')}
                        </h3>

                        <div className="w-[220px] h-[61px] flex items-center justify-center">
                            <Image src="/assets/icons/logo-seguranca.webp" alt="Let's Encrypt" width={220} height={61} className="max-w-full max-h-full object-contain" />
                        </div>

                        <div className="border-t border-slate-100 w-full" />

                        <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-[0.1em] leading-tight mt-1">
                            {t('footer.paymentMethods')}
                        </h3>

                        <div className="flex items-center justify-center gap-2">
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
