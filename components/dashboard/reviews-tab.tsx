'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CustomerRatings } from '@/components/dashboard/customer-ratings';
import { CustomerReviews } from '@/components/dashboard/customer-reviews';

export function ReviewsTab() {
  return (
    <div className="space-y-6">
      {/* Ratings I Received Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <CustomerRatings />
        </CardContent>
      </Card>

      {/* Reviews I Wrote Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <CustomerReviews />
        </CardContent>
      </Card>
    </div>
  );
}
