export type FitStatus = 'tight' | 'perfect' | 'loose' | undefined;

interface BodyMannequinProps {
    bust: number;
    waist: number;
    hips: number;
    viewMode?: 'input' | 'result';
    skinTone?: 'light' | 'medium' | 'dark';
    gender?: 'male' | 'female'; // NOVO: suporte a gênero
    fitResult?: {
        bust: FitStatus;
        waist: FitStatus;
        hips: FitStatus;
    };
}

export default function BodyMannequin({
    viewMode = 'input',
    skinTone = 'medium',
    gender = 'female', // PADRÃO: feminino
    fitResult
}: BodyMannequinProps) {

    // Mapeamento de imagens por gênero e tom de pele
    const mannequinImages = {
        female: {
            'light': '/assets/mannequins/light.png',
            'medium': '/assets/mannequins/medium.png',
            'dark': '/assets/mannequins/dark.png'
        },
        male: {
            'light': '/assets/mannequins/male/light.png',
            'medium': '/assets/mannequins/male/medium.png',
            'dark': '/assets/mannequins/male/dark.png'
        }
    };

    const currentImage = mannequinImages[gender][skinTone];

    // POSIÇÕES ANATÔMICAS (porcentagens da altura da imagem)
    // MESMAS posições para masculino e feminino (já calibradas!)
    const anatomyPositions = gender === 'female' ? {
        bust: 25,      // Linha NA ALTURA DOS MAMILOS
        waist: 37,     // Cintura NA ALTURA DO UMBIGO
        hip: 44        // Quadril NA ALTURA DA PELVE
    } : {
        chest: 25,     // Peito masculino (MESMA altura que busto feminino)
        waist: 37,     // Cintura masculina (MESMA altura)
        hip: 44        // Quadril masculino (MESMA altura)
    };

    // Renderiza uma linha horizontal de fit
    const renderFitLine = (
        position: number,  // posição em % da altura
        status?: FitStatus,
        label?: string
    ) => {
        if (!status || viewMode !== 'result') return null;

        const colors = {
            perfect: '#10b981',
            tight: '#f59e0b',
            loose: '#3b82f6'
        };

        const statusText = {
            perfect: 'Ideal',
            tight: 'Levemente justo',
            loose: 'Levemente largo'
        };

        const color = colors[status];

        return (
            <div
                key={`fit-${position}`}
                className="absolute w-full flex items-center justify-center"
                style={{ top: `${position}%` }}
            >
                {/* Linha horizontal */}
                <div className="relative w-[85%] flex items-center">
                    <div
                        className="w-full h-[3px] rounded-full"
                        style={{ backgroundColor: color, opacity: 0.9 }}
                    />

                    {/* Badge de status */}
                    <div
                        className="absolute -right-6 flex items-center gap-2"
                        style={{ transform: 'translateX(100%)' }}
                    >
                        {/* Círculo com ícone */}
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                            style={{ backgroundColor: color }}
                        >
                            {status === 'perfect' ? (
                                <svg
                                    className="w-4 h-4 text-white"
                                    viewBox="0 0 12 10"
                                    fill="none"
                                >
                                    <path
                                        d="M1 5L4.5 8.5L11 1.5"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <span className="text-white text-sm font-bold">!</span>
                            )}
                        </div>

                        {/* Texto de status */}
                        {label && (
                            <span
                                className="text-xs font-semibold whitespace-nowrap"
                                style={{ color: color }}
                            >
                                {statusText[status]}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full h-[550px] flex items-center justify-center bg-gradient-to-b from-slate-50/50 to-white">
            {/* Labels de Input */}
            {viewMode === 'input' && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    {gender === 'female' ? (
                        <>
                            {/* Busto feminino - à esquerda */}
                            <div className="absolute w-full flex items-center justify-start pl-4" style={{ top: '25%' }}>
                                <span className="bg-white/95 text-[10px] px-2.5 py-1 rounded-md text-slate-600 font-medium shadow-sm border border-slate-200">
                                    Busto
                                </span>
                                <div className="w-24 h-[1px] bg-slate-400 ml-2"></div>
                            </div>

                            {/* Cintura feminina - à esquerda */}
                            <div className="absolute w-full flex items-center justify-start pl-4" style={{ top: '37%' }}>
                                <span className="bg-white/95 text-[10px] px-2.5 py-1 rounded-md text-slate-600 font-medium shadow-sm border border-slate-200">
                                    Cintura
                                </span>
                                <div className="w-24 h-[1px] bg-slate-400 ml-2"></div>
                            </div>

                            {/* Quadril feminino - à esquerda */}
                            <div className="absolute w-full flex items-center justify-start pl-4" style={{ top: '44%' }}>
                                <span className="bg-white/95 text-[10px] px-2.5 py-1 rounded-md text-slate-600 font-medium shadow-sm border border-slate-200">
                                    Quadril
                                </span>
                                <div className="w-24 h-[1px] bg-slate-400 ml-2"></div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Peito masculino - à esquerda */}
                            <div className="absolute w-full flex items-center justify-start pl-4" style={{ top: '25%' }}>
                                <span className="bg-white/95 text-[10px] px-2.5 py-1 rounded-md text-slate-600 font-medium shadow-sm border border-slate-200">
                                    Peito
                                </span>
                                <div className="w-24 h-[1px] bg-slate-400 ml-2"></div>
                            </div>

                            {/* Cintura masculina - à esquerda */}
                            <div className="absolute w-full flex items-center justify-start pl-4" style={{ top: '37%' }}>
                                <span className="bg-white/95 text-[10px] px-2.5 py-1 rounded-md text-slate-600 font-medium shadow-sm border border-slate-200">
                                    Cintura
                                </span>
                                <div className="w-24 h-[1px] bg-slate-400 ml-2"></div>
                            </div>

                            {/* Quadril masculino - à esquerda */}
                            <div className="absolute w-full flex items-center justify-start pl-4" style={{ top: '44%' }}>
                                <span className="bg-white/95 text-[10px] px-2.5 py-1 rounded-md text-slate-600 font-medium shadow-sm border border-slate-200">
                                    Quadril
                                </span>
                                <div className="w-24 h-[1px] bg-slate-400 ml-2"></div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Container da Imagem do Manequim */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {/* Imagem do corpo - ESTICADA para preencher 100% */}
                <img
                    src={currentImage}
                    alt="Body mannequin"
                    className="h-full w-auto object-cover drop-shadow-2xl"
                    style={{
                        minWidth: '100%',
                        filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.12))'
                    }}
                />

                {/* Overlay das linhas de fit */}
                {viewMode === 'result' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative h-full" style={{ width: '400px' }}>
                            {gender === 'female' ? (
                                <>
                                    {renderFitLine((anatomyPositions as any).bust, fitResult?.bust, 'Busto')}
                                    {renderFitLine((anatomyPositions as any).waist, fitResult?.waist, 'Cintura')}
                                    {renderFitLine((anatomyPositions as any).hip, fitResult?.hips, 'Quadril')}
                                </>
                            ) : (
                                <>
                                    {renderFitLine((anatomyPositions as any).chest, fitResult?.bust, 'Peito')}
                                    {renderFitLine((anatomyPositions as any).waist, fitResult?.waist, 'Cintura')}
                                    {renderFitLine((anatomyPositions as any).hip, fitResult?.hips, 'Quadril')}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
