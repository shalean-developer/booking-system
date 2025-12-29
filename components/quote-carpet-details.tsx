"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

export interface CarpetDetails {
  hasFittedCarpets: boolean;
  hasLooseCarpets: boolean;
  numberOfRooms: number; // For fitted carpets
  numberOfLooseCarpets: number; // For loose carpets/rugs
  roomStatus: 'empty' | 'hasProperty';
}

interface QuoteCarpetDetailsProps {
  carpetDetails: CarpetDetails;
  setCarpetDetails: (details: CarpetDetails) => void;
}

export function QuoteCarpetDetails({ carpetDetails, setCarpetDetails }: QuoteCarpetDetailsProps) {
  const updateField = <K extends keyof CarpetDetails>(field: K, value: CarpetDetails[K]) => {
    const updated = { ...carpetDetails, [field]: value };
    
    // Reset counts when checkboxes are unchecked
    if (field === 'hasFittedCarpets' && value === false) {
      updated.numberOfRooms = 0;
    }
    if (field === 'hasLooseCarpets' && value === false) {
      updated.numberOfLooseCarpets = 0;
    }
    
    setCarpetDetails(updated);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[576px]"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">Carpet Cleaning Details</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-5">
          {/* Carpet types - Can have both */}
          <div>
            <Label className="text-sm text-gray-600 mb-3 block">
              What type of carpets do you have?
            </Label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasFittedCarpets"
                  checked={carpetDetails.hasFittedCarpets}
                  onCheckedChange={(checked) => updateField('hasFittedCarpets', checked === true)}
                />
                <Label htmlFor="hasFittedCarpets" className="text-sm font-normal cursor-pointer">
                  Fitted Carpets
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasLooseCarpets"
                  checked={carpetDetails.hasLooseCarpets}
                  onCheckedChange={(checked) => updateField('hasLooseCarpets', checked === true)}
                />
                <Label htmlFor="hasLooseCarpets" className="text-sm font-normal cursor-pointer">
                  Loose Carpets/Rugs
                </Label>
              </div>
            </div>
          </div>

          {/* Number of rooms with fitted carpets (only show if fitted carpets checked) */}
          {carpetDetails.hasFittedCarpets && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Label htmlFor="numberOfRooms" className="text-sm text-gray-600 mb-2 block">
                Number of Rooms with Fitted Carpets
              </Label>
              <Select 
                value={carpetDetails.numberOfRooms.toString()} 
                onValueChange={(value) => updateField('numberOfRooms', Number(value))}
              >
                <SelectTrigger id="numberOfRooms">
                  <SelectValue placeholder="Select number of rooms" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i} {i === 1 ? 'Room' : 'Rooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Number of loose carpets/rugs (only show if loose carpets checked) */}
          {carpetDetails.hasLooseCarpets && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Label htmlFor="numberOfLooseCarpets" className="text-sm text-gray-600 mb-2 block">
                Number of Loose Carpets/Rugs
              </Label>
              <Select 
                value={carpetDetails.numberOfLooseCarpets.toString()} 
                onValueChange={(value) => updateField('numberOfLooseCarpets', Number(value))}
              >
                <SelectTrigger id="numberOfLooseCarpets">
                  <SelectValue placeholder="Select number" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 21 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i} {i === 1 ? 'Carpet/Rug' : 'Carpets/Rugs'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Room status - Empty or has property */}
          <div>
            <Label className="text-sm text-gray-600 mb-3 block">
              Room Status
            </Label>
            <RadioGroup
              value={carpetDetails.roomStatus}
              onValueChange={(value) => updateField('roomStatus', value as 'empty' | 'hasProperty')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="empty" id="empty" />
                <Label htmlFor="empty" className="text-sm font-normal cursor-pointer">
                  Room is Empty
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hasProperty" id="hasProperty" />
                <Label htmlFor="hasProperty" className="text-sm font-normal cursor-pointer">
                  Has Property (Needs to be Moved)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

