"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { CarpetDetails } from '@/components/quote-carpet-details';

interface HomeDetailsCardProps {
  bedrooms: number;
  setBedrooms: (bedrooms: number) => void;
  bathrooms: number;
  setBathrooms: (bathrooms: number) => void;
  isCarpetSelected?: boolean;
  carpetDetails?: CarpetDetails;
  setCarpetDetails?: (details: CarpetDetails) => void;
}

export function HomeDetailsCard({ 
  bedrooms, 
  setBedrooms, 
  bathrooms, 
  setBathrooms,
  isCarpetSelected = false,
  carpetDetails,
  setCarpetDetails
}: HomeDetailsCardProps) {
  const updateCarpetField = <K extends keyof CarpetDetails>(field: K, value: CarpetDetails[K]) => {
    if (!carpetDetails || !setCarpetDetails) return;
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
      transition={{ duration: 0.3, delay: 0.2 }}
      className="w-full max-w-[576px]"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">3. Home Details</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-5">
          {/* Hide bedrooms/bathrooms when Carpet service is selected */}
          {!isCarpetSelected && (
            <>
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
              <p className="text-xs text-gray-500">Bedrooms and bathrooms affect the base price.</p>
            </>
          )}

          {/* Carpet Details Section - Only show when Carpet service is selected */}
          {isCarpetSelected && carpetDetails && setCarpetDetails && (
            <div className="border-t border-gray-200 pt-5 mt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Carpet Information</h3>
              
              {/* Carpet types */}
              <div className="mb-5">
                <Label className="text-sm text-gray-600 mb-3 block">
                  What type of carpets do you have?
                </Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="home-hasFittedCarpets"
                      checked={carpetDetails.hasFittedCarpets}
                      onCheckedChange={(checked) => updateCarpetField('hasFittedCarpets', checked === true)}
                    />
                    <Label htmlFor="home-hasFittedCarpets" className="text-sm font-normal cursor-pointer">
                      Fitted Carpets
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="home-hasLooseCarpets"
                      checked={carpetDetails.hasLooseCarpets}
                      onCheckedChange={(checked) => updateCarpetField('hasLooseCarpets', checked === true)}
                    />
                    <Label htmlFor="home-hasLooseCarpets" className="text-sm font-normal cursor-pointer">
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
                  transition={{ duration: 0.2 }}
                  className="mb-5"
                >
                  <Label htmlFor="home-numberOfRooms" className="text-sm text-gray-600 mb-2 block">
                    How many rooms have fitted carpets?
                  </Label>
                  <Select 
                    value={carpetDetails.numberOfRooms.toString()} 
                    onValueChange={(value) => updateCarpetField('numberOfRooms', Number(value))}
                  >
                    <SelectTrigger id="home-numberOfRooms">
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
                  transition={{ duration: 0.2 }}
                  className="mb-5"
                >
                  <Label htmlFor="home-numberOfLooseCarpets" className="text-sm text-gray-600 mb-2 block">
                    How many loose carpets/rugs do you have?
                  </Label>
                  <Select 
                    value={carpetDetails.numberOfLooseCarpets.toString()} 
                    onValueChange={(value) => updateCarpetField('numberOfLooseCarpets', Number(value))}
                  >
                    <SelectTrigger id="home-numberOfLooseCarpets">
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

              {/* Room status */}
              <div>
                <Label className="text-sm text-gray-600 mb-3 block">
                  Room Status
                </Label>
                <RadioGroup
                  value={carpetDetails.roomStatus}
                  onValueChange={(value) => updateCarpetField('roomStatus', value as 'empty' | 'hasProperty')}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="empty" id="home-empty" />
                    <Label htmlFor="home-empty" className="text-sm font-normal cursor-pointer">
                      Room is Empty
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hasProperty" id="home-hasProperty" />
                    <Label htmlFor="home-hasProperty" className="text-sm font-normal cursor-pointer">
                      Has Property (Needs to be Moved)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
