import { useI18n } from '../../hooks/useI18n';

/**
 * About modal displaying company information, mission and values
 */
export default function AboutModal(): React.ReactElement {
    const { t } = useI18n();

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center gap-4 flex-shrink-0">
                <div className="w-12 h-12 bg-lyvest-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('footer.about')}</h2>
                    <p className="text-slate-500 text-sm">Conheça um pouco mais sobre a nossa história.</p>
                </div>
            </div>

            {/* Content Body - Compact Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                        {/* 1. Story Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:col-span-1 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-lyvest-100/30 rounded-2xl flex items-center justify-center text-3xl mb-6">
                                💖
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4">
                                "Organizando sonhos com amor e estilo desde 2026."
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm text-justify">
                                A <strong>Ly Vest</strong> nasceu do desejo de oferecer moda feminina com estilo e elegância.
                                Acreditamos que vestir-se bem não precisa ser complicado, mas sim uma experiência prazerosa e confiante.
                            </p>
                        </div>

                        {/* 2. Mission Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:col-span-1 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-3xl mb-6">
                                🚀
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4">
                                Nossa Missão
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm text-justify">
                                Trazer conforto e confiança para o seu dia a dia através de lingerie delicada, funcional e de alta qualidade.
                                Queremos ser sua parceira na valorização da sua beleza, oferecendo peças que encantam e abraçam.
                            </p>
                        </div>

                        {/* 3. Values Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:col-span-1 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-6">
                                💎
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4">
                                Nossos Valores
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-[#C05060] mt-1.5 shrink-0"></span>
                                    <span><strong>Criatividade:</strong> Design autoral e exclusivo.</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-[#C05060] mt-1.5 shrink-0"></span>
                                    <span><strong>Qualidade:</strong> Materiais premium.</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-[#C05060] mt-1.5 shrink-0"></span>
                                    <span><strong>Comunidade:</strong> Crescer junto com você.</span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
