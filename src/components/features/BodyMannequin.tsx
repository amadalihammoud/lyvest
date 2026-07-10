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

// ---------------------------------------------------------------------------
// Silhueta paramétrica (SVG desenhado por código)
//
// Substitui as antigas imagens /assets/mannequins/*.png, que não existiam no
// repositório (imagem quebrada em produção) e eram estáticas — os valores de
// busto/cintura/quadril eram recebidos e ignorados. Agora a silhueta é gerada
// a partir das medidas reais, então o corpo reage aos sliders da cliente.
// ---------------------------------------------------------------------------

const VIEW_W = 300;
const VIEW_H = 550;
const CX = VIEW_W / 2;

// Alturas (y) alinhadas com as posições % das labels/linhas de fit (25% / 37% / 44%)
const Y = {
    headCy: 42,
    neck: 72,
    shoulder: 96,
    bust: VIEW_H * 0.25, // 137.5
    underbust: 168,
    waist: VIEW_H * 0.37, // 203.5
    hip: VIEW_H * 0.44, // 242
    crotch: 300,
    thigh: 360,
    crop: VIEW_H,
};

const SKIN_FILLS: Record<'light' | 'medium' | 'dark', string> = {
    light: '#EFD3BC',
    medium: '#C99C74',
    dark: '#8A5A3C',
};

function clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
}

// Converte circunferência (cm) em meia-largura (px) da silhueta.
function toHalfWidth(cm: number, minCm: number, maxCm: number, minPx: number, maxPx: number): number {
    const t = (clamp(cm, minCm, maxCm) - minCm) / (maxCm - minCm);
    return minPx + t * (maxPx - minPx);
}

// Catmull-Rom → curvas de Bézier cúbicas (contorno suave)
function smoothPath(pts: [number, number][]): string {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
}

interface BodyWidths {
    shoulder: number;
    bust: number;
    underbust: number;
    waist: number;
    hip: number;
    thigh: number;
}

function computeWidths(bustCm: number, waistCm: number, hipCm: number, gender: 'male' | 'female'): BodyWidths {
    const bust = toHalfWidth(bustCm, 70, 130, 36, 68);
    const waist = toHalfWidth(waistCm, 50, 110, 26, 60);
    const hip = toHalfWidth(hipCm, 80, 140, 40, 74);
    if (gender === 'male') {
        // Tronco masculino: ombros mais largos, menos indentação de cintura, quadril reto
        const maleHip = Math.min(hip, bust * 0.98);
        return {
            shoulder: Math.max(bust * 1.18, 52),
            bust,
            underbust: bust * 0.94,
            waist: Math.max(waist, bust * 0.82),
            hip: maleHip,
            thigh: maleHip * 0.9,
        };
    }
    return {
        shoulder: Math.max(bust * 1.04, 46),
        bust,
        underbust: bust * 0.82,
        waist,
        hip,
        thigh: hip * 0.88,
    };
}

function torsoPath(w: BodyWidths): string {
    const side = (s: 1 | -1): [number, number][] => [
        [CX + s * 13, Y.neck],
        [CX + s * w.shoulder * 0.88, Y.shoulder - 8],
        [CX + s * w.shoulder, Y.shoulder + 6],
        [CX + s * w.bust, Y.bust],
        [CX + s * w.underbust, Y.underbust],
        [CX + s * w.waist, Y.waist],
        [CX + s * w.hip, Y.hip],
        [CX + s * w.hip * 0.93, Y.crotch],
        [CX + s * w.thigh, Y.thigh],
        [CX + s * w.thigh * 0.72, Y.crop],
    ];
    const right = side(1);
    const left = side(-1).reverse();
    const rightPath = smoothPath(right);
    const leftPath = smoothPath(left);
    // conecta lado direito → esquerdo e fecha
    return `${rightPath} L${left[0][0].toFixed(1)} ${left[0][1].toFixed(1)} ${leftPath.slice(1)} Z`;
}

function armPath(w: BodyWidths, s: 1 | -1): string {
    return smoothPath([
        [CX + s * (w.shoulder - 4), Y.shoulder + 2],
        [CX + s * (w.bust + 13), Y.bust + 6],
        [CX + s * (w.waist + 21), Y.waist + 4],
        [CX + s * (w.hip + 9), Y.hip + 10],
    ]);
}

// Vinco entre as pernas para a silhueta não ler como "saia"
function legGapPath(): string {
    return `M${CX} ${Y.crotch + 12} C${CX - 3} ${Y.thigh + 20} ${CX - 4.5} ${Y.crop - 30} ${CX - 4.5} ${Y.crop} L${CX + 4.5} ${Y.crop} C${CX + 4.5} ${Y.crop - 30} ${CX + 3} ${Y.thigh + 20} ${CX} ${Y.crotch + 12} Z`;
}

export default function BodyMannequin({
    bust,
    waist,
    hips,
    viewMode = 'input',
    skinTone = 'medium',
    gender = 'female', // PADRÃO: feminino
    fitResult
}: BodyMannequinProps) {
    const widths = computeWidths(bust, waist, hips, gender);
    const fill = SKIN_FILLS[skinTone];

    // POSIÇÕES ANATÔMICAS (porcentagens da altura — alinhadas com o Y da silhueta)
    const anatomyPositions: Record<string, number> = gender === 'female' ? {
        bust: 25,      // Linha NA ALTURA DO BUSTO
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

            {/* Container da Silhueta Paramétrica */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <svg
                    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                    className="h-full w-auto"
                    style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.12))' }}
                    role="img"
                    aria-label="Silhueta do corpo baseada nas suas medidas"
                >
                    {/* braços (traço grosso atrás do tronco, mesma cor) */}
                    <path d={armPath(widths, 1)} fill="none" stroke={fill} strokeWidth={13} strokeLinecap="round" />
                    <path d={armPath(widths, -1)} fill="none" stroke={fill} strokeWidth={13} strokeLinecap="round" />
                    {/* tronco + pernas */}
                    <path d={torsoPath(widths)} fill={fill} />
                    {/* cabeça e pescoço */}
                    <circle cx={CX} cy={Y.headCy} r={24} fill={fill} />
                    <rect x={CX - 13} y={Y.headCy + 12} width={26} height={26} fill={fill} />
                    {/* vinco entre as pernas */}
                    <path d={legGapPath()} fill="rgba(255,255,255,0.55)" />
                    {/* degradê de recorte na base */}
                    <defs>
                        <linearGradient id="mannequinFade" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    <rect x={0} y={VIEW_H - 70} width={VIEW_W} height={70} fill="url(#mannequinFade)" />
                </svg>

                {/* Overlay das linhas de fit */}
                {viewMode === 'result' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative h-full" style={{ width: '400px' }}>
                            {gender === 'female' ? (
                                <>
                                    {renderFitLine(anatomyPositions.bust, fitResult?.bust, 'Busto')}
                                    {renderFitLine(anatomyPositions.waist, fitResult?.waist, 'Cintura')}
                                    {renderFitLine(anatomyPositions.hip, fitResult?.hips, 'Quadril')}
                                </>
                            ) : (
                                <>
                                    {renderFitLine(anatomyPositions.chest, fitResult?.bust, 'Peito')}
                                    {renderFitLine(anatomyPositions.waist, fitResult?.waist, 'Cintura')}
                                    {renderFitLine(anatomyPositions.hip, fitResult?.hips, 'Quadril')}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
