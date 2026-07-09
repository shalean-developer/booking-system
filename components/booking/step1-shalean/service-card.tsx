'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ServiceCardProps = {
  title: string;
  subtitle: string;
  bullets: string[];
  selected: boolean;
  onSelect: () => void;
  highlight?: boolean;
  badge?: string;
  icon?: ReactNode;
};

export function ServiceCard({
  title,
  subtitle,
  bullets,
  selected,
  onSelect,
  highlight,
  badge,
  icon,
}: ServiceCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition-shadow',
        selected
          ? 'border-violet-500 shadow-lg shadow-violet-500/20 ring-2 ring-violet-400/30'
          : 'border-gray-100 hover:border-violet-200 hover:shadow-md',
        highlight && selected && 'ring-2 ring-fuchsia-400/25',
      )}
    >
      {badge ? (
        <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {badge}
        </span>
      ) : null}
      {icon ? <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">{icon}</div> : null}
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-xl font-bold text-violet-700">{subtitle}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            {b}
          </li>
        ))}
      </ul>
    </motion.button>
  );
}
