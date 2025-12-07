'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { toast } from 'sonner';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useRouter } from 'next/navigation';
import { useBookingPath } from '@/lib/useBookingPath';
import type { ServiceType } from '@/types/booking';

interface BookingTemplate {
  id: string;
  name: string;
  service_type: ServiceType;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  extras_quantities: Record<string, number>;
  notes: string;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
  address_line1: string | null;
  address_suburb: string | null;
  address_city: string | null;
  cleaner_id: string | null;
  selected_team: string | null;
  requires_team: boolean;
  tip_amount: number;
  is_default: boolean;
}

export function TemplateSelector() {
  const [templates, setTemplates] = useState<BookingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const { state, updateField } = useBookingV2();
  const router = useRouter();
  const { getDetailsPath } = useBookingPath();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const session = await safeGetSession(supabase);
      if (!session?.session) {
        setIsLoading(false);
        return; // Not logged in, don't show templates
      }

      const response = await fetch('/api/dashboard/templates', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    try {
      setIsApplying(true);
      
      // Apply template to booking state
      updateField('service', template.service_type);
      updateField('bedrooms', template.bedrooms);
      updateField('bathrooms', template.bathrooms);
      updateField('extras', template.extras || []);
      updateField('extrasQuantities', template.extras_quantities || {});
      updateField('notes', template.notes || '');
      updateField('frequency', template.frequency || 'one-time');
      updateField('address', {
        line1: template.address_line1 || '',
        line2: '',
        suburb: template.address_suburb || '',
        city: template.address_city || '',
      });
      updateField('cleaner_id', template.cleaner_id);
      updateField('selected_team', template.selected_team);
      updateField('requires_team', template.requires_team || false);
      updateField('tipAmount', template.tip_amount ? template.tip_amount / 100 : 0);

      // Navigate to details page for the service
      if (template.service_type) {
        router.push(getDetailsPath(template.service_type));
      }

      toast.success(`Template "${template.name}" applied successfully`);
    } catch (error) {
      toast.error('Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading || templates.length === 0) {
    return null; // Don't show anything if loading or no templates
  }

  return (
    <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal-600" />
          <span className="text-sm font-medium text-gray-900">Use a saved template:</span>
        </div>
        <Select
          value=""
          onValueChange={handleApplyTemplate}
          disabled={isApplying}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select template..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.is_default && '⭐ '}
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
