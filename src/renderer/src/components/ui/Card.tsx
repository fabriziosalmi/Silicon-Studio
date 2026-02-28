import React from 'react';

export function Card({
    children,
    className = ""
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`bg-[#18181B] bg-opacity-70 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-2xl ${className}`}>
            {children}
        </div>
    );
}
