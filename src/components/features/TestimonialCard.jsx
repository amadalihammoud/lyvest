import React from 'react';

const TestimonialCard = ({ data }) => {
    return (
        <div className="min-w-[300px] md:min-w-0 snap-center bg-stone-50 p-8 rounded-3xl relative mr-4 md:mr-0">
            <div className="absolute -top-6 left-8 bg-lyvest-500 text-white w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold shadow-lg shadow-[#F5E6E8]">
                "
            </div>
            <p className="text-slate-600 italic mb-6 pt-4 leading-relaxed">"{data.text}"</p>
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-lyvest-100 rounded-full flex items-center justify-center text-lyvest-500 font-bold text-sm">
                    {data.avatar}
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{data.name}</h4>
                    <span className="text-xs text-slate-400">{data.role}</span>
                </div>
            </div>
        </div>
    );
}

export default React.memo(TestimonialCard);







