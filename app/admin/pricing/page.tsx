'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, DollarSign, Home, Wrench, Percent, Plus } from 'lucide-react';

interface ServicePricing {
  service_type: string;
  service_name: string;
  base: { id: string; price: number; effective_date: string; end_date: string | null } | null;
  bedroom: { id: string; price: number; effective_date: string; end_date: string | null } | null;
  bathroom: { id: string; price: number; effective_date: string; end_date: string | null } | null;
}

interface ExtraPricing {
  id: string;
  item_name: string;
  price: number;
  effective_date: string;
  end_date: string | null;
}

interface FrequencyDiscount {
  id: string;
  item_name: string;
  price: number; // percentage
  effective_date: string;
  end_date: string | null;
}

interface PricingData {
  services: ServicePricing[];
  extras: ExtraPricing[];
  serviceFee: { id: string; price: number; effective_date: string; end_date: string | null } | null;
  frequencyDiscounts: FrequencyDiscount[];
}

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/pricing/manage', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.ok) {
        setPricing(data.pricing);
      } else {
        setError(data.error || 'Failed to load pricing');
      }
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
      setError(err.message || 'Failed to load pricing');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrice = async (
    id: string | null,
    service_type: string | null,
    price_type: string,
    item_name: string | null,
    price: number
  ) => {
    try {
      setSaving(`${price_type}-${service_type || item_name || 'fee'}`);
      setError(null);

      const response = await fetch('/api/admin/pricing/manage', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id || undefined,
          service_type: service_type || null,
          price_type,
          item_name: item_name || null,
          price: parseFloat(price.toString()),
          effective_date: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (data.ok) {
        // Refresh pricing data
        await fetchPricing();
      } else {
        setError(data.error || 'Failed to update price');
      }
    } catch (err: any) {
      console.error('Error updating price:', err);
      setError(err.message || 'Failed to update price');
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pricing Management"
          description="Manage all pricing for services, extras, fees, and discounts"
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Pricing' },
          ]}
        />
        <LoadingState rows={5} columns={1} variant="cards" />
      </div>
    );
  }

  if (error && !pricing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pricing Management"
          description="Manage all pricing for services, extras, fees, and discounts"
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Pricing' },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchPricing} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Management"
        description="Manage all pricing for services, extras, fees, and discounts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Pricing' },
        ]}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">
            <Home className="h-4 w-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="extras">
            <Wrench className="h-4 w-4 mr-2" />
            Extras
          </TabsTrigger>
          <TabsTrigger value="fee">
            <DollarSign className="h-4 w-4 mr-2" />
            Service Fee
          </TabsTrigger>
          <TabsTrigger value="discounts">
            <Percent className="h-4 w-4 mr-2" />
            Discounts
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Pricing</CardTitle>
              <CardDescription>
                Manage base prices, bedroom prices, and bathroom prices for each service type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Per Bedroom</TableHead>
                    <TableHead>Per Bathroom</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricing?.services.map((service) => (
                    <ServiceRow
                      key={service.service_type}
                      service={service}
                      onUpdate={updatePrice}
                      saving={saving}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extras Tab */}
        <TabsContent value="extras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extra Services Pricing</CardTitle>
              <CardDescription>
                Manage pricing for additional services like Inside Fridge, Inside Oven, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <AddExtraForm onAdd={updatePrice} onSuccess={fetchPricing} saving={saving} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Extra Service</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricing?.extras.map((extra) => (
                    <ExtraRow
                      key={extra.id}
                      extra={extra}
                      onUpdate={updatePrice}
                      saving={saving}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Fee Tab */}
        <TabsContent value="fee" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Fee</CardTitle>
              <CardDescription>
                Manage the flat service fee charged on all bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pricing?.serviceFee && (
                <ServiceFeeRow
                  serviceFee={pricing.serviceFee}
                  onUpdate={updatePrice}
                  saving={saving}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frequency Discounts Tab */}
        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequency Discounts</CardTitle>
              <CardDescription>
                Manage discount percentages for recurring bookings (weekly, bi-weekly, monthly)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Discount %</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricing?.frequencyDiscounts.map((discount) => (
                    <DiscountRow
                      key={discount.id}
                      discount={discount}
                      onUpdate={updatePrice}
                      saving={saving}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Service Row Component
function ServiceRow({
  service,
  onUpdate,
  saving,
}: {
  service: ServicePricing;
  onUpdate: (id: string | null, service_type: string | null, price_type: string, item_name: string | null, price: number) => Promise<void>;
  saving: string | null;
}) {
  const [basePrice, setBasePrice] = useState(service.base?.price.toString() || '');
  const [bedroomPrice, setBedroomPrice] = useState(service.bedroom?.price.toString() || '');
  const [bathroomPrice, setBathroomPrice] = useState(service.bathroom?.price.toString() || '');

  // Sync state when service prop changes
  useEffect(() => {
    setBasePrice(service.base?.price.toString() || '');
    setBedroomPrice(service.bedroom?.price.toString() || '');
    setBathroomPrice(service.bathroom?.price.toString() || '');
  }, [service]);

  const isSaving = saving === `base-${service.service_type}` || 
                  saving === `bedroom-${service.service_type}` || 
                  saving === `bathroom-${service.service_type}`;

  const handleSave = async (priceType: 'base' | 'bedroom' | 'bathroom', price: string) => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) return;

    const existingId = service[priceType]?.id || null;
    await onUpdate(existingId, service.service_type, priceType, null, numericPrice);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{service.service_name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="w-32"
            disabled={isSaving}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSave('base', basePrice)}
            disabled={isSaving || !basePrice}
          >
            {saving === `base-${service.service_type}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={bedroomPrice}
            onChange={(e) => setBedroomPrice(e.target.value)}
            className="w-32"
            disabled={isSaving}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSave('bedroom', bedroomPrice)}
            disabled={isSaving || !bedroomPrice}
          >
            {saving === `bedroom-${service.service_type}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={bathroomPrice}
            onChange={(e) => setBathroomPrice(e.target.value)}
            className="w-32"
            disabled={isSaving}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSave('bathroom', bathroomPrice)}
            disabled={isSaving || !bathroomPrice}
          >
            {saving === `bathroom-${service.service_type}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Active
        </Badge>
      </TableCell>
    </TableRow>
  );
}

// Extra Row Component
function ExtraRow({
  extra,
  onUpdate,
  saving,
}: {
  extra: ExtraPricing;
  onUpdate: (id: string | null, service_type: string | null, price_type: string, item_name: string | null, price: number) => Promise<void>;
  saving: string | null;
}) {
  const [price, setPrice] = useState(extra.price.toString());

  // Sync state when extra prop changes
  useEffect(() => {
    setPrice(extra.price.toString());
  }, [extra]);
  const isSaving = saving === `extra-${extra.item_name}`;

  const handleSave = async () => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) return;
    await onUpdate(extra.id, null, 'extra', extra.item_name, numericPrice);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{extra.item_name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-32"
            disabled={isSaving}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || !price}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Active
        </Badge>
      </TableCell>
    </TableRow>
  );
}

// Service Fee Row Component
function ServiceFeeRow({
  serviceFee,
  onUpdate,
  saving,
}: {
  serviceFee: { id: string; price: number; effective_date: string; end_date: string | null };
  onUpdate: (id: string | null, service_type: string | null, price_type: string, item_name: string | null, price: number) => Promise<void>;
  saving: string | null;
}) {
  const [price, setPrice] = useState(serviceFee.price.toString());

  // Sync state when serviceFee prop changes
  useEffect(() => {
    setPrice(serviceFee.price.toString());
  }, [serviceFee]);
  const isSaving = saving === 'service_fee-fee';

  const handleSave = async () => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) return;
    await onUpdate(serviceFee.id, null, 'service_fee', null, numericPrice);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="space-y-2 flex-1">
          <Label htmlFor="service-fee">Service Fee (R)</Label>
          <Input
            id="service-fee"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-48"
            disabled={isSaving}
          />
          <p className="text-xs text-gray-500">
            Flat service fee charged on all bookings
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !price}
          className="mt-6"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Active
      </Badge>
    </div>
  );
}

// Discount Row Component
function DiscountRow({
  discount,
  onUpdate,
  saving,
}: {
  discount: FrequencyDiscount;
  onUpdate: (id: string | null, service_type: string | null, price_type: string, item_name: string | null, price: number) => Promise<void>;
  saving: string | null;
}) {
  const [price, setPrice] = useState(discount.price.toString());

  // Sync state when discount prop changes
  useEffect(() => {
    setPrice(discount.price.toString());
  }, [discount]);
  const isSaving = saving === `frequency_discount-${discount.item_name}`;

  const handleSave = async () => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0 || numericPrice > 100) return;
    await onUpdate(discount.id, null, 'frequency_discount', discount.item_name, numericPrice);
  };

  const frequencyLabel = discount.item_name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <TableRow>
      <TableCell className="font-medium">{frequencyLabel}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-32"
            disabled={isSaving}
          />
          <span className="text-sm text-gray-500">%</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || !price}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Active
        </Badge>
      </TableCell>
    </TableRow>
  );
}

// Add Extra Form Component
function AddExtraForm({
  onAdd,
  onSuccess,
  saving,
}: {
  onAdd: (id: string | null, service_type: string | null, price_type: string, item_name: string | null, price: number) => Promise<void>;
  onSuccess: () => void;
  saving: string | null;
}) {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !price) return;

    setIsSubmitting(true);
    try {
      await onAdd(null, null, 'extra', itemName, parseFloat(price));
      setItemName('');
      setPrice('');
      await onSuccess();
    } catch (err) {
      console.error('Error adding extra:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 bg-gray-50 rounded-lg border">
      <div className="space-y-2 flex-1">
        <Label htmlFor="new-extra-name">Extra Service Name</Label>
        <Input
          id="new-extra-name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="e.g., Carpet Cleaning"
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-extra-price">Price (R)</Label>
        <Input
          id="new-extra-price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-32"
          disabled={isSubmitting}
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !itemName || !price}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Add Extra
          </>
        )}
      </Button>
    </form>
  );
}
