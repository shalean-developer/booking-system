import { createServiceClient } from '@/lib/supabase-server';
import { ymdTodayInBusinessTz } from '@/lib/admin-dashboard-business-range';
import { fetchSupplyStatusRows } from '@/lib/supply/supply-status-admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SupplyStatusRow } from '@/lib/supply/supply-status-admin';

function statusBadgeClass(status: SupplyStatusRow['status']) {
  switch (status) {
    case 'shortage':
      return 'bg-red-100 text-red-900 border-red-200';
    case 'balanced':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'oversupply':
      return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default async function AdminSupplyStatusPage() {
  const dateYmd = ymdTodayInBusinessTz();
  const supabase = createServiceClient();
  const rows = await fetchSupplyStatusRows(supabase, dateYmd);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Supply status</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Labour demand vs cleaner pool by area and time bucket for{' '}
          <span className="font-mono tabular-nums">{dateYmd}</span> (business timezone).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketplace balance</CardTitle>
          <CardDescription>
            Red: shortage (demand exceeds supply). Yellow: balanced. Green: oversupply. Surge pricing
            still applies from the demand engine when supply is tight.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No active bookings with area data for this date.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">Demand (h)</TableHead>
                  <TableHead className="text-right">Supply (h)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={`${r.area}-${r.time}-${i}`}>
                    <TableCell className="font-mono text-sm">{r.time}</TableCell>
                    <TableCell>{r.area}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.demand_hours.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.supply_hours.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
