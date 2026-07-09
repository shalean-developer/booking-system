-- Locked financial snapshot at payment time (ZAR whole numbers; margin is percentage points).

alter table public.bookings
  add column if not exists revenue_zar integer,
  add column if not exists cleaner_cost_zar integer,
  add column if not exists profit_zar integer,
  add column if not exists margin_percent numeric(10, 4);

comment on column public.bookings.revenue_zar is 'Authoritative revenue (ZAR) from pricing snapshot final_price at payment.';
comment on column public.bookings.cleaner_cost_zar is 'Estimated labour cost (ZAR) from snapshot duration × cleaner hourly rate.';
comment on column public.bookings.profit_zar is 'revenue_zar - cleaner_cost_zar at payment.';
comment on column public.bookings.margin_percent is 'profit / revenue * 100 when revenue > 0.';
