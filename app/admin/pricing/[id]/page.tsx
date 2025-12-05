'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

export default function EditPricingRulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    service_name: '',
    multiplier: 1.0,
    region: '',
    is_active: true,
  });

  useEffect(() => {
    fetchRule();
  }, [id]);

  const fetchRule = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/pricing/${id}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pricing rule');
      }

      const data = await response.json();
      if (data.ok && data.rule) {
        const rule = data.rule;
        // Try to extract multiplier and region from notes if stored there
        let multiplier = 1.0;
        let region = '';
        
        try {
          if (rule.notes) {
            const notesData = typeof rule.notes === 'string' ? JSON.parse(rule.notes) : rule.notes;
            multiplier = notesData.multiplier || 1.0;
            region = notesData.region || '';
          }
        } catch {
          // If notes parsing fails, use defaults
        }

        setFormData({
          service_name: rule.service_name || '',
          multiplier: multiplier,
          region: region,
          is_active: rule.is_active ?? true,
        });
      } else {
        setError('Pricing rule not found');
      }
    } catch (err: any) {
      console.error('Error fetching pricing rule:', err);
      setError(err.message || 'Failed to load pricing rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/pricing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.ok) {
        router.push('/admin/pricing');
      } else {
        setError(data.error || 'Failed to update pricing rule');
      }
    } catch (err: any) {
      console.error('Error updating pricing rule:', err);
      setError(err.message || 'Failed to update pricing rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Pricing Rule"
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Pricing', href: '/admin/pricing' },
            { label: 'Edit' },
          ]}
        />
        <LoadingState rows={5} columns={1} variant="cards" />
      </div>
    );
  }

  if (error && !formData.service_name) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Pricing Rule"
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Pricing', href: '/admin/pricing' },
            { label: 'Edit' },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/admin/pricing">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pricing Rules
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Pricing Rule"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Pricing', href: '/admin/pricing' },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Pricing Rule Details</CardTitle>
            <CardDescription>Update the pricing multiplier and settings for this service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="service_name">Service Name</Label>
              <Input
                id="service_name"
                value={formData.service_name}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Service name cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="multiplier">Multiplier</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.01"
                min="0.1"
                max="10"
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1.0 })}
                required
              />
              <p className="text-xs text-gray-500">Price multiplier (e.g., 1.0 = base price, 1.5 = 50% increase)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region (Optional)</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g., Cape Town, Johannesburg"
              />
              <p className="text-xs text-gray-500">Leave empty for all regions</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked === true })}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/pricing">
                  Cancel
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

