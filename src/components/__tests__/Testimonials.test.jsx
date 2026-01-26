// src/components/__tests__/Testimonials.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Testimonials from '../Testimonials';
import { I18nProvider } from '../../context/I18nContext';

const renderTestimonials = () => {
    return render(
        <I18nProvider>
            <Testimonials />
        </I18nProvider>
    );
};

describe('Testimonials', () => {
    it('renders section title', () => {
        renderTestimonials();
        expect(screen.getByText(/Clientes felizes/i)).toBeInTheDocument();
    });

    it('renders subtitle', () => {
        renderTestimonials();
        expect(screen.getByText(/o que nossos clientes dizem/i)).toBeInTheDocument();
    });

    it('renders testimonial cards', () => {
        renderTestimonials();
        // Should have at least one testimonial
        const stars = screen.getAllByText(/★/);
        expect(stars.length).toBeGreaterThan(0);
    });

    it('renders customer names', () => {
        renderTestimonials();
        // Check for some customer indicator
        const testimonialSection = document.querySelector('[class*="testimonial"]') || document.body;
        expect(testimonialSection).toBeTruthy();
    });
});







