'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardDescription } from '@/components/ui/card';
import { Save, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface FeeEditorProps {
  serviceFee: number;
  onUpdate: () => void;
}

export function FeeEditor({ serviceFee, onUpdate }: FeeEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(serviceFee.toString());
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setEditing(true);
    setValue(serviceFee.toString());
  };

  const handleCancel = () => {
    setEditing(false);
    setValue(serviceFee.toString());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: null,
          price_type: 'service_fee',
          item_name: null,
          price: parseFloat(value),
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to save service fee');
      }

      toast.success('Service fee updated successfully');
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save service fee');
      console.error('Error saving service fee:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Service Fee</h3>
            <CardDescription className="mt-1">
              Fixed amount added to all bookings
            </CardDescription>
          </div>
          {!editing && (
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-fee">Amount (R)</Label>
              <Input
                id="service-fee"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-gray-600 mt-2">
                This fee will be added to the subtotal of all bookings
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
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
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">R{serviceFee}</span>
              <span className="text-gray-600">per booking</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

