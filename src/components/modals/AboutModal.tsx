/**
 * About modal — document style matching other policy modals
 */
export default function AboutModal(): React.ReactElement {
    return (
        <div className="bg-white max-h-[90vh] overflow-y-auto px-8 md:px-14 py-10">
            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-lyvest-600 text-center leading-tight">
                Quem Somos
            </h2>

            {/* Subtitle */}
            <p className="text-center text-slate-400 text-sm mt-2 mb-8">
                Desde 2026
            </p>

            {/* Intro */}
            <p className="text-slate-700 leading-relaxed mb-10 text-justify">
                A <strong>Ly Vest</strong> nasceu do desejo de oferecer moda feminina com estilo, elegância e conforto.
                Acreditamos que vestir-se bem não precisa ser complicado — deve ser uma experiência prazerosa, acessível e confiante para cada mulher.
            </p>

            {/* Divider */}
            <div className="border-t border-lyvest-100 mb-10" />

            {/* Sections */}
            <div className="space-y-8">

                {/* História */}
                <div>
                    <h3 className="text-lg font-bold text-lyvest-600 mb-3">
                        Nossa História
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-justify">
                        Tudo começou com uma ideia simples: criar um espaço onde mulheres pudessem encontrar lingerie delicada, funcional e bonita, sem abrir mão da qualidade.
                        Fundada em Santos/SP, a Ly Vest cresceu a partir do boca a boca de clientes satisfeitas e do cuidado genuíno que colocamos em cada peça e em cada entrega.
                    </p>
                </div>

                {/* Missão */}
                <div>
                    <h3 className="text-lg font-bold text-lyvest-600 mb-3">
                        Nossa Missão
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-justify">
                        Trazer conforto e confiança para o dia a dia das mulheres através de lingerie delicada e de alta qualidade.
                        Queremos ser a parceira de cada cliente na valorização da sua beleza, oferecendo peças que encantam, abraçam e respeitam o corpo de cada uma.
                    </p>
                </div>

                {/* Valores */}
                <div>
                    <h3 className="text-lg font-bold text-lyvest-600 mb-3">
                        Nossos Valores
                    </h3>
                    <p className="text-slate-700 leading-relaxed mb-3 text-justify">
                        Tudo o que fazemos é guiado por princípios que colocamos a cliente no centro:
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-3 text-slate-700">
                            <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-lyvest-400 flex-shrink-0" />
                            <span><strong>Criatividade:</strong> design autoral e exclusivo em cada coleção.</span>
                        </li>
                        <li className="flex items-start gap-3 text-slate-700">
                            <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-lyvest-400 flex-shrink-0" />
                            <span><strong>Qualidade:</strong> materiais premium selecionados com cuidado.</span>
                        </li>
                        <li className="flex items-start gap-3 text-slate-700">
                            <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-lyvest-400 flex-shrink-0" />
                            <span><strong>Transparência:</strong> políticas claras e atendimento honesto.</span>
                        </li>
                        <li className="flex items-start gap-3 text-slate-700">
                            <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-lyvest-400 flex-shrink-0" />
                            <span><strong>Comunidade:</strong> crescer junto com nossas clientes, ouvindo e evoluindo.</span>
                        </li>
                    </ul>
                </div>

            </div>

            {/* Bottom spacing */}
            <div className="h-6" />
        </div>
    );
}
