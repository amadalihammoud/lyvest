import { useI18n } from '../../hooks/useI18n';

/**
 * Barra editorial de anúncio promocional no topo
 * Acessível para leitores de tela com role="status"
 */
const AnnouncementBar: React.FC = () => {
    const { t } = useI18n();

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="bg-primary text-primary-foreground py-2.5 text-center"
        >
            <p className="text-[11px] md:text-xs font-medium tracking-[0.2em] uppercase px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                {t('announcement.freeShipping')}
            </p>
        </div>
    );
};

export default AnnouncementBar;
