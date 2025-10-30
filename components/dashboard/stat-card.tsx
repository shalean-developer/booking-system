'use client';

import { cn } from '@/lib/utils';

interface StatCardProps {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	value: number | string;
	delta?: string;
	className?: string;
}

export function StatCard({ icon: Icon, label, value, delta, className }: StatCardProps) {
    return (
        <div className={cn('relative rounded-xl border bg-white shadow-sm p-4 sm:p-5', className)}>
            <div className="absolute -top-3 -right-3 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/5" />
            {/* Header row on desktop; compact row on mobile */}
            <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{label}</p>
                </div>
            </div>
            <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold text-gray-900" aria-label={label}>{value}</div>
            {delta ? (
                <div className="mt-1 text-[11px] sm:text-xs text-gray-600">{delta}</div>
            ) : null}
        </div>
    );
}


