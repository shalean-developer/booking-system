'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SchedulingLimit {
  id: string;
  service_type: string;
  max_bookings_per_date: number;
  uses_teams: boolean;
  surge_pricing_enabled: boolean;
  surge_threshold: number | null;
  surge_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export default function AdminSchedulingPage() {
  const [limits, setLimits] = useState<SchedulingLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/scheduling-limits');
      const data = await response.json();
      
      if (data.ok) {
        setLimits(data.limits || []);
      } else {
        setError(data.error || 'Failed to fetch scheduling limits');
      }
    } catch (err: any) {
      console.error('Error fetching limits:', err);
      setError(err.message || 'Failed to fetch scheduling limits');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLimit = (serviceType: string, field: string, value: any) => {
    setLimits(prev => prev.map(limit => 
      limit.service_type === serviceType 
        ? { ...limit, [field]: value }
        : limit
    ));
  };

  const handleSave = async (serviceType: string) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const limit = limits.find(l => l.service_type === serviceType);
      if (!limit) return;

      const response = await fetch('/api/admin/scheduling-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: serviceType,
          max_bookings_per_date: limit.max_bookings_per_date,
          uses_teams: limit.uses_teams,
          surge_pricing_enabled: limit.surge_pricing_enabled,
          surge_threshold: limit.surge_threshold,
          surge_percentage: limit.surge_percentage,
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        setSuccess(`Scheduling limits for ${serviceType} updated successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update scheduling limits');
      }
    } catch (err: any) {
      console.error('Error saving limits:', err);
      setError(err.message || 'Failed to save scheduling limits');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    for (const limit of limits) {
      await handleSave(limit.service_type);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling & Availability"
        description="Manage booking limits and surge pricing per service type"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Scheduling' },
        ]}
        actions={
          <Button onClick={handleSaveAll} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {limits.map((limit) => (
          <Card key={limit.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{limit.service_type} Cleaning</CardTitle>
                  <CardDescription>
                    Configure booking limits and surge pricing for {limit.service_type} services
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleSave(limit.service_type)}
                  disabled={isSaving}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Max Bookings Per Date */}
              <div className="space-y-2">
                <Label htmlFor={`max-${limit.service_type}`}>
                  Maximum Bookings Per Date
                </Label>
                <Input
                  id={`max-${limit.service_type}`}
                  type="number"
                  min="1"
                  value={limit.max_bookings_per_date}
                  onChange={(e) => updateLimit(limit.service_type, 'max_bookings_per_date', parseInt(e.target.value) || 0)}
                  disabled={limit.uses_teams}
                />
                {limit.uses_teams && (
                  <p className="text-sm text-muted-foreground">
                    Team-based services use 3 slots (one per team: A, B, C)
                  </p>
                )}
              </div>

              {/* Uses Teams */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`teams-${limit.service_type}`}>
                    Team-Based Service
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Each date has 3 slots (Team A, B, C)
                  </p>
                </div>
                <Switch
                  id={`teams-${limit.service_type}`}
                  checked={limit.uses_teams}
                  onCheckedChange={(checked) => updateLimit(limit.service_type, 'uses_teams', checked)}
                />
              </div>

              {/* Surge Pricing Section */}
              {!limit.uses_teams && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-4">Surge Pricing</h4>
                    
                    <div className="space-y-4">
                      {/* Enable Surge Pricing */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor={`surge-enabled-${limit.service_type}`}>
                            Enable Surge Pricing
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Apply price increase when demand is high
                          </p>
                        </div>
                        <Switch
                          id={`surge-enabled-${limit.service_type}`}
                          checked={limit.surge_pricing_enabled}
                          onCheckedChange={(checked) => updateLimit(limit.service_type, 'surge_pricing_enabled', checked)}
                        />
                      </div>

                      {/* Surge Threshold */}
                      {limit.surge_pricing_enabled && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`surge-threshold-${limit.service_type}`}>
                              Surge Threshold (Bookings)
                            </Label>
                            <Input
                              id={`surge-threshold-${limit.service_type}`}
                              type="number"
                              min="1"
                              value={limit.surge_threshold || ''}
                              onChange={(e) => updateLimit(limit.service_type, 'surge_threshold', parseInt(e.target.value) || null)}
                              placeholder="e.g., 70"
                            />
                            <p className="text-sm text-muted-foreground">
                              Surge pricing activates when bookings reach this number
                            </p>
                          </div>

                          {/* Surge Percentage */}
                          <div className="space-y-2">
                            <Label htmlFor={`surge-percentage-${limit.service_type}`}>
                              Surge Percentage (%)
                            </Label>
                            <Input
                              id={`surge-percentage-${limit.service_type}`}
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={limit.surge_percentage || ''}
                              onChange={(e) => updateLimit(limit.service_type, 'surge_percentage', parseFloat(e.target.value) || null)}
                              placeholder="e.g., 10.0"
                            />
                            <p className="text-sm text-muted-foreground">
                              Price increase percentage when surge is active
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

