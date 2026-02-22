import { User, Ruler, Weight } from 'lucide-react';

import { ReferenceModel } from '../../data/sizeGuide';
import OptimizedProductImage from '../ui/OptimizedProductImage';

interface ModelGalleryProps {
    models: ReferenceModel[];
    productId?: number | string;
}

export default function ModelGallery({ models, productId }: ModelGalleryProps) {
    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Modelos com Corpo Similar ao Seu
                </h3>
                <p className="text-sm text-slate-600">
                    Veja como este produto ficou em pessoas com medidas parecidas
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {models.map((model) => {
                    // Encontrar produto usado por este modelo (comparação robusta string/number)
                    const productUsed = model.products.find((p) => String(p.productId) === String(productId));

                    return (
                        <div
                            key={model.id}
                            className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-lyvest-300 transition-colors"
                        >
                            {/* Foto do Modelo */}
                            <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 relative">
                                <OptimizedProductImage
                                    src={model.photo}
                                    alt={model.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                    fallbackText={model.name}
                                />

                                {/* Badge de Tamanho */}
                                {productUsed && (
                                    <div className="absolute top-3 right-3 bg-lyvest-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                        Tamanho {productUsed.size}
                                    </div>
                                )}
                            </div>

                            {/* Informações */}
                            <div className="p-4 space-y-3">
                                <div className="text-center">
                                    <div className="font-semibold text-slate-900 mb-1">{model.name}</div>
                                </div>

                                {/* Medidas */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Ruler className="w-3.5 h-3.5" />
                                        <span>{model.height}cm</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Weight className="w-3.5 h-3.5" />
                                        <span>{model.weight}kg</span>
                                    </div>
                                </div>

                                {/* Tipo de Corpo */}
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                    <User className="w-3.5 h-3.5" />
                                    <span>
                                        {model.gender === 'male' ? 'Peito' : 'Busto'} {translateType(model.bustType)} • Quadril{' '}
                                        {translateType(model.hipType)}
                                    </span>
                                </div>

                                {/* Depoimento */}
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <p className="text-xs text-slate-700 italic leading-relaxed">
                                        "{model.testimonial}"
                                    </p>
                                </div>

                                {/* Ajuste */}
                                {productUsed && (
                                    <div className="text-center">
                                        <span className="inline-flex items-center gap-1 text-xs text-lyvest-700 bg-lyvest-50 px-2 py-1 rounded-full">
                                            Ajuste: {productUsed.fit === 'snug' ? 'Justo' : 'Confortável'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {models.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum modelo disponível para comparação</p>
                </div>
            )}
        </div>
    );
}

function translateType(type: string): string {
    const map: Record<string, string> = {
        small: 'pequeno',
        medium: 'médio',
        large: 'grande',
        narrow: 'estreito',
        wide: 'largo',
    };
    return map[type] || type;
}
