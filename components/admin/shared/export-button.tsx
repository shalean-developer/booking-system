'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  onExport: () => void;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

export function ExportButton({
  onExport,
  label = 'Export',
  variant = 'outline',
  size = 'default',
  disabled = false,
}: ExportButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onExport}
      disabled={disabled}
    >
      <Download className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}

