'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Collapsed Sidebar - Always visible */}
      <div className="fixed left-0 top-0 h-full w-16 bg-primary flex flex-col items-center py-6 z-40">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary/80 rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
        
        {/* Rotated "Menu" text when collapsed */}
        {!isOpen && (
          <div className="mt-8 transform -rotate-90 whitespace-nowrap">
            <span className="text-primary-foreground font-medium text-sm">Menu</span>
          </div>
        )}
      </div>

      {/* Expanded Sidebar - Slides in from left */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 lg:relative lg:z-auto shadow-xl lg:shadow-none">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">S</span>
                </div>
                <span className="font-semibold text-gray-900">Shalean</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Navigation Links */}
            <nav className="p-4 space-y-2">
              <a href="/admin?tab=dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Dashboard
              </a>
              <a href="/admin?tab=bookings" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Bookings
              </a>
              <a href="/admin?tab=recurring" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Recurring
              </a>
              <a href="/admin?tab=customers" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Customers
              </a>
              <a href="/admin?tab=cleaners" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Cleaners
              </a>
              <a href="/admin?tab=reviews" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Reviews
              </a>
              <a href="/admin?tab=applications" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Applications
              </a>
              <a href="/admin?tab=pricing" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Pricing
              </a>
              <a href="/admin?tab=blog" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Blog
              </a>
              <a href="/admin?tab=quotes" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Quotes
              </a>
              <a href="/admin?tab=users" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Users
              </a>
            </nav>
          </div>
        </>
      )}
    </>
  );
}

