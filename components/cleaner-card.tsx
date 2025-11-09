'use client';

import { motion } from 'framer-motion';
import { Star, User, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import type { Cleaner } from '@/types/booking';

interface CleanerCardProps {
  cleaner: Cleaner;
  onSelect: (cleanerId: string) => void;
  isSelected?: boolean;
  isLoading?: boolean;
  badgeLabel?: string;
  highlight?: string;
  tags?: string[];
}

export function CleanerCard({ cleaner, onSelect, isSelected, isLoading, badgeLabel, highlight }: CleanerCardProps) {
  const handleSelect = () => {
    if (!isLoading && !isSelected) {
      onSelect(cleaner.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`h-full transition-all duration-200 ${isSelected ? 'ring-4 ring-primary bg-primary/5' : 'hover:shadow-lg'}`}>
        <CardContent className="p-6">
          {/* Photo and Basic Info */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              {cleaner.photo_url ? (
                <Image
                  src={cleaner.photo_url}
                  alt={cleaner.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
              )}
              
              {/* Rating Badge */}
              <div className="absolute -top-1 -right-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full border border-yellow-200">
                {cleaner.rating}
              </div>
            </div>

            {/* Badge */}
            {badgeLabel && (
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                {badgeLabel}
              </div>
            )}

            {/* Name */}
            <div>
              <h3 className="font-semibold text-lg text-slate-900">{cleaner.name}</h3>

              {/* Rating Stars */}
              <div className="flex items-center justify-center space-x-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(cleaner.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
                <span className="text-sm text-slate-600 ml-1">({cleaner.rating})</span>
              </div>
            </div>

            {/* Experience */}
            {cleaner.years_experience && (
              <div className="flex items-center text-sm text-slate-600">
                <Award className="w-4 h-4 mr-1" />
                {cleaner.years_experience} years experience
              </div>
            )}

            {/* Bio */}
            {cleaner.bio && (
              <p className="text-sm text-slate-600 line-clamp-2">
                {cleaner.bio}
              </p>
            )}

            {/* Highlight */}
            {highlight && (
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {highlight}
              </div>
            )}

            {/* Select Button */}
            <Button
              onClick={handleSelect}
              disabled={isLoading || isSelected}
              className={`w-full ${isSelected ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Selecting...</span>
                </div>
              ) : isSelected ? (
                'Selected ✓'
              ) : (
                'Select'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
