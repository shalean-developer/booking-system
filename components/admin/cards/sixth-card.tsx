'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SixthCard() {
  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Additional Metrics</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
          Placeholder for additional dashboard metrics
        </div>
      </CardContent>
    </Card>
  );
}

