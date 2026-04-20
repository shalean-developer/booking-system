'use client';

import { useEffect } from 'react';
import { logSEOPageVisit } from '@/lib/growth/growthEngine';
import { persistGrowthEvent } from '@/lib/growth/persist-event';

export function SeoPageViewLogger(props: {
  service: string;
  area_slug: string;
  path: string;
}) {
  useEffect(() => {
    void persistGrowthEvent(logSEOPageVisit(props));
  }, [props.service, props.area_slug, props.path]);

  return null;
}
