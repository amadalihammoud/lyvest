import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useModal } from '../context/ModalContext';
import { generateSlug } from '../utils/slug';

export const useShopNavigation = () => {
    const navigate = useNavigate();
    const { setSelectedCategory, setSearchQuery } = useShop();
    const { openModal } = useModal();

    const handleMenuClick = (item: any) => {
        if (item.action === 'reset') {
            setSelectedCategory('Todos');
            setSearchQuery('');
            navigate('/');
        } else if (item.action === 'filter') {
            setSelectedCategory(item.category || item.label);
            const slug = generateSlug(item.category || item.label);
            navigate(`/categoria/${slug}`);
        } else if (item.action === 'modal') {
            openModal(item.modal);
        }
    };

    return { handleMenuClick };
};
