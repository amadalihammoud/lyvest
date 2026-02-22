import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    link?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

/**
 * Componente de navegação breadcrumb
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps): React.ReactElement {
    return (
        <nav aria-label="Breadcrumb" className="animate-fade-in">
            <ol className="flex items-center gap-2 text-sm text-slate-500">
                <li>
                    <Link
                        href="/"
                        className="flex items-center gap-1 hover:text-lyvest-500 transition-colors"
                        title="Página Inicial"
                    >
                        <Home className="w-4 h-4" />
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        {item.link ? (
                            <Link
                                href={item.link}
                                className="hover:text-lyvest-500 transition-colors font-medium"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="font-bold text-slate-800" aria-current="page">
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
