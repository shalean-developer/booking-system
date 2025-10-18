'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Save, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface FrequencyEditorProps {
  discounts: { [key: string]: number };
  onUpdate: () => void;
}

const FREQUENCY_OPTIONS = [
  { key: 'weekly', label: 'Weekly', icon: '📅', description: 'Every week' },
  { key: 'bi-weekly', label: 'Bi-Weekly', icon: '📆', description: 'Every 2 weeks' },
  { key: 'monthly', label: 'Monthly', icon: '🗓️', description: 'Once a month' },
];

export function FrequencyEditor({ discounts, onUpdate }: FrequencyEditorProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (frequency: string, currentDiscount: number) => {
    setEditing(frequency);
    setEditValue(currentDiscount.toString());
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue('');
  };

  const handleSave = async (frequency: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: null,
          price_type: 'frequency_discount',
          item_name: frequency,
          price: parseFloat(editValue),
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to save frequency discount');
      }

      toast.success('Frequency discount updated successfully');
      handleCancel();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save frequency discount');
      console.error('Error saving frequency discount:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        These percentage discounts are applied to the subtotal for recurring services
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FREQUENCY_OPTIONS.map((option) => {
          const discount = discounts[option.key] || 0;
          const isEditing = editing === option.key;

          return (
            <Card key={option.key} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{option.icon}</span>
                    <h4 className="font-semibold text-gray-900">{option.label}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                {!isEditing && (
                  <Button
                    onClick={() => handleEdit(option.key, discount)}
                    variant="ghost"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave(option.key)}
                      size="sm"
                      disabled={saving}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size="sm"
                      variant="outline"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 bg-primary/10 rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-primary">
                    {discount}%
                  </span>
                  <p className="text-xs text-gray-600 mt-1">discount</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Example Calculation */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-2">Example Calculation</h4>
        <div className="text-sm space-y-1">
          <p className="text-gray-700">
            If a booking subtotal is R500:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
            <li>One-time: R500 (no discount)</li>
            <li>Weekly: R{(500 * (1 - (discounts.weekly || 0) / 100)).toFixed(2)} (-{discounts.weekly || 0}%)</li>
            <li>Bi-weekly: R{(500 * (1 - (discounts['bi-weekly'] || 0) / 100)).toFixed(2)} (-{discounts['bi-weekly'] || 0}%)</li>
            <li>Monthly: R{(500 * (1 - (discounts.monthly || 0) / 100)).toFixed(2)} (-{discounts.monthly || 0}%)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

