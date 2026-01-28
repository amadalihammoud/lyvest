

interface ProductTabsProps {
    activeTab: 'description' | 'specs';
    setActiveTab: (tab: 'description' | 'specs') => void;
    productDescription: string;
    productSpecs?: Record<string, string | number | undefined>;
    ean?: string;
    t: (key: string) => string;
}

export function ProductTabs({ activeTab, setActiveTab, productDescription, productSpecs, ean, t }: ProductTabsProps) {
    return (
        <div className="mt-20">
            {/* Mobile: Tabs Navigation */}
            <div className="lg:hidden mb-6">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('description')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider transition-colors ${activeTab === 'description'
                            ? 'text-lyvest-600 border-b-2 border-lyvest-600'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {'Descrição'}
                    </button>
                    <button
                        onClick={() => setActiveTab('specs')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider transition-colors ${activeTab === 'specs'
                            ? 'text-lyvest-600 border-b-2 border-lyvest-600'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {'Especificações'}
                    </button>
                </div>

                {/* Mobile: Tab Content */}
                <div className="mt-6 animate-fade-in">
                    {activeTab === 'description' && (
                        <div className="space-y-4 text-slate-600 leading-relaxed">
                            <p>{productDescription}</p>
                            <p>{t('products.productDeveloped') || 'Este produto foi desenvolvido pensando no seu conforto íntimo, trazendo tecidos respiráveis e modelagens que valorizam o corpo sem apertar.'}</p>
                            <p>{t('products.idealGift') || 'Ideal para renovar sua gaveta ou presentear alguém especial com a qualidade Ly Vest.'}</p>
                        </div>
                    )}
                    {activeTab === 'specs' && productSpecs && (
                        <ul className="space-y-4">
                            {Object.entries(productSpecs).map(([key, value]) => (
                                <li key={key} className="flex justify-between border-b border-slate-200 pb-3 last:border-0">
                                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">{key}</span>
                                    <span className="font-medium text-slate-800 text-right">{value}</span>
                                </li>
                            ))}
                            {ean && (
                                <li className="flex justify-between border-b border-slate-200 pb-3 last:border-0">
                                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">EAN</span>
                                    <span className="font-mono text-slate-800 text-right">{ean}</span>
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {/* Desktop: Unified Card with Two Columns */}
            <div className="hidden lg:block">
                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="flex">
                        {/* LEFT: Description (White Background) */}
                        <div className="flex-1 p-10 bg-white">
                            <h3 className="text-xl font-bold text-lyvest-600 mb-6">
                                {t('products.aboutProduct') || 'Sobre o Produto'}
                            </h3>
                            <div className="space-y-4 text-slate-600 leading-relaxed">
                                <p>{productDescription}</p>
                                <p>{t('products.productDeveloped') || 'Este produto foi desenvolvido pensando no seu conforto íntimo, trazendo tecidos respiráveis e modelagens que valorizam o corpo sem apertar.'}</p>
                                <p>{t('products.idealGift') || 'Ideal para renovar sua gaveta ou presentear alguém especial com a qualidade Ly Vest.'}</p>
                            </div>
                        </div>

                        {/* RIGHT: Specs (Light Gray Background) */}
                        {productSpecs && (
                            <div className="flex-1 p-10 bg-slate-50">
                                <h3 className="text-xl font-bold text-lyvest-600 mb-6">
                                    {t('products.specs') || 'Especificações Técnicas'}
                                </h3>
                                <table className="w-full text-left border-collapse">
                                    <tbody>
                                        {Object.entries(productSpecs).map(([key, value]) => (
                                            <tr key={key} className="border-b border-slate-200">
                                                <th className="py-3 font-bold text-slate-500 uppercase text-xs tracking-wider w-1/3 align-middle">{key}</th>
                                                <td className="py-3 font-medium text-slate-800 text-right align-middle">{value}</td>
                                            </tr>
                                        ))}
                                        {ean && (
                                            <tr className="border-b border-slate-200 last:border-0">
                                                <th className="py-3 font-bold text-slate-500 uppercase text-xs tracking-wider w-1/3 align-middle">EAN</th>
                                                <td className="py-3 font-mono text-slate-800 text-right align-middle">{ean}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
