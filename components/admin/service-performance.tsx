'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { motion } from 'framer-motion';

interface ServicePerformanceProps {
  serviceTypeBreakdown?: Record<string, { bookings: number; revenue: number }>;
  recentServiceTypeBreakdown?: Record<string, { bookings: number; revenue: number }>;
}

export function ServicePerformance({ serviceTypeBreakdown, recentServiceTypeBreakdown }: ServicePerformanceProps) {
  if (!serviceTypeBreakdown || Object.keys(serviceTypeBreakdown).length === 0) {
    return null;
  }

  // Calculate total revenue and bookings for percentage calculations
  const totalRevenue = Object.values(serviceTypeBreakdown).reduce((sum, s) => sum + s.revenue, 0);
  const totalBookings = Object.values(serviceTypeBreakdown).reduce((sum, s) => sum + s.bookings, 0);

  // Sort services by revenue (descending)
  const sortedServices = Object.entries(serviceTypeBreakdown)
    .map(([type, data]) => ({
      type,
      ...data,
      recent: recentServiceTypeBreakdown?.[type] || { bookings: 0, revenue: 0 },
      revenuePercent: (data.revenue / totalRevenue) * 100,
      bookingPercent: (data.bookings / totalBookings) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Get top 3 performing services
  const topServices = sortedServices.slice(0, 3);

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Service Performance</h3>
      </div>

      {/* Top 3 Services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topServices.map((service, index) => (
          <motion.div
            key={service.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg">
                TOP
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium line-clamp-1">
                {service.type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(service.revenue)}</div>
                  <div className="text-xs text-gray-600">Total Revenue</div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Bookings</span>
                    <span className="font-semibold">{service.bookings}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Avg Value</span>
                    <span className="font-semibold">
                      {service.bookings > 0 ? formatCurrency(Math.round(service.revenue / service.bookings)) : 'R0'}
                    </span>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="pt-2 space-y-1">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Revenue Share</span>
                      <span className="font-medium">{service.revenuePercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${service.revenuePercent}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Booking Share</span>
                      <span className="font-medium">{service.bookingPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${service.bookingPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>

      {/* All Services Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Services Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Service Type</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Revenue</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Bookings</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Avg Value</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Share</th>
                </tr>
              </thead>
              <tbody>
                {sortedServices.map((service) => (
                  <tr key={service.type} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm font-medium">{service.type}</td>
                    <td className="py-2 px-3 text-sm text-right">{formatCurrency(service.revenue)}</td>
                    <td className="py-2 px-3 text-sm text-right">{service.bookings}</td>
                    <td className="py-2 px-3 text-sm text-right">
                      {service.bookings > 0 ? formatCurrency(Math.round(service.revenue / service.bookings)) : 'R0'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${service.revenuePercent}%` }}
                          />
                        </div>
                        <span className="text-gray-600 w-8">{service.revenuePercent.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold bg-gray-50">
                  <td className="py-2 px-3 text-sm">Total</td>
                  <td className="py-2 px-3 text-sm text-right">{formatCurrency(totalRevenue)}</td>
                  <td className="py-2 px-3 text-sm text-right">{totalBookings}</td>
                  <td className="py-2 px-3 text-sm text-right">
                    {totalBookings > 0 ? formatCurrency(Math.round(totalRevenue / totalBookings)) : 'R0'}
                  </td>
                  <td className="py-2 px-3 text-sm text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

