/**
 * Componentes seguros para react-markdown no ChatWidget.
 *
 * Allowlist estreita: sem raw HTML, sem scripts, links só https/http,
 * imagens só https (ou path relativo da loja).
 */
import type { Components } from 'react-markdown';
import type { ReactNode, AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';

function isSafeHref(href: string | undefined): boolean {
    if (!href) return false;
    const t = href.trim().toLowerCase();
    return t.startsWith('https://') || t.startsWith('http://') || t.startsWith('/') || t.startsWith('#');
}

function isSafeImgSrc(src: string | undefined): boolean {
    if (!src) return false;
    const t = src.trim().toLowerCase();
    return t.startsWith('https://') || t.startsWith('/') || t.startsWith('data:image/');
}

export const safeMarkdownComponents: Components = {
    a: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode }) => {
        if (!isSafeHref(href)) {
            return <span>{children}</span>;
        }
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                {children}
            </a>
        );
    },
    img: ({ src, alt, ...rest }: ImgHTMLAttributes<HTMLImageElement>) => {
        if (!isSafeImgSrc(typeof src === 'string' ? src : undefined)) {
            return null;
        }
        return (
            <img
                src={src}
                alt={alt ?? ''}
                loading="lazy"
                className="max-w-full rounded-lg my-2"
                {...rest}
            />
        );
    },
    // Elementos de bloco/texto comuns — sem iframe, script, form, etc.
    p: ({ children }) => <p className="my-1">{children}</p>,
    strong: ({ children }) => <strong className="text-[#7D2121]">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
    li: ({ children }) => <li>{children}</li>,
    br: () => <br />,
    code: ({ children }) => (
        <code className="rounded bg-slate-100 px-1 text-xs">{children}</code>
    ),
};
