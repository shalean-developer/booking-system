'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Service {
  service_type: string;
  base: number;
  bedroom: number;
  bathroom: number;
  raw_records: Array<{
    id: string;
    price_type: string;
    price: number;
    effective_date: string;
    end_date: string | null;
    notes: string | null;
  }>;
}

interface CheckResult {
  success: boolean;
  services: Service[];
  total_services: number;
  pricing_summary: {
    services_count: number;
    extras_count: number;
    service_fee: number;
    frequency_discounts_count: number;
  };
  raw_data_count: number;
  error?: string;
}

export default function CheckServicesPage() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/services/check');
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to check services');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkServices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Database Services Check</h1>
          <Button onClick={checkServices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading && (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Loading services from database...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-600 font-semibold">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <>
            {/* Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Services</p>
                    <p className="text-2xl font-bold text-gray-900">{result.total_services}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Services Count</p>
                    <p className="text-2xl font-bold text-gray-900">{result.pricing_summary.services_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Extras Count</p>
                    <p className="text-2xl font-bold text-gray-900">{result.pricing_summary.extras_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Fee</p>
                    <p className="text-2xl font-bold text-gray-900">R{result.pricing_summary.service_fee}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Raw Records Count</p>
                  <p className="text-lg font-semibold text-gray-900">{result.raw_data_count}</p>
                </div>
              </CardContent>
            </Card>

            {/* Services List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Services in Database</h2>
              
              {result.services.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-600">No services found in database.</p>
                  </CardContent>
                </Card>
              ) : (
                result.services.map((service) => (
                  <Card key={service.service_type}>
                    <CardHeader>
                      <CardTitle className="text-xl">{service.service_type}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Base Price</p>
                          <p className="text-lg font-semibold text-gray-900">R{service.base}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Per Bedroom</p>
                          <p className="text-lg font-semibold text-gray-900">R{service.bedroom}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Per Bathroom</p>
                          <p className="text-lg font-semibold text-gray-900">R{service.bathroom}</p>
                        </div>
                      </div>
                      
                      {service.raw_records.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Pricing Records:</p>
                          <div className="space-y-2">
                            {service.raw_records.map((record) => (
                              <div
                                key={record.id}
                                className="bg-gray-50 p-3 rounded border border-gray-200"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">
                                    {record.price_type}: R{record.price}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Effective: {record.effective_date}
                                    {record.end_date && ` - ${record.end_date}`}
                                  </span>
                                </div>
                                {record.notes && (
                                  <p className="text-xs text-gray-600 mt-1">{record.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

