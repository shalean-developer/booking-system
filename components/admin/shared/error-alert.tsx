'use client';

import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function ErrorAlert({
  title = 'Error',
  message,
  onRetry,
  onDismiss,
  className,
  variant = 'destructive',
}: ErrorAlertProps) {
  return (
    <Card className={cn(
      'border-l-4',
      variant === 'destructive' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50',
      className
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className={cn(
            'h-5 w-5 mt-0.5 flex-shrink-0',
            variant === 'destructive' ? 'text-red-600' : 'text-yellow-600'
          )} />
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'text-sm font-semibold mb-1',
              variant === 'destructive' ? 'text-red-800' : 'text-yellow-800'
            )}>
              {title}
            </h3>
            <p className={cn(
              'text-sm',
              variant === 'destructive' ? 'text-red-700' : 'text-yellow-700'
            )}>
              {message}
            </p>
            {(onRetry || onDismiss) && (
              <div className="flex items-center gap-2 mt-3">
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className={cn(
                      'h-8',
                      variant === 'destructive' ? 'border-red-300 text-red-700 hover:bg-red-100' : 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                    )}
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Retry
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className={cn(
                      'h-8',
                      variant === 'destructive' ? 'text-red-700 hover:bg-red-100' : 'text-yellow-700 hover:bg-yellow-100'
                    )}
                  >
                    <X className="h-3 w-3 mr-2" />
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

