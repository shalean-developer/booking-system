'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PricingData } from '@/lib/pricing-db';
import { Save, Edit2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ExtraPriceEditorProps {
  pricing: PricingData;
  onUpdate: () => void;
}

export function ExtraPriceEditor({ pricing, onUpdate }: ExtraPriceEditorProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');

  const handleEdit = (extraName: string, currentPrice: number) => {
    setEditing(extraName);
    setEditValue(currentPrice.toString());
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue('');
  };

  const handleSave = async (extraName: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: null,
          price_type: 'extra',
          item_name: extraName,
          price: parseFloat(editValue),
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to save extra pricing');
      }

      toast.success('Extra price updated successfully');
      handleCancel();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save extra pricing');
      console.error('Error saving extra pricing:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async () => {
    if (!newExtraName || !newExtraPrice) {
      toast.error('Please enter both name and price');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: null,
          price_type: 'extra',
          item_name: newExtraName,
          price: parseFloat(newExtraPrice),
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to add extra');
      }

      toast.success('New extra added successfully');
      setAdding(false);
      setNewExtraName('');
      setNewExtraPrice('');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add extra');
      console.error('Error adding extra:', error);
    } finally {
      setSaving(false);
    }
  };

  const extrasList = Object.entries(pricing.extras);

  return (
    <div className="space-y-4">
      {/* Existing Extras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {extrasList.map(([extraName, price]) => {
          const isEditing = editing === extraName;

          return (
            <Card key={extraName} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{extraName}</h4>
                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">R</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-32"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(extraName)}
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
                    <p className="text-lg font-semibold text-primary mt-1">
                      R{price}
                    </p>
                  )}
                </div>
                {!isEditing && (
                  <Button
                    onClick={() => handleEdit(extraName, price)}
                    variant="ghost"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add New Extra */}
      <Card className="p-4 border-dashed">
        {adding ? (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Add New Extra Service</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-extra-name">Service Name</Label>
                <Input
                  id="new-extra-name"
                  value={newExtraName}
                  onChange={(e) => setNewExtraName(e.target.value)}
                  placeholder="e.g., Carpet Cleaning"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-extra-price">Price (R)</Label>
                <Input
                  id="new-extra-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newExtraPrice}
                  onChange={(e) => setNewExtraPrice(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddNew}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Add Extra
              </Button>
              <Button
                onClick={() => {
                  setAdding(false);
                  setNewExtraName('');
                  setNewExtraPrice('');
                }}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setAdding(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Extra Service
          </Button>
        )}
      </Card>
    </div>
  );
}

