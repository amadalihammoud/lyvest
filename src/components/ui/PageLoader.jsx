import React from 'react';
import { useI18n } from '../../context/I18nContext';

const PageLoader = () => {
    const { t } = useI18n();
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-lyvest-100 border-t-[#800020] rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">{t('common.loading') || 'Carregando...'}</p>
            </div>
        </div>
    );
};

export default PageLoader;








