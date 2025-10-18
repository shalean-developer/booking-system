'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, History, Calendar } from 'lucide-react';
import { ServicePriceEditor } from './pricing/service-price-editor';
import { ExtraPriceEditor } from './pricing/extra-price-editor';
import { FeeEditor } from './pricing/fee-editor';
import { FrequencyEditor } from './pricing/frequency-editor';
import { PriceHistoryTimeline } from './pricing/price-history-timeline';
import { ScheduledPriceCard } from './pricing/scheduled-price-card';
import { PricingData } from '@/lib/pricing-db';

export function PricingSection() {
  const [currentPricing, setCurrentPricing] = useState<PricingData | null>(null);
  const [scheduledPricing, setScheduledPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPricing = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const url = `/api/admin/pricing?scheduled=true${forceRefresh ? '&refresh=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setCurrentPricing(data.current);
        setScheduledPricing(data.scheduled || []);
      } else {
        console.error('Failed to fetch pricing:', data.error);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleRefresh = () => {
    fetchPricing(true);
  };

  const handlePricingUpdate = () => {
    // Refresh pricing after any update
    fetchPricing(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-gray-600">Loading pricing data...</span>
        </div>
      </div>
    );
  }

  if (!currentPricing) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-600">
              No pricing configuration found. Please seed the database.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pricing Management</h2>
          <p className="text-gray-600 mt-1">
            Manage service prices, extras, fees, and discounts
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="frequencies">Frequencies</TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled
            {scheduledPricing.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                {scheduledPricing.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Pricing</CardTitle>
              <CardDescription>
                Manage base prices and per-room rates for each service type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServicePriceEditor 
                pricing={currentPricing} 
                onUpdate={handlePricingUpdate} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extras Tab */}
        <TabsContent value="extras">
          <Card>
            <CardHeader>
              <CardTitle>Extra Services</CardTitle>
              <CardDescription>
                Manage pricing for additional services and add-ons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExtraPriceEditor 
                pricing={currentPricing} 
                onUpdate={handlePricingUpdate} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Service Fees</CardTitle>
              <CardDescription>
                Manage the service fee added to all bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeeEditor 
                serviceFee={currentPricing.serviceFee} 
                onUpdate={handlePricingUpdate} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frequencies Tab */}
        <TabsContent value="frequencies">
          <Card>
            <CardHeader>
              <CardTitle>Frequency Discounts</CardTitle>
              <CardDescription>
                Manage discount percentages for recurring services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FrequencyEditor 
                discounts={currentPricing.frequencyDiscounts} 
                onUpdate={handlePricingUpdate} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Price Changes</CardTitle>
              <CardDescription>
                Future price changes that will take effect automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPricing.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No scheduled price changes
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPricing.map((price) => (
                    <ScheduledPriceCard
                      key={price.id}
                      pricing={price}
                      onUpdate={handlePricingUpdate}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Price Change History</CardTitle>
              <CardDescription>
                View all historical price changes and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PriceHistoryTimeline />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

