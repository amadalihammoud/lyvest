import React from 'react';
import { Link } from 'react-router-dom';


export default function EmptyState({ icon: Icon, title, message, actionLabel, actionLink }) {


    return (
        <div className="text-center py-16 px-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in group">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                {Icon && <Icon className="w-10 h-10 text-slate-300 group-hover:text-lyvest-500 transition-colors" />}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">{message}</p>
            {actionLabel && actionLink && (
                <Link
                    to={actionLink}
                    className="inline-flex items-center justify-center px-8 py-3 bg-lyvest-500 text-white font-bold rounded-full hover:bg-lyvest-600 shadow-lg shadow-[#F5E6E8] hover:shadow-xl hover:shadow-[#E8C4C8] transition-all transform hover:-translate-y-1"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}







