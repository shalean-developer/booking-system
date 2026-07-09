'use client';

import { Check, Loader2, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Cleaner as ApiCleaner } from '@/types/booking';

function formatZar(v: number) {
  return `R ${Math.round(v).toLocaleString('en-ZA')}`;
}

export function CleanerList({
  cleaners,
  loading,
  selectedCleanerId,
  fallbackPrice,
  onSelect,
}: {
  cleaners: ApiCleaner[];
  loading: boolean;
  selectedCleanerId: string;
  fallbackPrice: number;
  onSelect: (cleaner: ApiCleaner) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-600" />
        <p className="mt-2 text-sm text-gray-500">Loading available cleaners…</p>
      </div>
    );
  }

  if (!cleaners.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        No cleaners available for this location and time yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {cleaners.map((cleaner) => {
        const selected = selectedCleanerId === cleaner.id;
        return (
          <button
            key={cleaner.id}
            type="button"
            onClick={() => onSelect(cleaner)}
            className={cn(
              'rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md',
              selected ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-200' : 'border-gray-200 bg-white'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{cleaner.name}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {(cleaner.rating ?? 0).toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {cleaner.completed_jobs_count ?? 0} jobs
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-gray-700">{formatZar(fallbackPrice)}</p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
                  selected ? 'bg-violet-600 text-white' : 'border border-violet-200 text-violet-700'
                )}
              >
                {selected ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Selected
                  </>
                ) : (
                  'Select cleaner'
                )}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

