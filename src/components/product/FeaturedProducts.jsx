import React from 'react';
import ProductCard from './ProductCard';
import { products } from '../../data/products';

const FeaturedProducts = () => {
    const sectionStyle = {
        padding: 'var(--spacing-lg) 0',
        backgroundColor: 'var(--color-background)'
    };

    const containerStyle = {
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 2rem'
    };

    const headerStyle = {
        textAlign: 'center',
        marginBottom: 'var(--spacing-md)'
    };

    const titleStyle = {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: 'var(--color-text)',
        marginBottom: '1rem'
    };

    const subtitleStyle = {
        fontSize: '1.1rem',
        color: 'var(--color-text-light)',
        maxWidth: '600px',
        margin: '0 auto'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginTop: 'var(--spacing-md)'
    };

    return (
        <section style={sectionStyle}>
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <h2 style={titleStyle}>Our Favorites</h2>
                    <p style={subtitleStyle}>
                        Handpicked pieces that combine comfort, quality, and timeless style for your little ones.
                    </p>
                </div>
                <div style={gridStyle}>
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={(qty) => console.log('Add to cart:', product.name, qty)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;








