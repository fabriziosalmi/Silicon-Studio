import React from 'react';

export function PageHeader({
    title,
    description,
    children,
    badge
}: {
    title: string;
    description?: string;
    children?: React.ReactNode;
    badge?: string;
}) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/5 pb-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-baseline gap-3">
                    {title}
                    {badge && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-bold tracking-widest uppercase relative -top-1">
                            {badge}
                        </span>
                    )}
                </h1>
                {description && <p className="text-gray-400 mt-1">{description}</p>}
            </div>
            {children && (
                <div className="flex gap-3 w-full md:w-auto">
                    {children}
                </div>
            )}
        </div>
    );
}
