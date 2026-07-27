
'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';

const CheckoutPageClient = dynamic(
    () => import('@/components/pages/CheckoutPageClient'),
    { ssr: false }
);

function CheckoutSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 animate-pulse">
            <div className="h-10 w-1/3 bg-slate-100 rounded-lg mb-8"></div>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    <div className="h-32 bg-slate-100 rounded-xl"></div>
                    <div className="h-32 bg-slate-100 rounded-xl"></div>
                </div>
                <div className="w-full lg:w-96 h-64 bg-slate-100 rounded-xl"></div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    // O checkout é destino deliberado: o cliente clicou em "Finalizar compra" e
    // está esperando pagar. O useUltraLazyLoad daqui adiava o carregamento em
    // LCP + 5000ms (ou 2500ms de fallback) — estratégia desenhada para a janela
    // de medição do Lighthouse na home, onde ninguém está esperando nada.
    // Aplicado aqui, o cliente encarava um esqueleto pulsante por segundos no
    // ponto exato de conversão, sem indicador de progresso. Mesmo padrão de
    // montagem já usado em src/app/dashboard/page.tsx.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- guard de montagem client-only (evita mismatch de hidratação SSR)
        setMounted(true);
    }, []);

    if (!mounted) {
        return <CheckoutSkeleton />;
    }

    return (
        <Suspense fallback={<CheckoutSkeleton />}>
            <CheckoutPageClient />
        </Suspense>
    );
}
