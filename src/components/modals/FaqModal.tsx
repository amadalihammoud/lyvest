import { useI18n } from '../../hooks/useI18n';
import { legalContent } from '../../data/legalData';

interface FAQItem {
    question: string;
    answer: string;
}

/**
 * FAQ modal displaying frequently asked questions
 */
export default function FaqModal(): React.ReactElement {
    const { t } = useI18n();

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center gap-4 flex-shrink-0">
                <div className="w-12 h-12 bg-lyvest-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🤔</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('modals.faq.title')}</h2>
                    <p className="text-slate-500 text-sm">Tire suas dúvidas sobre nossos produtos e serviços.</p>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(legalContent.faq as FAQItem[]).map((item, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-slate-800 mb-3 text-lyvest-600 flex gap-3">
                                    <span className="text-[#F5E6E8] font-black opacity-40 select-none">?</span>
                                    {item.question}
                                </h3>
                                <p className="text-slate-600 leading-relaxed text-sm text-justify">
                                    {item.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
