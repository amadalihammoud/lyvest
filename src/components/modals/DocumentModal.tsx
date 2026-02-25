import type { PolicyDocument } from '../../data/legalData';

interface DocumentModalProps {
    document: PolicyDocument;
}

/**
 * Shared document-style modal template for legal/policy pages.
 * Renders a centered article with title, date, intro, sections, bullets and optional table.
 */
export default function DocumentModal({ document }: DocumentModalProps): React.ReactElement {
    const { title, lastUpdated, intro, sections, table } = document;

    return (
        <div className="bg-white px-8 md:px-14 py-10">
            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-lyvest-600 text-center leading-tight">
                {title}
            </h2>

            {/* Date */}
            <p className="text-center text-slate-400 text-sm mt-2 mb-8">
                Atualizado em {lastUpdated}
            </p>

            {/* Intro */}
            <p className="text-slate-700 leading-relaxed mb-10 text-justify">
                {intro}
            </p>

            {/* Divider */}
            <div className="border-t border-lyvest-100 mb-10" />

            {/* Sections */}
            <div className="space-y-8">
                {sections.map((section, idx) => (
                    <div key={idx}>
                        <h3 className="text-lg font-bold text-lyvest-600 mb-3">
                            {section.title}
                        </h3>

                        <p className="text-slate-700 leading-relaxed text-justify">
                            {section.content}
                        </p>

                        {section.bullets && section.bullets.length > 0 && (
                            <ul className="mt-3 space-y-2">
                                {section.bullets.map((bullet, bIdx) => (
                                    <li key={bIdx} className="flex items-start gap-3 text-slate-700">
                                        <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-lyvest-400 flex-shrink-0" />
                                        <span className="leading-relaxed">{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>

            {/* Table (optional) */}
            {table && (
                <div className="mt-10 overflow-x-auto rounded-xl border border-lyvest-100">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-lyvest-500 text-white">
                                {table.headers.map((header, idx) => (
                                    <th key={idx} className="px-4 py-3 font-semibold">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {table.rows.map((row, rIdx) => (
                                <tr
                                    key={rIdx}
                                    className={rIdx % 2 === 0 ? 'bg-white' : 'bg-lyvest-50'}
                                >
                                    {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="px-4 py-3 text-slate-700 border-t border-lyvest-100">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bottom spacing */}
            <div className="h-6" />
        </div>
    );
}
