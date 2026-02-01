import React, { useState } from 'react';
import { Ruler, Weight, User } from 'lucide-react';
import { BodyMeasurements } from '../../services/sizeAI';

interface SizeCalculatorProps {
    onCalculate: (measurements: BodyMeasurements) => void;
    isLoading?: boolean;
}

export default function SizeCalculator({ onCalculate, isLoading }: SizeCalculatorProps) {
    const [measurements, setMeasurements] = useState<BodyMeasurements>({
        height: 165,
        weight: 60,
        bustType: 'medium',
        hipType: 'medium',
        fitPreference: 'comfortable',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCalculate(measurements);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Preferência de Ajuste */}
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
