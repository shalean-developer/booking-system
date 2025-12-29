'use client';

import React from 'react';

interface IconProps {
  className?: string;
}

// Inside Fridge - Refrigerator icon
export function FridgeIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="5" y="2" width="14" height="20" rx="1.5" />
      <line x1="5" y1="11" x2="19" y2="11" strokeWidth="1.5" />
      <circle cx="8" cy="6.5" r="0.8" />
      <circle cx="12" cy="6.5" r="0.8" />
      <circle cx="16" cy="6.5" r="0.8" />
      <rect x="7" y="14" width="10" height="6" rx="0.5" />
    </svg>
  );
}

// Inside Oven - Oven with controls icon
export function OvenIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="5" width="18" height="15" rx="1.5" />
      <rect x="6" y="9" width="12" height="7" rx="0.5" />
      <circle cx="9" cy="12.5" r="0.8" />
      <circle cx="12" cy="12.5" r="0.8" />
      <circle cx="15" cy="12.5" r="0.8" />
      <rect x="7" y="5" width="10" height="2" rx="0.3" />
      <circle cx="8.5" cy="6" r="0.4" />
      <circle cx="10.5" cy="6" r="0.4" />
      <circle cx="12.5" cy="6" r="0.4" />
      <circle cx="14.5" cy="6" r="0.4" />
      <circle cx="16.5" cy="6" r="0.4" />
    </svg>
  );
}

// Inside Cabinets - Stacked cabinets/drawers icon
export function CabinetsIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="6" rx="1" />
      <rect x="3" y="11" width="18" height="6" rx="1" />
      <rect x="3" y="18" width="18" height="4" rx="1" />
      <circle cx="6.5" cy="7" r="0.7" />
      <circle cx="12" cy="7" r="0.7" />
      <circle cx="6.5" cy="14" r="0.7" />
      <circle cx="12" cy="14" r="0.7" />
      <circle cx="6.5" cy="20" r="0.7" />
      <circle cx="12" cy="20" r="0.7" />
      <line x1="18" y1="7" x2="18" y2="7" />
      <line x1="18" y1="14" x2="18" y2="14" />
      <line x1="18" y1="20" x2="18" y2="20" />
    </svg>
  );
}

// Interior Windows - Window pane with grid icon (simple 4-pane design)
export function WindowsIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <line x1="4" y1="12" x2="20" y2="12" strokeWidth="1.5" />
      <line x1="12" y1="4" x2="12" y2="20" strokeWidth="1.5" />
    </svg>
  );
}

// Interior Walls - Brick wall pattern icon
export function WallsIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="3" width="20" height="18" rx="1" />
      <line x1="2" y1="9" x2="22" y2="9" strokeWidth="1.5" />
      <line x1="2" y1="15" x2="22" y2="15" strokeWidth="1.5" />
      <line x1="8" y1="3" x2="8" y2="9" strokeWidth="1.5" />
      <line x1="16" y1="9" x2="16" y2="15" strokeWidth="1.5" />
      <line x1="8" y1="15" x2="8" y2="21" strokeWidth="1.5" />
      <line x1="16" y1="3" x2="16" y2="9" strokeWidth="1.5" />
      <line x1="16" y1="15" x2="16" y2="21" strokeWidth="1.5" />
    </svg>
  );
}

// Ironing - T-shirt icon
export function IroningIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 3h12l-1 7H7L6 3z" />
      <path d="M6 10h12" />
      <path d="M9 10v9" />
      <path d="M15 10v9" />
      <path d="M10 19h4" />
      <line x1="12" y1="3" x2="12" y2="7" strokeWidth="1.5" />
    </svg>
  );
}

// Laundry - Washing machine icon
export function LaundryIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <circle cx="12" cy="12" r="5" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" strokeWidth="1.5" />
      <rect x="6" y="5" width="12" height="3" rx="0.5" />
      <circle cx="8" cy="6.5" r="0.4" />
      <circle cx="10" cy="6.5" r="0.4" />
      <circle cx="12" cy="6.5" r="0.4" />
      <circle cx="14" cy="6.5" r="0.4" />
      <circle cx="16" cy="6.5" r="0.4" />
    </svg>
  );
}

// Carpet Cleaning - Vacuum cleaner icon
export function CarpetIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 20h16" />
      <path d="M7 20V9a3 3 0 0 1 6 0v11" />
      <path d="M13 13h5l2 7" />
      <path d="M7 10h6" />
    </svg>
  );
}

// Ceiling Cleaning - Extended duster icon
export function CeilingIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="3" y1="5" x2="21" y2="5" />
      <path d="M12 5v8" />
      <path d="M9 10l3 3 3-3" />
      <path d="M10 18h4" />
      <path d="M9 21h6" />
      <circle cx="12" cy="15.5" r="1" />
    </svg>
  );
}

// Garage Cleaning - Garage door icon
export function GarageIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 20V9l9-4 9 4v11" />
      <path d="M7 20v-5h10v5" />
      <path d="M7 15h10" />
      <path d="M10 12h4" />
    </svg>
  );
}

// Balcony Cleaning - Balcony railing icon
export function BalconyIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="10" width="16" height="4" rx="1" />
      <path d="M6 14v6" />
      <path d="M10 14v6" />
      <path d="M14 14v6" />
      <path d="M18 14v6" />
      <path d="M7 10V6h10v4" />
    </svg>
  );
}

// Couch Cleaning - Sofa icon
export function CouchIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12V9a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3" />
      <path d="M2 12h4v6H4a2 2 0 0 1-2-2v-4z" />
      <path d="M18 12h4v4a2 2 0 0 1-2 2h-2v-6z" />
      <path d="M6 18h12" />
    </svg>
  );
}

// Outside Window Cleaning - Window with sparkle icon
export function OutsideWindowIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16" />
      <path d="M3 12h18" />
      <path d="M8 8h2" />
      <path d="M14 16h2" />
      <path d="M16.5 7.5l1 1 1.5-.5-.5 1.5 1 1-1.4.2-.6 1.3-.6-1.3-1.4-.2 1-1-.5-1.5z" />
    </svg>
  );
}

// Laundry & Ironing - Combined icon (washing machine and iron)
export function LaundryIroningIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Washing machine */}
      <rect x="3" y="3" width="10" height="10" rx="1" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="8" cy="8" r="1.5" />
      {/* Iron */}
      <path d="M16 6l2-2h2l-1 7h-3L16 6z" />
      <path d="M16 10h3" />
      <path d="M17 10v6" />
    </svg>
  );
}

// Icon mapping for easy lookup
export const EXTRA_ICONS = {
  'Inside Fridge': FridgeIcon,
  'Inside Oven': OvenIcon,
  'Inside Cabinets': CabinetsIcon,
  'Interior Windows': WindowsIcon,
  'Interior Walls': WallsIcon,
  'Laundry & Ironing': LaundryIroningIcon,
  'Carpet Cleaning': CarpetIcon,
  'Ceiling Cleaning': CeilingIcon,
  'Garage Cleaning': GarageIcon,
  'Balcony Cleaning': BalconyIcon,
  'Couch Cleaning': CouchIcon,
  'Outside Window Cleaning': OutsideWindowIcon,
} as const;

