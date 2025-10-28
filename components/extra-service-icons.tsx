'use client';

import React from 'react';

interface IconProps {
  className?: string;
}

// Inside Fridge - Refrigerator icon
export function FridgeIcon({ className = 'w-5 h-5' }: IconProps) {
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
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <circle cx="7" cy="7" r="1" />
      <circle cx="12" cy="7" r="1" />
      <circle cx="17" cy="7" r="1" />
    </svg>
  );
}

// Inside Oven - Oven with controls icon
export function OvenIcon({ className = 'w-5 h-5' }: IconProps) {
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
      <rect x="2" y="5" width="20" height="16" rx="2" />
      <rect x="5" y="9" width="14" height="8" />
      <circle cx="12" cy="13" r="1" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
      <line x1="7" y1="6" x2="7" y2="8" />
      <line x1="9" y1="6" x2="9" y2="8" />
    </svg>
  );
}

// Inside Cabinets - Stacked cabinets/drawers icon
export function CabinetsIcon({ className = 'w-5 h-5' }: IconProps) {
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
      <rect x="3" y="4" width="18" height="6" rx="1" />
      <rect x="3" y="10" width="18" height="6" rx="1" />
      <rect x="3" y="16" width="18" height="6" rx="1" />
      <circle cx="6" cy="7" r="0.8" />
      <circle cx="12" cy="7" r="0.8" />
      <circle cx="6" cy="13" r="0.8" />
      <circle cx="12" cy="13" r="0.8" />
      <circle cx="6" cy="19" r="0.8" />
      <circle cx="12" cy="19" r="0.8" />
    </svg>
  );
}

// Interior Windows - Window pane with grid icon
export function WindowsIcon({ className = 'w-5 h-5' }: IconProps) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="3" y1="16" x2="21" y2="16" />
      <line x1="8" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="16" y2="21" />
    </svg>
  );
}

// Interior Walls - Brick wall pattern icon
export function WallsIcon({ className = 'w-5 h-5' }: IconProps) {
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
      <line x1="3" y1="4" x2="21" y2="4" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="16" x2="21" y2="16" />
      <line x1="3" y1="20" x2="21" y2="20" />
      <line x1="8" y1="4" x2="8" y2="8" />
      <line x1="16" y1="8" x2="16" y2="12" />
      <line x1="8" y1="12" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="20" />
    </svg>
  );
}

// Ironing - T-shirt icon
export function IroningIcon({ className = 'w-5 h-5' }: IconProps) {
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
      <path d="M6 3h12l-1 7H7L6 3z" />
      <path d="M6 10h12" />
      <path d="M9 10v11" />
      <path d="M15 10v11" />
      <path d="M10 21h4" />
    </svg>
  );
}

// Laundry - Washing machine icon
export function LaundryIcon({ className = 'w-5 h-5' }: IconProps) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M7 7h10" />
      <line x1="7" y1="10" x2="7" y2="10" />
      <line x1="17" y1="10" x2="17" y2="10" />
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
  'Ironing': IroningIcon,
  'Laundry': LaundryIcon,
} as const;

