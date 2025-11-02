/**
 * Business Pipeline component
 */

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { BusinessPipeline as BusinessPipelineType } from './types';

export interface BusinessPipelineProps {
  pipeline: BusinessPipelineType;
}

export const BusinessPipeline = memo(function BusinessPipeline({
  pipeline,
}: BusinessPipelineProps) {
  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Business Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 border rounded-lg">
            <div className="text-sm text-muted-foreground">Quote Requests</div>
            <div className="text-xl font-semibold mt-1">{pipeline.quotes}</div>
            <div className="text-xs text-muted-foreground mt-1">Conversion {pipeline.conversion}%</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-sm text-muted-foreground">Cleaner Applications</div>
            <div className="text-xl font-semibold mt-1">{pipeline.applications}</div>
            <div className="text-xs text-muted-foreground mt-1">Review Rate {pipeline.reviewRate}%</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-sm text-muted-foreground">Customer Health</div>
            <div className="text-xl font-semibold mt-1">52</div>
            <div className="text-xs text-muted-foreground mt-1">Retention {pipeline.retention}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BusinessPipeline.displayName = 'BusinessPipeline';

