import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    message: string;
    actionLabel?: string;
    actionLink?: string;
}

export default function EmptyState({ icon: Icon, title, message, actionLabel, actionLink }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl shadow-sm border border-slate-100 animate-slide-up">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">{message}</p>
            {actionLabel && actionLink && (
                <Link
                    href={actionLink}
                    className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-lyvest-500 transition-all shadow-lg hover:shadow-[#E8C4C8] text-sm"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
