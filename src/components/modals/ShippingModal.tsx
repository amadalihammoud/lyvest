import { legalContent } from '../../data/legalData';

interface ShippingSection {
    title: string;
    content: string;
}

/**
 * Shipping policy modal with navigation index
 */
export default function ShippingModal(): React.ReactElement {
    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center gap-4 flex-shrink-0">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🚚</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{legalContent.shippingPolicy.title}</h2>
                    <p className="text-slate-500 text-sm">Informações sobre entregas e prazos.</p>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
                    {/* Left: Navigation (Sticky) */}
                    <div className="hidden lg:block w-1/4 h-fit sticky top-0">
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Navegação</h3>
                            <ul className="space-y-3">
                                {(legalContent.shippingPolicy.sections as ShippingSection[]).map((section, idx) => (
                                    <li key={idx}>
                                        <a href={`#section-${idx}`} className="text-sm text-slate-500 hover:text-sky-600 hover:translate-x-1 block transition-all">
                                            {section.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right: Content (Grid View - All Items) */}
                    <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(legalContent.shippingPolicy.sections as ShippingSection[]).map((section, idx) => (
                                <div key={idx} id={`section-${idx}`} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow scroll-mt-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-3 text-sky-700">
                                        {section.title}
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed text-sm text-justify">
                                        {section.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
