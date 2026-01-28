import React, { useState } from 'react';
import TestimonialCard from './TestimonialCard';
import { testimonials } from '../../data/mockData';
import { useI18n } from '../../hooks/useI18n';

export default function TestimonialsSection() {
    const { t } = useI18n();
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    return (
        <section className="py-20 bg-[#FDF5F5]">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-[31px] md:text-5xl font-cookie text-lyvest-500 mb-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ textShadow: "2px 2px 0px rgba(255,255,255,0.5)" }}
                    >
                        {t('testimonials.title')}
                    </h2>
                    <p className="text-slate-500 font-lato">{t('testimonials.subtitle')}</p>
                </div>

                <div
                    className="flex overflow-x-auto pt-8 pb-6 -mx-4 px-4 md:grid md:grid-cols-3 gap-6 md:gap-8 overscroll-x-contain scroll-smooth snap-x snap-mandatory md:pb-0 md:mx-0 md:px-0 scrollbar-hide"
                    onScroll={(e) => {
                        const scrollLeft = e.currentTarget.scrollLeft;
                        const width = e.currentTarget.offsetWidth;
                        const index = Math.round(scrollLeft / width);
                        setActiveTestimonial(index);
                    }}
                >
                    {testimonials.map((t) => (
                        <TestimonialCard key={t.id} data={t} />
                    ))}
                </div>

                {/* Dots Indicator (Mobile Only) */}
                <div className="flex md:hidden justify-center gap-2 mt-4">
                    {testimonials.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeTestimonial ? 'bg-lyvest-500 w-6' : 'bg-slate-300'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}








