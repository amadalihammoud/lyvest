import { useRouter } from 'next/navigation';

import { useModal } from '../store/useModalStore';
import { useShop } from '../store/useShopStore';
import { generateSlug } from '../utils/slug';

export interface NavMenuItem {
    action?: string;
    category?: string;
    categorySlug?: string;
    label?: string;
    modal?: string;
}

export const useShopNavigation = () => {
    const router = useRouter();
    const { setSelectedCategory, setSearchQuery } = useShop();
    const { openModal } = useModal();

    const handleMenuClick = (item: NavMenuItem) => {
        if (item.action === 'reset') {
            setSelectedCategory('Todos');
            setSearchQuery('');
            router.push('/');
        } else if (item.action === 'filter') {
            setSelectedCategory(item.category || item.label || '');
            // Prefere o slug real da categoria (vindo do banco) — só re-deriva
            // do nome/label como fallback para itens que ainda não tenham slug.
            const slug = item.categorySlug || generateSlug(item.category || item.label || '');
            router.push(`/categoria/${slug}`);
        } else if (item.action === 'modal') {
            if (item.modal) openModal(item.modal);
        }
    };

    return { handleMenuClick };
};
