import { useRouter } from 'next/navigation';

import { useModal } from '../store/useModalStore';
import { useShop } from '../store/useShopStore';
import { generateSlug } from '../utils/slug';

export const useShopNavigation = () => {
    const router = useRouter();
    const { setSelectedCategory, setSearchQuery } = useShop();
    const { openModal } = useModal();

    const handleMenuClick = (item: any) => {
        if (item.action === 'reset') {
            setSelectedCategory('Todos');
            setSearchQuery('');
            router.push('/');
        } else if (item.action === 'filter') {
            setSelectedCategory(item.category || item.label);
            const slug = generateSlug(item.category || item.label);
            router.push(`/categoria/${slug}`);
        } else if (item.action === 'modal') {
            openModal(item.modal);
        }
    };

    return { handleMenuClick };
};
