'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingInputProps {
  label: string;
  value: number;
  onChange: (rating: number) => void;
  required?: boolean;
}

export function StarRatingInput({ label, value, onChange, required = false }: StarRatingInputProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const displayRating = hoveredStar !== null ? hoveredStar : value;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded transition-transform hover:scale-110"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(null)}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-sm text-gray-600">
          {value > 0 ? `${value} star${value !== 1 ? 's' : ''}` : 'Not rated'}
        </span>
      </div>
    </div>
  );
}

