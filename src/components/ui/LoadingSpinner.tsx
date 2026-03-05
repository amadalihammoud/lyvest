import React from 'react';

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-lyvest-100 border-t-[#7D2121] rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Carregando...</p>
        </div>
    </div>
);

export default LoadingSpinner;
