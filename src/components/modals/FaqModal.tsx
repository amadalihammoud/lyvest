import { legalContent } from '../../data/legalData';
import { useI18n } from '../../hooks/useI18n';

interface FAQItem {
    question: string;
    answer: string;
}

/**
 * FAQ modal — document style with Q&A format
 */
export default function FaqModal(): React.ReactElement {
    const { t } = useI18n();

    return (
        <div className="bg-white max-h-[90vh] overflow-y-auto px-8 md:px-14 py-10">
            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-lyvest-600 text-center leading-tight">
                {t('modals.faq.title')}
            </h2>

            {/* Date */}
            <p className="text-center text-slate-400 text-sm mt-2 mb-8">
                Atualizado em Fevereiro de 2026
            </p>

            {/* Intro */}
            <p className="text-slate-700 leading-relaxed mb-10 text-justify">
                Reunimos as dúvidas mais frequentes dos nossos clientes para facilitar sua experiência de compra. Caso não encontre sua resposta aqui, entre em contato conosco pelo e-mail contato@lyvest.com.br.
            </p>

            {/* Divider */}
            <div className="border-t border-lyvest-100 mb-10" />

            {/* Q&A List */}
            <div className="space-y-8">
                {(legalContent.faq as FAQItem[]).map((item, idx) => (
                    <div key={idx}>
                        <h3 className="text-lg font-bold text-lyvest-600 mb-3">
                            {item.question}
                        </h3>
                        <p className="text-slate-700 leading-relaxed text-justify">
                            {item.answer}
                        </p>
                        {idx < legalContent.faq.length - 1 && (
                            <div className="border-t border-lyvest-50 mt-8" />
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom spacing */}
            <div className="h-6" />
        </div>
    );
}
