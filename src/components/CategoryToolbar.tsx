import { useState } from 'react';
import { ArrowUpDown, ChevronDown, Check, Filter } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import Breadcrumbs from './Breadcrumbs';

interface CategoryToolbarProps {
    categoryTitle: string;
    sortOption: string;
    onSortChange: (option: string) => void;
    onOpenFilters: () => void;
}

export default function CategoryToolbar({
    categoryTitle,
    sortOption,
    onSortChange,
    onOpenFilters
}: CategoryToolbarProps) {
    const { t } = useI18n();
    const [isSortOpen, setIsSortOpen] = useState(false);

    const sortOptions = [
        { id: 'relevance', label: t('sort.relevance') || 'Relevância' },
        { id: 'price-asc', label: t('sort.priceLowHigh') || 'Menor Preço' },
        { id: 'price-desc', label: t('sort.priceHighLow') || 'Maior Preço' },
        { id: 'name-asc', label: t('sort.nameAZ') || 'Nome (A-Z)' },
    ];

    return (
        <div id="category-toolbar" className="bg-white border-b border-slate-100 sticky top-[72px] xl:top-[80px] z-30 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 py-3">
                {/* Flex: mobile pode quebrar, desktop fica na mesma linha */}
                <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">

                    {/* Breadcrumbs (Left) - full width on mobile, auto on desktop */}
                    <div className="min-w-0 flex-shrink-0 w-full xs:w-auto lg:flex-1">
                        <Breadcrumbs items={[{ label: categoryTitle }]} />
                    </div>

                    {/* Controles de Ordenação (Right) - stays on same line on desktop */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full xs:w-auto lg:w-auto justify-between xs:justify-end">
                        <button
                            onClick={onOpenFilters}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition-colors border border-slate-200 lg:hidden"
                        >
                            <Filter className="w-4 h-4 text-slate-500" />
                            <span>Filtros</span>
                        </button>

                        {/* Ordenação */}
                        <div className="relative group">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition-colors border border-slate-200"
                            >
                                <ArrowUpDown className="w-4 h-4 text-slate-500" />
                                <span className="hidden sm:inline">{t('common.sortBy') || 'Ordenar'}: </span>
                                <span className="text-lyvest-600 truncate max-w-[80px] sm:max-w-[100px]">
                                    {sortOptions.find(o => o.id === sortOption)?.label}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>

                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setIsSortOpen(false)} role="button" tabIndex={0} aria-label="Fechar ordenação"></div>
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-down">
                                        {sortOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => { onSortChange(option.id); setIsSortOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-lyvest-100/30 transition-colors flex items-center justify-between group/item
                                                    ${sortOption === option.id ? 'text-lyvest-600 font-medium bg-lyvest-100/30/50' : 'text-slate-600'}
                                                `}
                                            >
                                                {option.label}
                                                {sortOption === option.id && <Check className="w-4 h-4 text-lyvest-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}







