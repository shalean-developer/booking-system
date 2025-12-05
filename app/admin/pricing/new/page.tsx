'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

export default function NewPricingRulePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Array<{ service_type: string; display_name: string }>>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  
  const [formData, setFormData] = useState({
    service_id: '',
    multiplier: 1.0,
    region: '',
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoadingServices(true);
      const response = await fetch('/api/services/popular', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.services) {
          setServices(data.services.map((s: any) => ({
            service_type: s.serviceType,
            display_name: s.category,
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.service_id) {
      setError('Please select a service');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.ok) {
        router.push('/admin/pricing');
      } else {
        setError(data.error || 'Failed to create pricing rule');
      }
    } catch (err: any) {
      console.error('Error creating pricing rule:', err);
      setError(err.message || 'Failed to create pricing rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Pricing Rule"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Pricing', href: '/admin/pricing' },
          { label: 'New' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create Pricing Rule</CardTitle>
            <CardDescription>Add a new pricing multiplier for a service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="service_id">Service</Label>
              <Select
                value={formData.service_id}
                onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                disabled={isLoadingServices}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingServices ? "Loading services..." : "Select a service"} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.service_type} value={service.service_type}>
                      {service.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Button type="submit" disabled={isSubmitting || isLoadingServices}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Rule
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

