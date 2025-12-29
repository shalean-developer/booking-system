"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesCardProps {
  notes: string;
  setNotes: (notes: string) => void;
  isCarpetSelected?: boolean;
}

export function NotesCard({ notes, setNotes, isCarpetSelected = false }: NotesCardProps) {
  const stepNumber = isCarpetSelected ? '4' : '5';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="w-full max-w-[576px]"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">{stepNumber}. Additional Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div>
            <Label htmlFor="notes" className="text-sm text-gray-600 mb-2 block">
              Any special instructions or additional information you&apos;d like us to know
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any special instructions, preferences, or additional information..."
              className="min-h-[100px] resize-y"
              aria-label="Additional notes"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

