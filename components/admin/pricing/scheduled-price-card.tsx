'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ScheduledPriceCardProps {
  pricing: any;
  onUpdate: () => void;
}

export function ScheduledPriceCard({ pricing, onUpdate }: ScheduledPriceCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/pricing?id=${pricing.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to cancel scheduled price');
      }

      toast.success('Scheduled price cancelled successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel scheduled price');
      console.error('Error cancelling scheduled price:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getPriceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      base: 'Base Price',
      bedroom: 'Bedroom Rate',
      bathroom: 'Bathroom Rate',
      extra: 'Extra Service',
      service_fee: 'Service Fee',
      frequency_discount: 'Frequency Discount',
    };
    return labels[type] || type;
  };

  const getDisplayName = () => {
    if (pricing.service_type && pricing.item_name) {
      return `${pricing.service_type} - ${pricing.item_name}`;
    }
    if (pricing.service_type) {
      return `${pricing.service_type} ${getPriceTypeLabel(pricing.price_type)}`;
    }
    if (pricing.item_name) {
      return pricing.item_name;
    }
    return getPriceTypeLabel(pricing.price_type);
  };

  const daysUntil = Math.ceil(
    (new Date(pricing.effective_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="p-4 border-l-4 border-l-amber-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              {daysUntil === 0 
                ? 'Today' 
                : daysUntil === 1 
                  ? 'Tomorrow' 
                  : `In ${daysUntil} days`}
            </Badge>
          </div>

          <h4 className="font-semibold text-gray-900 mb-1">
            {getDisplayName()}
          </h4>

          <div className="flex items-center gap-4 text-sm mb-2">
            <Badge variant="secondary">
              {getPriceTypeLabel(pricing.price_type)}
            </Badge>
            <span className="font-semibold text-primary">
              New price: R{pricing.price}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            Effective from: {format(new Date(pricing.effective_date), 'PPP')}
          </p>

          {pricing.notes && (
            <p className="text-sm text-gray-600 mt-2 italic">
              "{pricing.notes}"
            </p>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Scheduled Price Change?</AlertDialogTitle>
              <AlertDialogDescription>
                This will prevent the price change from taking effect on{' '}
                {format(new Date(pricing.effective_date), 'PPP')}. 
                The current price will remain active.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Schedule</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Schedule
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

