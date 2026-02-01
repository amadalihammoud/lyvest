import { Product } from '../services/ProductService';

/**
 * Detects the gender of a product based on its category and name.
 * Default is 'female'.
 */
export const getProductGender = (product: Product): 'male' | 'female' => {
    const cat = typeof product.category === 'string'
        ? product.category.toLowerCase()
        : Array.isArray(product.category)
            ? product.category[0]?.slug?.toLowerCase() || ''
            : '';

    const name = product.name?.toLowerCase() || '';

    // Detectar produtos masculinos
    if (cat.includes('masculin') || cat.includes('cueca') || cat.includes('male') ||
        name.includes('masculin') || name.includes('cueca') || name.includes('boxer')) {
        return 'male';
    }

    return 'female';
};
