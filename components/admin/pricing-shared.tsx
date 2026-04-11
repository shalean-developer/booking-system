'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export const formatZAR = (n: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(n);

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const SectionHeader = ({
  icon,
  title,
  subtitle,
  action,
  expanded,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) => (
  <div className="flex cursor-pointer select-none items-center gap-4 px-5 py-4" onClick={onToggle}>
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <h2 className="text-sm font-extrabold text-gray-900">{title}</h2>
      <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
    </div>
    <div className="flex flex-shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {action}
      <button
        type="button"
        onClick={onToggle}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200"
        aria-label={expanded ? 'Collapse' : 'Expand'}
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

export const PriceInput = ({
  value,
  onChange,
  prefix = 'R',
  min = 0,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  min?: number;
  className?: string;
}) => (
  <div
    className={cn(
      'flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100',
      className
    )}
  >
    <span className="text-xs font-bold text-gray-400">{prefix}</span>
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 bg-transparent text-sm font-bold text-gray-900 outline-none"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

export const InlineToast = ({
  toast,
  onDone,
}: {
  toast: ToastState;
  onDone: () => void;
}) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.94 }}
      className={cn(
        'fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-2xl',
        toast.type === 'success' ? 'bg-gray-900' : 'bg-red-600'
      )}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-white" />
      )}
      <span>{toast.message}</span>
    </motion.div>
  );
};
