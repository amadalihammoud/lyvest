import React from 'react';
import { useI18n } from '../hooks/useI18n';

/**
 * Barra de anúncio promocional no topo da página
 * Acessível para leitores de tela com role="status"
 */
const AnnouncementBar = () => {
    const { t } = useI18n();

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="bg-lyvest-500 text-white py-3 text-center shadow-md"
        >
            <p className="text-[13px] md:text-lg font-bold tracking-tight md:tracking-normal px-1 md:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                {t('announcement.freeShipping')}
            </p>
        </div>
    );
};

export default AnnouncementBar;







