'use client';

import { cn } from '@/lib/utils';
import type { UpsellContent } from '@/lib/upsell-engine';

export type UpsellCardProps = {
  content: UpsellContent;
  onUpgrade: () => void;
  className?: string;
};

export function UpsellCard({ content, onUpgrade, className }: UpsellCardProps) {
  return (
    <div
      className={cn(
        'mt-4 rounded-xl border border-purple-200/80 bg-purple-50 p-4 shadow-sm',
        className
      )}
    >
      <h3 className="text-sm font-semibold text-gray-900 leading-snug">{content.title}</h3>
      {content.body ? (
        <p className="mt-1 text-xs text-gray-600 leading-snug">{content.body}</p>
      ) : null}
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-3 w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        {content.cta}
      </button>
    </div>
  );
}
