'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PricingData } from '@/lib/pricing-db';
import { Save, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ServicePriceEditorProps {
  pricing: PricingData;
  onUpdate: () => void;
}

const SERVICE_TYPES = ['Standard', 'Deep', 'Move In/Out', 'Airbnb'] as const;

export function ServicePriceEditor({ pricing, onUpdate }: ServicePriceEditorProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<{[key: string]: any}>({});
  const [saving, setSaving] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const handleEdit = (serviceType: string) => {
    setEditing(serviceType);
    setValues(pricing.services[serviceType] || { base: 0, bedroom: 0, bathroom: 0 });
    setScheduleDate('');
  };

  const handleCancel = () => {
    setEditing(null);
    setValues({});
    setScheduleDate('');
  };

  const handleSave = async (serviceType: string, scheduled = false) => {
    setSaving(true);
    try {
      const priceTypes = ['base', 'bedroom', 'bathroom'] as const;
      
      for (const priceType of priceTypes) {
        const price = values[priceType];
        
        const payload: any = {
          service_type: serviceType,
          price_type: priceType,
          price: parseFloat(price),
        };

        if (scheduled && scheduleDate) {
          payload.effective_date = scheduleDate;
        }

        const response = await fetch('/api/admin/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!data.ok) {
          throw new Error(data.error || 'Failed to save pricing');
        }
      }

      toast.success(
        scheduled 
          ? `Price scheduled for ${scheduleDate}` 
          : 'Prices updated successfully'
      );
      handleCancel();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save pricing');
      console.error('Error saving pricing:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {SERVICE_TYPES.map((serviceType) => {
        const servicePricing = pricing.services[serviceType] || { base: 0, bedroom: 0, bathroom: 0 };
        const isEditing = editing === serviceType;

        return (
          <Card key={serviceType} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{serviceType} Cleaning</h3>
              {!isEditing && (
                <Button
                  onClick={() => handleEdit(serviceType)}
                  variant="outline"
                  size="sm"
                >
                  Edit Prices
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`${serviceType}-base`}>Base Price (R)</Label>
                    <Input
                      id={`${serviceType}-base`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.base}
                      onChange={(e) => setValues({ ...values, base: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${serviceType}-bedroom`}>Per Bedroom (R)</Label>
                    <Input
                      id={`${serviceType}-bedroom`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.bedroom}
                      onChange={(e) => setValues({ ...values, bedroom: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${serviceType}-bathroom`}>Per Bathroom (R)</Label>
                    <Input
                      id={`${serviceType}-bathroom`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.bathroom}
                      onChange={(e) => setValues({ ...values, bathroom: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Schedule Date (Optional) */}
                <div className="border-t pt-4">
                  <Label htmlFor="schedule-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule for Future Date (Optional)
                  </Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 max-w-xs"
                  />
                  {scheduleDate && (
                    <p className="text-sm text-gray-600 mt-1">
                      These prices will take effect on {new Date(scheduleDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave(serviceType, !!scheduleDate)}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : scheduleDate ? 'Schedule' : 'Save Now'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Base Price:</span>
                  <span className="ml-2 font-semibold">R{servicePricing.base}</span>
                </div>
                <div>
                  <span className="text-gray-600">Per Bedroom:</span>
                  <span className="ml-2 font-semibold">R{servicePricing.bedroom}</span>
                </div>
                <div>
                  <span className="text-gray-600">Per Bathroom:</span>
                  <span className="ml-2 font-semibold">R{servicePricing.bathroom}</span>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

