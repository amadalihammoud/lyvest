import React from 'react';

export default function LoadingFallback() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md px-6">
                {/* Animated Logo Spinner */}
                <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-lyvest-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-lyvest-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-lyvest-500">LV</span>
                    </div>
                </div>

                {/* Loading Text */}
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-slate-700">Carregando...</h2>
                    <p className="text-sm text-slate-500">Preparando sua experiência premium</p>
                </div>

                {/* Skeleton Loading Bars */}
                <div className="space-y-2">
                    <div className="h-2 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full animate-pulse"></div>
                    <div className="h-2 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full animate-pulse delay-75 w-3/4 mx-auto"></div>
                    <div className="h-2 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full animate-pulse delay-150 w-1/2 mx-auto"></div>
                </div>
            </div>
        </div>
    );
}
