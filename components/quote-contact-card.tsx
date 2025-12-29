"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContactCardProps {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
  };
  setContact: React.Dispatch<React.SetStateAction<ContactCardProps['contact']>>;
}

export function ContactCard({ contact, setContact }: ContactCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[576px]"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">1. Your Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm text-gray-600 mb-2 block">
                First name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="firstName"
                  value={contact.firstName}
                  onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                  className="pl-10"
                  placeholder="John"
                  aria-label="First name"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm text-gray-600 mb-2 block">
                Last name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="lastName"
                  value={contact.lastName}
                  onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                  className="pl-10"
                  placeholder="Doe"
                  aria-label="Last name"
                  required
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email" className="text-sm text-gray-600 mb-2 block">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="pl-10"
                  placeholder="john.doe@example.com"
                  aria-label="Email"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm text-gray-600 mb-2 block">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className="pl-10"
                  placeholder="+27 12 345 6789"
                  aria-label="Phone number"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location" className="text-sm text-gray-600 mb-2 block">
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="location"
                  type="text"
                  value={contact.location}
                  onChange={(e) => setContact({ ...contact, location: e.target.value })}
                  className="pl-10"
                  placeholder="Enter your address or area"
                  aria-label="Location"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
