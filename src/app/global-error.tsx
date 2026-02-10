'use client';

import { useEffect } from 'react';
import { captureError } from '@/utils/sentry';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to Sentry
        captureError(error, { digest: error.digest });
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html lang="pt-BR">
            <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">⚠️</span>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900">Algo deu errado</h1>

                    <p className="text-slate-600">
                        Encontramos um erro inesperado. Nossa equipe técnica já foi notificada.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button
                            onClick={() => reset()}
                            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            Tentar novamente
                        </button>

                        <a
                            href="/"
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Voltar ao início
                        </a>
                    </div>
                </div>
            </body>
        </html>
    );
}
