

import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import SEO from '../components/features/SEOComponent';
import { useI18n } from '../hooks/useI18n';

export default function NotFoundPage() {
    const { t } = useI18n();

    return (
        <>
            <SEO
                title={t('notFound.title')}
                description={t('notFound.description')}
            />
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    {/* IlustraÃ§Ã£o 404 */}
                    <div className="mb-8">
                        <div className="relative inline-block">
                            <div className="text-[120px] font-bold bg-gradient-to-r from-[#C05060] to-sky-400 bg-clip-text text-transparent leading-none">
                                404
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-lyvest-100 rounded-full animate-bounce" />
                            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-sky-200 rounded-full animate-bounce animation-delay-2000" />
                        </div>
                    </div>

                    {/* Mensagem */}
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">
                        Oops! {t('notFound.title')}
                    </h1>
                    <p className="text-slate-500 mb-8">
                        {t('notFound.description')}
                    </p>

                    {/* AÃ§Ãµes */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white font-bold rounded-full hover:bg-lyvest-500 transition-colors shadow-lg"
                        >
                            <Home className="w-5 h-5" />
                            {t('notFound.goHome')}
                        </Link>
                        <Link
                            to="/?busca="
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-medium rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                            <Search className="w-5 h-5" />
                            {t('common.search')}
                        </Link>
                    </div>

                    {/* Link para voltar */}
                    <button
                        onClick={() => window.history.back()}
                        className="mt-8 inline-flex items-center gap-2 text-slate-400 hover:text-lyvest-500 transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('notFound.goBack')}
                    </button>
                </div>
            </div>
        </>
    );
}








