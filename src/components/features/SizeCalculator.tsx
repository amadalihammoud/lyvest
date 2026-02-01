import React, { useState } from 'react';
import { Ruler, Weight, User } from 'lucide-react';
import { BodyMeasurements } from '../../services/sizeAI';

interface SizeCalculatorProps {
    onCalculate: (measurements: BodyMeasurements) => void;
    isLoading?: boolean;
    initialMeasurements?: BodyMeasurements | null;
}

export default function SizeCalculator({ onCalculate, isLoading, initialMeasurements }: SizeCalculatorProps) {
    const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

    const [measurements, setMeasurements] = useState<BodyMeasurements>(initialMeasurements || {
        height: 165,
        weight: 60,
        bustType: 'medium',
        hipType: 'medium',
        fitPreference: 'comfortable',
        exactBust: 90,
        exactWaist: 70,
        exactHips: 100
    });

    // Atualizar estado se initialMeasurements mudar
    React.useEffect(() => {
        if (initialMeasurements) {
            setMeasurements(prev => ({ ...prev, ...initialMeasurements }));
            // Se tiver medidas exatas salvas, ativar modo avançado
            if (initialMeasurements.exactBust) {
                setMode('advanced');
            }
        }
    }, [initialMeasurements]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Limpar dados irrelevantes baseado no modo
        const cleanMeasurements = { ...measurements };
        if (mode === 'simple') {
            delete cleanMeasurements.exactBust;
            delete cleanMeasurements.exactWaist;
            delete cleanMeasurements.exactHips;
        }
        onCalculate(cleanMeasurements);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Toggle Mode */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button
                    type="button"
                    onClick={() => setMode('simple')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'simple'
                        ? 'bg-white text-lyvest-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Modo Simples
                </button>
                <button
                    type="button"
                    onClick={() => setMode('advanced')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'advanced'
                        ? 'bg-white text-lyvest-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Fita Métrica (Mais Preciso)
                </button>
            </div>

            {mode === 'simple' ? (
                /* MODO SIMPLES: ALTURA/PESO */
                <>
                    {/* Altura */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <Ruler className="w-4 h-4" />
                            Altura: {measurements.height}cm
                        </label>
                        <input
                            type="range"
                            min="140"
                            max="200"
                            value={measurements.height}
                            onChange={(e) =>
                                setMeasurements({ ...measurements, height: parseInt(e.target.value) })
                            }
                            className="w-full h-2 bg-lyvest-100 rounded-lg appearance-none cursor-pointer accent-lyvest-600"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>140cm</span>
                            <span>200cm</span>
                        </div>
                    </div>

                    {/* Peso */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <Weight className="w-4 h-4" />
                            Peso: {measurements.weight}kg
                        </label>
                        <input
                            type="range"
                            min="40"
                            max="120"
                            value={measurements.weight}
                            onChange={(e) =>
                                setMeasurements({ ...measurements, weight: parseInt(e.target.value) })
                            }
                            className="w-full h-2 bg-lyvest-100 rounded-lg appearance-none cursor-pointer accent-lyvest-600"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>40kg</span>
                            <span>120kg</span>
                        </div>
                    </div>

                    {/* Tipo de Busto */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <User className="w-4 h-4" />
                            Tipo de Busto
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['small', 'medium', 'large'] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setMeasurements({ ...measurements, bustType: type })}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${measurements.bustType === type
                                        ? 'bg-lyvest-600 text-white border-lyvest-600'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-lyvest-400 hover:bg-lyvest-50'
                                        }`}
                                >
                                    {type === 'small' ? 'Pequeno' : type === 'medium' ? 'Médio' : 'Grande'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tipo de Quadril */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <User className="w-4 h-4" />
                            Tipo de Quadril
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['narrow', 'medium', 'wide'] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setMeasurements({ ...measurements, hipType: type })}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${measurements.hipType === type
                                        ? 'bg-lyvest-600 text-white border-lyvest-600'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-lyvest-400 hover:bg-lyvest-50'
                                        }`}
                                >
                                    {type === 'narrow' ? 'Estreito' : type === 'medium' ? 'Médio' : 'Largo'}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                /* MODO AVANÇADO: MEDIDAS EXATAS */
                <div className="space-y-5 animate-fade-in">
                    <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-4 flex gap-3">
                        <span className="text-xl">📏</span>
                        <p>
                            Use uma fita métrica para medir seu corpo. Não aperte a fita.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Busto (cm)
                        </label>
                        <input
                            type="number"
                            value={measurements.exactBust || ''}
                            onChange={(e) => setMeasurements({ ...measurements, exactBust: Number(e.target.value) })}
                            placeholder="Ex: 90"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-lyvest-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Cintura (cm)
                        </label>
                        <input
                            type="number"
                            value={measurements.exactWaist || ''}
                            onChange={(e) => setMeasurements({ ...measurements, exactWaist: Number(e.target.value) })}
                            placeholder="Ex: 70"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-lyvest-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Quadril (cm)
                        </label>
                        <input
                            type="number"
                            value={measurements.exactHips || ''}
                            onChange={(e) => setMeasurements({ ...measurements, exactHips: Number(e.target.value) })}
                            placeholder="Ex: 100"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-lyvest-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Preferência de Ajuste (Comum aos dois modos) */}
            <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Preferência de Ajuste
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {(['snug', 'comfortable'] as const).map((pref) => (
                        <button
                            key={pref}
                            type="button"
                            onClick={() => setMeasurements({ ...measurements, fitPreference: pref })}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors border-2 ${measurements.fitPreference === pref
                                ? 'bg-lyvest-600 text-white border-lyvest-600'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-lyvest-400 hover:bg-lyvest-50'
                                }`}
                        >
                            <div className="font-semibold">
                                {pref === 'snug' ? 'Mais Justo' : 'Confortável'}
                            </div>
                            <div className="text-xs opacity-80 mt-1">
                                {pref === 'snug' ? 'Efeito modelador' : 'Mais solto'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Botão Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-lyvest-600 text-white py-4 rounded-xl font-semibold hover:bg-lyvest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Calculando...
                    </span>
                ) : (
                    'Calcular Meu Tamanho'
                )}
            </button>

            <p className="text-xs text-slate-500 text-center">
                💡 Nossa IA analisa suas medidas para recomendar o tamanho perfeito
            </p>
        </form>
    );
}
