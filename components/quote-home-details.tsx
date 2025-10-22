"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HomeDetailsCardProps {
  bedrooms: number;
  setBedrooms: (bedrooms: number) => void;
  bathrooms: number;
  setBathrooms: (bathrooms: number) => void;
}

export function HomeDetailsCard({ bedrooms, setBedrooms, bathrooms, setBathrooms }: HomeDetailsCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">3. Home Details</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bedrooms" className="text-sm text-gray-600 mb-2 block">
                Bedrooms
              </Label>
              <Select value={bedrooms.toString()} onValueChange={(value) => setBedrooms(Number(value))}>
                <SelectTrigger id="bedrooms">
                  <SelectValue placeholder="Select bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i} {i === 1 ? 'Bedroom' : 'Bedrooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bathrooms" className="text-sm text-gray-600 mb-2 block">
                Bathrooms
              </Label>
              <Select value={bathrooms.toString()} onValueChange={(value) => setBathrooms(Number(value))}>
                <SelectTrigger id="bathrooms">
                  <SelectValue placeholder="Select bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i} {i === 1 ? 'Bathroom' : 'Bathrooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Bedrooms and bathrooms affect the base price.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
