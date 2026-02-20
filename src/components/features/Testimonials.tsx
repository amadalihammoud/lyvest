'use client';
import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { Quote, Star } from 'lucide-react';

interface TestimonialItem {
    id: number;
    name: string;
    role: string;
    content: string;
    rating: number;
}

const Testimonials = () => {
    const { t } = useI18n();
    // Mock user for "Ana Silva" matches the screenshot provided by user usually
    const testimonials: TestimonialItem[] = [
        {
            id: 1,
            name: "Mariana Silva",
            role: "Cliente Verificada",
            content: "As lingeries são maravilhosas, o tecido abraça o corpo e não marca absolutamente nada nas roupas. Já virei fã e recomendo para todas as amigas!",
            rating: 5,
        },
        {
            id: 2,
            name: "Juliana Costa",
            role: "Cliente Verificada",
            content: "Simplesmente apaixonada pelo conforto dos pijamas! Chegou super rápido e a embalagem é um capricho, dá para ver o carinho da Ly Vest em cada detalhe.",
            rating: 5,
        },
        {
            id: 3,
            name: "Carolina Mendes",
            role: "Cliente Verificada",
            content: "Como médica, valorizo muito roupas de qualidade. Ly Vest superou minhas expectativas!",
            rating: 5
        }
    ];

    return (
        <section className="py-16 bg-[#F5E6E8]">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 animate-fade-in">
                    <h2 className="text-3xl md:text-4xl font-cookie text-lyvest-500 mb-4">
                        {t('home.testimonials.title')}
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        {t('home.testimonials.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <div
                            key={item.id}
                            className={`bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative animate-fade-in`}
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <Quote className="absolute top-6 right-6 w-8 h-8 text-slate-100" />
                            <div className="flex gap-1 text-yellow-400 mb-4">
                                {[...Array(item.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-current" />
                                ))}
                            </div>
                            <p className="text-slate-600 mb-6 italic relative z-10 leading-relaxed">
                                "{item.content}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div>
                                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                                    <p className="text-sm text-slate-500">{item.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
