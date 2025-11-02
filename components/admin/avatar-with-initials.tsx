'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarWithInitialsProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'blue' | 'green' | 'purple';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const variantClasses = {
  default: 'bg-primary/10 text-primary',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
};

export function AvatarWithInitials({ 
  name, 
  className, 
  size = 'md',
  variant = 'default' 
}: AvatarWithInitialsProps) {
  const getInitials = (name: string): string => {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    // Return first letter of first and last name
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className={variantClasses[variant]}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
