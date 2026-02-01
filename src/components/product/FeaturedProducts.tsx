import ProductCard from './ProductCard';
import { productsData } from '../../data/mockData';
import { useI18n } from '../../hooks/useI18n';
import { Product } from '../../services/ProductService';

const FeaturedProducts: React.FC = () => {
    const { t } = useI18n();

    const sectionStyle: React.CSSProperties = {
        padding: 'var(--spacing-lg) 0',
        backgroundColor: 'var(--color-background)'
    };

    const containerStyle: React.CSSProperties = {
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 2rem'
    };

    const headerStyle: React.CSSProperties = {
        textAlign: 'center',
        marginBottom: 'var(--spacing-md)'
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: 'var(--color-text)',
        marginBottom: '1rem'
    };

    const subtitleStyle: React.CSSProperties = {
        fontSize: '1.1rem',
        color: 'var(--color-text-light)',
        maxWidth: '600px',
        margin: '0 auto'
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginTop: 'var(--spacing-md)'
    };

    return (
        <section style={sectionStyle}>
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <h2 style={titleStyle}>{t('featured.title') || 'Nossos Favoritos'}</h2>
                    <p style={subtitleStyle}>
                        {t('featured.subtitle') || 'Peças escolhidas a dedo que combinam conforto, qualidade e estilo atemporal.'}
                    </p>
                </div>
                <div style={gridStyle}>
                    {(productsData as any[]).slice(0, 4).map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product as Product}
                            isFavorite={false}
                            onToggleFavorite={() => { }}
                            onAddToCart={(qty: number) => console.log('Add to cart:', product.name, qty)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;








