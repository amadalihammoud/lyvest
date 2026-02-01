// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getProductGender } from '../utils/productUtils';

// Mock minimal Product interface to avoid importing ProductService (and its dependencies)
interface MockProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category?: any;
}

const createMockProduct = (overrides: Partial<MockProduct> = {}): any => ({
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    image: 'test.jpg',
    category: 'lingerie', // Default
    ...overrides
});

describe('productUtils', () => {
    describe('getProductGender', () => {
        it('should detect male gender from category "cueca"', () => {
            const product = createMockProduct({ category: 'cuecas' });
            expect(getProductGender(product)).toBe('male');
        });

        it('should detect male gender from category "masculino"', () => {
            const product = createMockProduct({ category: 'moda masculina' });
            expect(getProductGender(product)).toBe('male');
        });

        it('should detect male gender from category array slug', () => {
            const product = createMockProduct({
                category: [{ name: 'Cuecas', slug: 'cuecas-boxer' }]
            });
            expect(getProductGender(product)).toBe('male');
        });

        it('should detect male gender from product name', () => {
            const product = createMockProduct({
                name: 'Cueca Boxer Algodão',
                category: 'promoções' // categoria ambígua
            });
            expect(getProductGender(product)).toBe('male');
        });

        it('should return female for standard lingerie', () => {
            const product = createMockProduct({ category: 'sutiãs' });
            expect(getProductGender(product)).toBe('female');
        });

        it('should return female for ambiguous/unknown products by default', () => {
            const product = createMockProduct({ category: 'outros' });
            expect(getProductGender(product)).toBe('female');
        });
    });
});
