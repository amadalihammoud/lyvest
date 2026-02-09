
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <h1 className="text-9xl font-black text-gray-200">404</h1>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">Página não encontrada</h2>
            <p className="text-gray-600 mt-2 max-w-md">
                Desculpe, a página que você está procurando não existe ou foi removida.
            </p>
            <Link
                href="/"
                className="mt-8 px-6 py-3 bg-lyvest-500 text-white rounded-full font-medium hover:bg-lyvest-600 transition-colors"
            >
                Voltar para o Início
            </Link>
        </div>
    );
}
